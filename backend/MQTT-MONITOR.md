# MQTT Monitor - Real-time Topic Viewer

A comprehensive monitoring solution for viewing all MQTT messages from every topic in real-time.

## 📋 Overview

The MQTT Monitor consists of:
- **Backend Service** (`mqtt-monitor-backend.js`): Node.js server that subscribes to all MQTT topics using wildcard subscription
- **Web Dashboard** (`mqtt-monitor.html`): Real-time web interface for viewing messages

## ✨ Features

### Backend
- 🔍 **Wildcard Subscription**: Automatically subscribes to ALL MQTT topics using `#` wildcard
- 📊 **Message History**: Stores up to 1000 recent messages
- 📈 **Topic Statistics**: Tracks message count and timestamps per topic
- 🔌 **WebSocket Server**: Real-time push updates to connected clients
- 🌐 **REST API**: HTTP endpoints for querying message history and statistics
- 💾 **Latest Cache**: Maintains the latest message for each topic

### Dashboard
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎯 **Topic Filtering**: Filter messages by topic name or content
- ⏸️ **Pause/Resume**: Control message flow without losing connection
- 📋 **Topic List**: Sidebar showing all active topics with statistics
- 🔄 **Real-time Updates**: Instant message display via WebSocket
- 📊 **Live Statistics**: Message count, active topics, and messages per minute
- 🗑️ **Clear Functions**: Clear display or entire server history
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations

## 🚀 Quick Start

### 1. Start the MQTT Broker (if not running)
```bash
npm start
# or
node mqtt-broker.js
```

### 2. Start the Monitor Backend
```bash
npm run monitor
# or with auto-reload for development
npm run monitor-dev
```

### 3. Open the Dashboard
Open your browser and navigate to:
```
http://localhost:3002/mqtt-monitor.html
```

## 🔧 Configuration

### Environment Variables

```bash
# MQTT Broker URL
MQTT_BROKER=mqtt://localhost:1883

# HTTP API Port (also serves WebSocket on same port)
HTTP_PORT=3002
```

### Default Ports

| Service | Port | Protocol |
|---------|------|----------|
| HTTP API | 3002 | HTTP |
| WebSocket | 3002 | WS |
| MQTT Broker | 1883 | MQTT |

## 📡 API Endpoints

### Health Check
```http
GET /health
```
Returns server status, connection info, and statistics.

### Get All Messages
```http
GET /api/messages?limit=100
```
Returns recent message history (default: 100 messages).

### Get Messages by Topic
```http
GET /api/messages/:topic?limit=100
```
Returns messages for a specific topic.

### Get All Topics
```http
GET /api/topics
```
Returns all topics with statistics and latest messages.

### Get Latest Messages
```http
GET /api/latest
```
Returns the latest message for each topic.

### Get Statistics
```http
GET /api/stats
```
Returns overall statistics and MQTT connection status.

### Clear History
```http
POST /api/clear
```
Clears all message history from server memory.

## 🔌 WebSocket Messages

### From Server

#### Welcome Message
```json
{
  "type": "welcome",
  "message": "Connected to MQTT Monitor",
  "timestamp": "2025-12-13T10:30:00.000Z"
}
```

#### Stats Update
```json
{
  "type": "stats",
  "data": {
    "totalMessages": 150,
    "topicsCount": 5,
    "topics": ["topic1", "topic2"]
  }
}
```

#### Message History
```json
{
  "type": "history",
  "data": [
    {
      "id": 1702468200000.123,
      "topic": "zenzero/wwt01",
      "timestamp": "2025-12-13T10:30:00.000Z",
      "payload": {...},
      "raw": "{...}",
      "size": 145
    }
  ]
}
```

#### New Message
```json
{
  "type": "message",
  "data": {
    "id": 1702468200000.123,
    "topic": "zenzero/wwt01",
    "timestamp": "2025-12-13T10:30:00.000Z",
    "payload": {...},
    "raw": "{...}",
    "size": 145
  }
}
```

### From Client

#### Ping
```json
{
  "type": "ping"
}
```

Server responds with:
```json
{
  "type": "pong",
  "timestamp": "2025-12-13T10:30:00.000Z"
}
```

## 🎯 Usage Examples

### Starting the Monitor
```bash
cd /home/teddy/deploy/backend

# Start with npm
npm run monitor

# Or directly with Node.js
node mqtt-monitor-backend.js

# Or with custom configuration
MQTT_BROKER=mqtt://192.168.1.100:1883 HTTP_PORT=3003 node mqtt-monitor-backend.js
```

