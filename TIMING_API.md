# Timing System API Documentation

## Overview

The Timing System API provides endpoints for hardware timing systems (Mac Mini + Arduino + Camera) to interact with the brick race application. It uses service role authentication to bypass RLS policies and provides real-time race management capabilities.

## Authentication

All timing endpoints require authentication using an API key in the Authorization header:

```bash
Authorization: Bearer {TIMING_SYSTEM_API_KEY}
```

The API key is configured in the environment variable `TIMING_SYSTEM_API_KEY`.

## Base URL

```
http://localhost:3001/api/timing/
```

## Endpoints

### 1. Get Race Status

**GET** `/api/timing/status`

Returns the current race state, active heat, upcoming heats, and progress information.

#### Response

```json
{
  "race": {
    "id": "uuid",
    "name": "Race Name",
    "date": "2025-10-11"
  },
  "current_heat": {
    "heat_number": 9,
    "status": "in_progress",
    "racers": [
      {
        "track_number": 1,
        "racer_id": "uuid",
        "racer_name": "Baby Racer",
        "racer_number": 1,
        "current_time": 0
      },
      {
        "track_number": 2,
        "racer_id": "uuid", 
        "racer_name": "Thunder",
        "racer_number": 2,
        "current_time": 0
      }
    ]
  },
  "upcoming_heats": [
    {
      "heat_number": 10,
      "scheduled_order": 10,
      "status": "scheduled",
      "racers": [...]
    }
  ],
  "progress": {
    "total_heats": 11,
    "completed_heats": 5,
    "remaining_heats": 6,
    "percent_complete": 45
  },
  "timestamp": "2025-08-16T05:03:24.431Z"
}
```

If no active race is found:
```json
{
  "race": null,
  "current_heat": null,
  "upcoming_heats": [],
  "message": "No active race found"
}
```

### 2. Record Race Times

**POST** `/api/timing/record-times`

Records times for a completed heat and automatically advances to the next heat.

#### Request Body

```json
{
  "heat_number": 9,
  "track1_time": 3.89,
  "track2_time": 4.12,
  "auto_advance": true
}
```

#### Parameters

- `heat_number` (required): The heat number to record times for
- `track1_time` (optional): Time in seconds for track 1 racer
- `track2_time` (optional): Time in seconds for track 2 racer  
- `auto_advance` (optional): Whether to automatically start the next heat (default: true)

#### Response

```json
{
  "success": true,
  "message": "Heat 9 completed successfully",
  "heat_number": 9,
  "times": {
    "track1": 3.89,
    "track2": 4.12
  },
  "next_heat_started": true,
  "next_heat_number": 10
}
```

### 3. Generate Heats

**POST** `/api/timing/generate-heats`

Generates qualifying heats for checked-in racers.

#### Request Body

```json
{
  "race_id": "uuid"
}
```

#### Parameters

- `race_id` (optional): Specific race ID. If not provided, uses the active race

#### Response

```json
{
  "success": true,
  "message": "Heats generated successfully",
  "race_id": "uuid",
  "racers_checked_in": 5,
  "heats_generated": 5
}
```

### 4. Start Heat

**POST** `/api/timing/start-heat`

Manually starts a specific heat (changes status from 'scheduled' to 'in_progress').

#### Request Body

```json
{
  "heat_number": 10,
  "race_id": "uuid"
}
```

#### Parameters

- `heat_number` (required): The heat number to start
- `race_id` (optional): Specific race ID. If not provided, uses the active race

#### Response

```json
{
  "success": true,
  "message": "Heat 10 started successfully",
  "heat_number": 10,
  "racers": [...]
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "statusMessage": "Invalid or missing timing system API key"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "statusMessage": "Heat not found"
}
```

### 500 Server Error
```json
{
  "statusCode": 500,
  "statusMessage": "No active race found"
}
```

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Timing System Authentication  
TIMING_SYSTEM_API_KEY=your-timing-api-key
```

## Hardware Integration Example

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:3001/api/timing"
API_KEY = "your-timing-api-key"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Get current race status
def get_race_status():
    response = requests.get(f"{BASE_URL}/status", headers=HEADERS)
    return response.json()

# Record times for completed heat
def record_times(heat_number, track1_time, track2_time):
    data = {
        "heat_number": heat_number,
        "track1_time": track1_time,
        "track2_time": track2_time
    }
    response = requests.post(f"{BASE_URL}/record-times", 
                           headers=HEADERS, 
                           data=json.dumps(data))
    return response.json()

# Example usage
status = get_race_status()
if status["current_heat"]:
    heat_num = status["current_heat"]["heat_number"]
    result = record_times(heat_num, 4.56, 5.23)
    print(f"Heat {heat_num} completed: {result}")
```

## Database Functions

The timing system uses these PostgreSQL functions:

- `complete_heat(heat_num, track1_time, track2_time)` - Records times and marks heat as completed
- `generate_qualifier_heats(target_race_id)` - Generates new qualifying heats
- `get_next_heats(heat_count)` - Gets upcoming scheduled heats

## Auto-Heat Generation

When `qualifying_mode = 'auto'` for a race, completing a heat automatically generates new heats based on:

1. Racers with the fewest qualifying attempts
2. Ensuring 2 racers per heat (no single-racer heats)
3. Sequential heat numbering that accumulates across the race
4. Random pairing of eligible racers

## Troubleshooting

### "No active race found"
- Ensure a race is marked as `active = true` in the database
- Check that the service role key has access to the races table

### "Invalid API key" 
- Verify the `TIMING_SYSTEM_API_KEY` environment variable matches your configuration
- Ensure the `SUPABASE_SERVICE_KEY` is correct and current from your Supabase dashboard

### RLS Issues
- The service role key should bypass RLS policies
- If issues persist, verify RLS policies allow service role access

### Connection Issues
- Ensure the server is running and accessible
- Check that the base URL and port are correct
- Verify network connectivity between timing hardware and server