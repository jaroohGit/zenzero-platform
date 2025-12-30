const mqtt = require('mqtt')
const express = require('express')
const cors = require('cors')
const http = require('http')
const WebSocket = require('ws')

// Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const HTTP_PORT = process.env.HTTP_PORT || 3002
const WS_PORT = process.env.WS_PORT || 8086
const CLIENT_ID = `mqtt-monitor-${Math.random().toString(16).slice(3)}`

// Express app for REST API
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

// HTTP Server
const httpServer = http.createServer(app)

// WebSocket Server for real-time updates
const wss = new WebSocket.Server({ server: httpServer })

// Data storage
const messageHistory = []
const MAX_HISTORY = 1000
const topicStats = {}
const latestByTopic = {}

console.log('🚀 Starting MQTT Monitor Backend')
console.log(`📡 MQTT Broker: ${BROKER_URL}`)
console.log(`🌐 HTTP Port: ${HTTP_PORT}`)
console.log(`🔌 WebSocket Port: ${HTTP_PORT} (same server)`)

// Connect to MQTT Broker with wildcard subscription
const mqttClient = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
})

mqttClient.on('connect', () => {
  console.log('✓ Connected to MQTT Broker')
  
  // Subscribe to specific topic only
  const specificTopic = 'zenzero/wwt02'
  mqttClient.subscribe(specificTopic, { qos: 0 }, (err) => {
    if (err) {
      console.error('✗ Subscription error:', err)
    } else {
      console.log(`✓ Subscribed to topic: ${specificTopic}`)
    }
  })
  
  console.log('📡 Monitoring zenzero/wwt02 topic only...\n')
})

mqttClient.on('message', (topic, message) => {
  const timestamp = new Date().toISOString()
  let parsedData = null
  let rawMessage = message.toString()
  
  // Try to parse as JSON
  try {
    parsedData = JSON.parse(rawMessage)
  } catch (e) {
    // Keep as string if not JSON
    parsedData = rawMessage
  }
  
  // Create message object
  const messageObj = {
    id: Date.now() + Math.random(),
    topic,
    timestamp,
    payload: parsedData,
    raw: rawMessage,
    size: message.length
  }
  
  // Update statistics
  if (!topicStats[topic]) {
    topicStats[topic] = {
      count: 0,
      firstSeen: timestamp,
      lastSeen: timestamp
    }
  }
  topicStats[topic].count++
  topicStats[topic].lastSeen = timestamp
  
  // Store latest message per topic
  latestByTopic[topic] = messageObj
  
  // Add to history (with size limit)
  messageHistory.unshift(messageObj)
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory.pop()
  }
  
  // Broadcast to WebSocket clients
  const wsPayload = JSON.stringify({
    type: 'message',
    data: messageObj
  })
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(wsPayload)
    }
  })
  
  console.log(`[${new Date().toLocaleTimeString()}] ${topic} (${message.length} bytes) → ${wss.clients.size} clients`)
})

mqttClient.on('error', (err) => {
  console.error('✗ MQTT Error:', err.message)
})

mqttClient.on('close', () => {
  console.log('⚠ Disconnected from MQTT Broker')
})

mqttClient.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT Broker...')
})

// REST API Endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient.connected ? 'connected' : 'disconnected',
    websocketConnections: wss.clients.size,
    totalMessages: messageHistory.length,
    topicsCount: Object.keys(topicStats).length
  })
})

// Get all message history
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 100
  res.json({
    messages: messageHistory.slice(0, limit),
    total: messageHistory.length
  })
})

// Get messages by topic
app.get('/api/messages/:topic', (req, res) => {
  const topic = decodeURIComponent(req.params.topic)
  const limit = parseInt(req.query.limit) || 100
  const filtered = messageHistory.filter(msg => msg.topic === topic).slice(0, limit)
  res.json({
    topic,
    messages: filtered,
    total: filtered.length
  })
})

// Get all topics with statistics
app.get('/api/topics', (req, res) => {
  const topics = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    ...stats,
    latestMessage: latestByTopic[topic]
  }))
  res.json({
    topics,
    count: topics.length
  })
})

// Get latest message for each topic
app.get('/api/latest', (req, res) => {
  res.json(latestByTopic)
})

// Get statistics
app.get('/api/stats', (req, res) => {
  res.json({
    totalMessages: messageHistory.length,
    topicsCount: Object.keys(topicStats).length,
    topics: topicStats,
    mqttConnected: mqttClient.connected,
    uptime: process.uptime()
  })
})

// Clear history
app.post('/api/clear', (req, res) => {
  const previousCount = messageHistory.length
  messageHistory.length = 0
  Object.keys(topicStats).forEach(key => delete topicStats[key])
  Object.keys(latestByTopic).forEach(key => delete latestByTopic[key])
  res.json({
    success: true,
    cleared: previousCount
  })
})

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress
  console.log(`✓ WebSocket client connected from ${clientIp} (Total: ${wss.clients.size})`)
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MQTT Monitor',
    timestamp: new Date().toISOString()
  }))
  
  // Send current statistics
  ws.send(JSON.stringify({
    type: 'stats',
    data: {
      totalMessages: messageHistory.length,
      topicsCount: Object.keys(topicStats).length,
      topics: Object.keys(topicStats)
    }
  }))
  
  // Send recent messages
  ws.send(JSON.stringify({
    type: 'history',
    data: messageHistory.slice(0, 50)
  }))
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received from client:', data)
      
      // Handle client requests
      if (data.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }))
      }
    } catch (e) {
      console.error('Error parsing client message:', e)
    }
  })
  
  ws.on('close', () => {
    console.log(`✗ WebSocket client disconnected (Remaining: ${wss.clients.size})`)
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message)
  })
})

// Start HTTP server (includes WebSocket)
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`\n✓ MQTT Monitor Backend started`)
  console.log(`  HTTP API: http://localhost:${HTTP_PORT}`)
  console.log(`  WebSocket: ws://localhost:${HTTP_PORT}`)
  console.log(`  Dashboard: http://localhost:${HTTP_PORT}/mqtt-monitor.html\n`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down MQTT Monitor...')
  
  // Close WebSocket connections
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down')
  })
  
  // Close WebSocket server
  wss.close(() => {
    console.log('✓ WebSocket server closed')
    
    // Disconnect from MQTT
    mqttClient.end(() => {
      console.log('✓ Disconnected from MQTT broker')
      httpServer.close(() => {
        console.log('✓ HTTP server closed')
        process.exit(0)
      })
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