### Viewing Messages
1. Open `http://localhost:3002/mqtt-monitor.html`
2. Messages will appear automatically as they arrive
3. Click on a topic in the sidebar to filter messages
4. Use the search box to filter by topic name or content
5. Use pause/resume to control message flow

### Querying via API
```bash
# Get recent messages
curl http://localhost:3002/api/messages?limit=10

# Get all topics
curl http://localhost:3002/api/topics

# Get statistics
curl http://localhost:3002/api/stats

# Clear history
curl -X POST http://localhost:3002/api/clear
```

## 🏗️ Architecture

```
┌─────────────────┐
│  MQTT Broker    │
│  (Port 1883)    │
└────────┬────────┘
         │
         │ Subscribe to #
         │ (all topics)
         ▼
┌─────────────────────────┐
│  Monitor Backend        │
│  - Message Storage      │
│  - Topic Statistics     │
│  - REST API (Port 3002) │
│  - WebSocket Server     │
└────────┬────────────────┘
         │
         │ WebSocket / HTTP
         ▼
┌─────────────────────────┐
│  Web Dashboard          │
│  - Real-time Display    │
│  - Topic Filtering      │
│  - Message History      │
└─────────────────────────┘
```

## 📊 Message Storage

- **In-Memory Storage**: Messages stored in memory (no database required)
- **Size Limit**: Maximum 1000 messages (configurable in code via `MAX_HISTORY`)
- **Oldest Messages**: Automatically removed when limit is reached
- **Per-Topic Cache**: Latest message for each topic is always available
- **Statistics**: Message counts and timestamps maintained per topic

## 🎨 Dashboard Features

### Stats Cards
- **Total Messages**: Cumulative count since server start
- **Active Topics**: Number of unique topics seen
- **Messages/Min**: Rate calculation (updated every minute)
- **Connection**: WebSocket connection status

### Controls
- **Filter Input**: Search/filter messages by topic or content
- **Pause/Resume**: Stop receiving new messages temporarily
- **Clear Display**: Clear messages from browser (server retains history)
- **Clear All History**: Delete all messages from server memory
- **Limit Selector**: Choose how many messages to keep (50/100/200/500)

### Topics Panel
- Lists all topics with message counts
- Shows last seen timestamp
- Click to filter messages by topic
- Sorted by most recent activity

### Messages Panel
- Displays messages in reverse chronological order
- Shows topic, timestamp, payload, and metadata
- JSON payloads are formatted for readability
- Each message shows size in bytes and unique ID
- Smooth animations for new messages

## 🔒 Security Notes

- Default configuration listens on all interfaces (`0.0.0.0`)
- No authentication is implemented (suitable for internal networks)
- CORS is enabled for all origins
- Consider adding authentication for production use
- Limit access via firewall rules in production environments

## 🐛 Troubleshooting

### Monitor won't start
- Check if port 3002 is already in use
- Verify MQTT broker is running on port 1883
- Check Node.js and npm are installed

### WebSocket won't connect
- Verify the monitor backend is running
- Check browser console for errors
- Ensure no firewall blocking port 3002

### No messages appearing
- Verify MQTT broker is running
- Check if messages are being published to topics
- Look at monitor backend console for connection status
- Try publishing a test message using `mqtt-publisher.js`

### Performance issues
- Reduce message limit in dropdown (use 50 instead of 500)
- Use topic filtering to reduce displayed messages
- Clear history periodically
- Consider adjusting `MAX_HISTORY` in backend code

## 📝 Development

### Project Structure
```
deploy/backend/
├── mqtt-monitor-backend.js   # Backend service
├── mqtt-monitor.html          # Web dashboard
├── MQTT-MONITOR.md           # This documentation
└── package.json              # npm scripts
```

### Adding Features

To modify the backend:
- Edit `mqtt-monitor-backend.js`
- Restart with `npm run monitor`

To modify the dashboard:
- Edit `mqtt-monitor.html`
- Refresh browser (no restart needed)

### Running in Production

Consider using PM2 for process management:
```bash
# Install PM2
npm install -g pm2

# Start monitor with PM2
pm2 start mqtt-monitor-backend.js --name mqtt-monitor

# View logs
pm2 logs mqtt-monitor

# Restart
pm2 restart mqtt-monitor
```

## 🔗 Related Services

- `mqtt-broker.js` - Main MQTT broker
- `websocket-server.js` - WebSocket bridge for specific topics
- `mqtt-subscriber.js` - Simple subscriber for single topic
- `mqtt-publisher.js` - Test message publisher

## 📄 License

This is part of the MQTT deployment project.
