const aedes = require('aedes')()
const net = require('net')
const ws = require('ws')
const http = require('http')
const express = require('express')
const cors = require('cors')
const db = require('./database')

const app = express()
app.use(cors())
app.use(express.json())

// MQTT Broker Configuration
const MQTT_PORT = 1883
const WS_PORT = 8083
const HTTP_PORT = 3001

// Create MQTT TCP Server
const mqttServer = net.createServer(aedes.handle)

// Create WebSocket Server for MQTT over WebSocket
const httpServer = http.createServer(app)
const wsServer = new ws.Server({ server: httpServer })

wsServer.on('connection', (socket) => {
  const stream = ws.createWebSocketStream(socket)
  aedes.handle(stream)
})

// MQTT Broker Event Handlers
aedes.on('client', (client) => {
  console.log(`[MQTT] Client Connected: ${client.id}`)
})

aedes.on('clientDisconnect', (client) => {
  console.log(`[MQTT] Client Disconnected: ${client.id}`)
})

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`[MQTT] Client ${client.id} subscribed to topics:`, 
    subscriptions.map(s => s.topic).join(', '))
})

aedes.on('unsubscribe', (subscriptions, client) => {
  console.log(`[MQTT] Client ${client.id} unsubscribed from topics:`, 
    subscriptions.join(', '))
})

aedes.on('publish', async (packet, client) => {
  if (client) {
    console.log(`[MQTT] Message from ${client.id} to ${packet.topic}:`, 
      packet.payload.toString())
    
    // Note: Data storage is handled by mqtt-subscriber-wwt01.js
    // to prevent duplicate inserts. The subscriber listens to MQTT
    // and processes/stores data with proper parsing and validation.
  }
})

// REST API Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    broker: 'MQTT Broker',
    ports: {
      mqtt: MQTT_PORT,
      websocket: WS_PORT,
      http: HTTP_PORT
    }
  })
})

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    clients: aedes.clients ? Object.keys(aedes.clients).length : 0,
    uptime: process.uptime()
  })
})

app.get('/clients', (req, res) => {
  const clients = []
  if (aedes.clients) {
    for (let clientId in aedes.clients) {
      clients.push({
        id: clientId,
        clean: aedes.clients[clientId].clean,
        version: aedes.clients[clientId].version
      })
    }
  }
  res.json({ clients, count: clients.length })
})

// Publish endpoint
app.post('/publish', (req, res) => {
  const { topic, message, qos = 0 } = req.body
  
  if (!topic || !message) {
    return res.status(400).json({ error: 'Topic and message are required' })
  }

  aedes.publish({
    topic,
    payload: Buffer.from(message),
    qos,
    retain: false
  }, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json({ 
      success: true, 
      topic, 
      message,
      timestamp: new Date().toISOString()
    })
  })
})

// Database API endpoints
app.get('/api/ph-sensor-02/latest', async (req, res) => {
  try {
    const data = await db.getLatestPHSensor02()
    res.json(data || { message: 'No data available' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/ph-sensor-02/history', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 5
    const data = await db.getPHSensor02Data(minutes)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/ph-sensor-02/aggregated', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60
    const data = await db.getPHSensor02Aggregated(minutes)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/wwt01/history', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60
    const limit = parseInt(req.query.limit) || 1000
    const data = await db.getWWT01Data(minutes, limit)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/wwt01/latest', async (req, res) => {
  try {
    const data = await db.getLatestWWT01Data()
    res.json(data || { message: 'No data available' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Start Servers
mqttServer.listen(MQTT_PORT, () => {
  console.log(`🚀 MQTT Broker started on port ${MQTT_PORT}`)
  console.log(`   mqtt://localhost:${MQTT_PORT}`)
})

httpServer.listen(WS_PORT, '0.0.0.0', () => {
  console.log(`🌐 MQTT WebSocket started on port ${WS_PORT}`)
  console.log(`   ws://localhost:${WS_PORT}`)
})

app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`📡 HTTP API started on port ${HTTP_PORT}`)
  console.log(`   http://localhost:${HTTP_PORT}`)
})

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MQTT Broker...')
  aedes.close(() => {
    mqttServer.close(() => {
      httpServer.close(() => {
        console.log('✓ MQTT Broker stopped')
        process.exit(0)
      })
    })
  })
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down MQTT Broker...')
  aedes.close(() => {
    mqttServer.close(() => {
      httpServer.close(() => {
        console.log('✓ MQTT Broker stopped')
        process.exit(0)
      })
    })
  })
})
