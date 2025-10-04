# BrickRace MQTT Server

An MQTT server for the BrickRace timing system that connects to the race timing API and publishes race information to MQTT topics.

## Features

- Connects to local MQTT broker
- Fetches current and upcoming heat information from the BrickRace API
- Publishes race data to MQTT topics for timing displays
- Handles release timing from ESP devices

## Prerequisites

- Node.js (v18 or higher)
- MQTT broker running on localhost (default port 1883)

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Watch mode (auto-restart on changes)
```bash
npm run watch
```

## MQTT Topics

- `ondeck` - Publishes current and upcoming racer information
- `release` - Subscribes to timing release messages from ESP devices

## Configuration

The server connects to:
- MQTT broker: `mqtt://localhost`
- BrickRace API: `https://brickrace.netlify.app/api/timing`
- API Key: `test-timing-key-12345`

## Data Flow

1. Server fetches race status from the BrickRace timing API every 5 seconds
2. Formats racer data for current and upcoming heats
3. Publishes formatted data to the `ondeck` topic
4. Listens for release timing messages on the `release` topic
5. Calculates timing offsets for synchronization

## Output Format

The `ondeck` topic receives data in the format: `leftRacers,rightRacers`

Where each racer number is padded to 4 characters, for example:
`   1   2   3,  10  11  12`