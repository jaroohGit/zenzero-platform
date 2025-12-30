# WebSocket Bridge Setup

## Overview
The frontend now connects to a WebSocket bridge server instead of directly to the MQTT broker. This architecture provides better security and control over data flow.

## Architecture

```
MQTT Publishers → MQTT Broker → WebSocket Bridge → Frontend (Chart.js)
```

### Components

1. **MQTT Broker** (`mqtt-broker.js`)
   - Runs on port 1883 (TCP) and 8083 (WebSocket)
   - Handles MQTT message routing

2. **WebSocket Bridge** (`websocket-server.js`)
   - Runs on port 8085
   - Subscribes to MQTT topics: `zenzero/wwt01`, `zenzero/wwt02`
   - Broadcasts data to connected WebSocket clients
   - Caches latest data for new connections

3. **MQTT Publisher** (`mqtt-publisher.js`)
   - Publishes test data every 5 seconds
   - Includes flow_rate data in sensors object

4. **Frontend** (React/Vite + Chart.js)
   - Connects to WebSocket on port 8085
   - Displays real-time flow rate chart on dashboard
   - Shows latest and average flow rate values

## Running Locally

### Development Mode

Terminal 1 - MQTT Broker:
```bash
cd deploy/backend
npm install
npm start
```

Terminal 2 - WebSocket Bridge:
```bash
cd deploy/backend
npm run websocket
```

Terminal 3 - Publisher (optional, for testing):
```bash
cd deploy/backend
npm run publisher
```

Terminal 4 - Frontend:
```bash
cd deploy/frontend
npm install
npm run dev
```

Access at: http://localhost:5173

## Running with Docker

```bash
cd deploy
docker-compose up --build
```

Access at: http://localhost:80 or http://localhost:8888

## Ports

- **80/8888**: Frontend
- **1883**: MQTT TCP
- **8084**: MQTT WebSocket (legacy, not used by frontend)
- **8085**: WebSocket Bridge (used by frontend)
- **3001**: HTTP API (optional)

## Dashboard Features

### Flow Rate Chart
- Real-time line chart showing flow rate over time
- Displays last 20 data points
- Auto-updates as new data arrives
- Smooth animations with Chart.js

### Current Flow Rate
- Shows latest flow rate value
- Updates in real-time

### Average Flow Rate
- Calculates average of all data points in chart
- Updates automatically

## Data Format

WebSocket messages from bridge:
```json
{
  "topic": "zenzero/wwt01",
  "data": {
    "timestamp": "2025-12-13T...",
    "device_id": "wwt01",
    "location": "zenzero",
    "sensors": {
      "ph": "7.45",
      "temperature": "28.50",
      "dissolved_oxygen": "6.20",
      "turbidity": "15.30",
      "flow_rate": "125.45",
      "bod": "35.20",
      "cod": "75.80"
    },
    "status": "active"
  },
  "timestamp": "2025-12-13T..."
}
```

## Testing

Check WebSocket server health:
```bash
curl http://localhost:8085/health
```

## Troubleshooting

1. **Frontend shows "Disconnected"**
   - Ensure WebSocket bridge is running on port 8085
   - Check browser console for connection errors

2. **No data on chart**
   - Verify MQTT publisher is running
   - Check WebSocket bridge logs for incoming messages
   - Ensure you're on the Dashboard page

3. **Chart not displaying**
   - Navigate away and back to Dashboard to reinitialize
   - Check browser console for Chart.js errors
   - Verify Chart.js is installed: `npm list chart.js`

## Dependencies

Frontend:
- `chart.js ^4.4.0` - Chart visualization

Backend:
- `mqtt ^5.3.0` - MQTT client
- `ws ^8.16.0` - WebSocket server
- `aedes ^0.51.0` - MQTT broker
- `express ^4.18.2` - HTTP server
- `cors ^2.8.5` - CORS middleware
