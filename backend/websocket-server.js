const mqtt = require('mqtt')
const WebSocket = require('ws')
const http = require('http')

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const MQTT_TOPICS = ['zenzero/wwt01', 'zenzero/wwt02']
const CLIENT_ID = `websocket-bridge-${Math.random().toString(16).slice(3)}`

// WebSocket Server Configuration
const WS_PORT = process.env.WS_PORT || 8085

console.log('🚀 Starting WebSocket Bridge Server')
console.log(`📡 MQTT Broker: ${BROKER_URL}`)
console.log(`🔌 WebSocket Port: ${WS_PORT}`)

// Create HTTP server for WebSocket
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', connections: wss.clients.size }))
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('WebSocket Bridge Server')
  }
})

// Create WebSocket server
const wss = new WebSocket.Server({ server })

// Store connected clients
const clients = new Set()

// Latest data cache for new connections
const latestData = {
  'zenzero/wwt01': null,
  'zenzero/wwt02': null
}

// Connect to MQTT Broker
const mqttClient = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
})

mqttClient.on('connect', () => {
  console.log('✓ Connected to MQTT Broker')
  
  // Subscribe to all topics
  MQTT_TOPICS.forEach(topic => {
    mqttClient.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error(`✗ Subscription error for ${topic}:`, err)
      } else {
        console.log(`✓ Subscribed to: ${topic}`)
      }
    })
  })
  
  console.log('📡 Waiting for MQTT messages...\n')
})

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString())
    data.timestamp = data.timestamp || new Date().toISOString()
    
    // Cache latest data
    latestData[topic] = data
    
    // Broadcast to all connected WebSocket clients
    const payload = JSON.stringify({
      topic,
      data,
      timestamp: new Date().toISOString()
    })
    
    let sentCount = 0
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
        sentCount++
      }
    })
    
    console.log(`[${new Date().toLocaleTimeString()}] ${topic} → ${sentCount} clients`)
  } catch (e) {
    console.error('Error parsing MQTT message:', e)
  }
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

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress
  console.log(`✓ WebSocket client connected from ${clientIp} (Total: ${wss.clients.size})`)
  
  clients.add(ws)
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to WebSocket Bridge Server',
    topics: MQTT_TOPICS,
    timestamp: new Date().toISOString()
  }))
  
  // Send latest cached data
  Object.entries(latestData).forEach(([topic, data]) => {
    if (data) {
      ws.send(JSON.stringify({
        topic,
        data,
        timestamp: new Date().toISOString()
      }))
    }
  })
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received from client:', data)
      
      // Echo back as acknowledgment
      ws.send(JSON.stringify({
        type: 'ack',
        received: data,
        timestamp: new Date().toISOString()
      }))
    } catch (e) {
      console.error('Error parsing client message:', e)
    }
  })
  
  ws.on('close', () => {
    clients.delete(ws)
    console.log(`✗ WebSocket client disconnected (Remaining: ${wss.clients.size})`)
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message)
  })
})

// Start server
server.listen(WS_PORT, () => {
  console.log(`\n✓ WebSocket Server listening on port ${WS_PORT}`)
  console.log(`  Health check: http://localhost:${WS_PORT}/health`)
  console.log(`  WebSocket URL: ws://localhost:${WS_PORT}\n`)
})

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down server...')
  
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
      server.close(() => {
        console.log('✓ HTTP server closed')
        process.exit(0)
      })
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
