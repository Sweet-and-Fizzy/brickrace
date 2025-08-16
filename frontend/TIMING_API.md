# Race Timing System API

This API provides dedicated endpoints for hardware timing systems (Mac Mini + Arduino + Camera) to control race timing independently from the web interface.

## Authentication

All timing endpoints require an API key in the request headers:

```
X-API-Key: your-timing-api-key
```

Set the `TIMING_API_KEY` environment variable with a secure random key.

## Generate API Key

```bash
# Generate a secure random key
openssl rand -base64 32
```

## Endpoints

### 1. Get Race Status

**GET** `/api/timing/status`

Returns current race information, active heat, and upcoming heats.

**Response:**

```json
{
  "race": {
    "id": "uuid",
    "name": "Race Name",
    "date": "2025-01-08"
  },
  "current_heat": {
    "heat_number": 3,
    "status": "in_progress",
    "racers": [
      {
        "track_number": 1,
        "racer_id": "uuid",
        "racer_name": "Lightning Bolt",
        "racer_number": 42,
        "current_time": null
      },
      {
        "track_number": 2,
        "racer_id": "uuid",
        "racer_name": "Thunder Runner",
        "racer_number": 15,
        "current_time": null
      }
    ]
  },
  "upcoming_heats": [...],
  "progress": {
    "total_heats": 12,
    "completed_heats": 2,
    "remaining_heats": 10,
    "percent_complete": 17
  }
}
```

### 2. Generate Heats

**POST** `/api/timing/generate-heats`

Creates heat assignments for all checked-in racers.

**Request:**

```json
{
  "race_id": "uuid" // Optional, defaults to active race
}
```

**Response:**

```json
{
  "success": true,
  "message": "Heats generated successfully",
  "race_id": "uuid",
  "racers_checked_in": 24,
  "heats_generated": 12
}
```

### 3. Start Heat

**POST** `/api/timing/start-heat`

Marks a heat as "in progress" and ready for timing.

**Request:**

```json
{
  "heat_number": 3
}
```

**Response:**

```json
{
  "success": true,
  "message": "Heat 3 started successfully",
  "heat_number": 3,
  "race": {
    "id": "uuid",
    "name": "Race Name"
  }
}
```

### 4. Record Times

**POST** `/api/timing/record-times`

Records times for a completed heat and optionally advances to next heat.

**Request:**

```json
{
  "heat_number": 3,
  "track1_time": 3.456, // seconds (optional)
  "track2_time": 3.789, // seconds (optional)
  "auto_advance": true // auto-start next heat (default: true)
}
```

**Response:**

```json
{
  "success": true,
  "message": "Heat 3 completed successfully",
  "heat_number": 3,
  "times": {
    "track1": 3.456,
    "track2": 3.789
  },
  "next_heat_started": true,
  "next_heat_number": 4
}
```

## Example Timing System Flow

```python
import requests

API_BASE = "https://your-site.netlify.app/api/timing"
API_KEY = "your-timing-api-key"
headers = {"X-API-Key": API_KEY}

# 1. Check race status
status = requests.get(f"{API_BASE}/status", headers=headers).json()
print(f"Current race: {status['race']['name']}")

# 2. Generate heats if needed
if not status['current_heat'] and not status['upcoming_heats']:
    requests.post(f"{API_BASE}/generate-heats", headers=headers)
    print("Heats generated")

# 3. Start first heat
requests.post(f"{API_BASE}/start-heat",
              json={"heat_number": 1},
              headers=headers)
print("Heat 1 started")

# 4. Race happens... Arduino/camera detects finish times
track1_time = detect_finish_time_track1()  # Your timing logic
track2_time = detect_finish_time_track2()  # Your timing logic

# 5. Record times (auto-advances to next heat)
result = requests.post(f"{API_BASE}/record-times",
                      json={
                          "heat_number": 1,
                          "track1_time": track1_time,
                          "track2_time": track2_time
                      },
                      headers=headers).json()

print(f"Heat 1 completed. Next heat: {result['next_heat_number']}")
```

## Error Handling

All endpoints return standard HTTP status codes:

- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `500` - Server error

Error responses include a message:

```json
{
  "statusCode": 400,
  "statusMessage": "heat_number is required and must be a number"
}
```

## Logging

All timing system requests are logged with:

- Timestamp
- IP address
- Action performed
- Request data
- Success/error status

Check server logs for audit trail and debugging.
