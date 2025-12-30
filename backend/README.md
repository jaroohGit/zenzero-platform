# MQTT Broker Service

MQTT Broker service built with Aedes for Node.js.

## Features

- MQTT TCP on port 1883
- MQTT over WebSocket on port 8083
- REST API on port 3001
- Client management
- Publish/Subscribe support

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
npm start
```

## API Endpoints

### GET /
Get broker status and configuration

### GET /status
Get current broker status and connected clients count

### GET /clients
Get list of connected clients

### POST /publish
Publish a message to a topic

Request body:
```json
{
  "topic": "test/topic",
  "message": "Hello MQTT",
  "qos": 0
}
```

## Testing

```bash
node test-client.js
```

## Docker

```bash
docker build -t mqtt-broker .
docker run -p 1883:1883 -p 8083:8083 -p 3001:3001 mqtt-broker
```

## Connection Examples

### MQTT TCP
```
mqtt://localhost:1883
```

### WebSocket
```
ws://localhost:8083
```

### HTTP API
```
http://localhost:3001
```
