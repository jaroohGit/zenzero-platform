const mqtt = require('mqtt')
const WebSocket = require('ws')
const http = require('http')
const express = require('express')
const cors = require('cors')
const database = require('./database')

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const MQTT_TOPICS = ['zenzero/wwt01', 'zenzero/wwt02']
const CLIENT_ID = `websocket-bridge-${Math.random().toString(16).slice(3)}`

// WebSocket Server Configuration
const WS_PORT = process.env.WS_PORT || 8085

console.log('🚀 Starting WebSocket Bridge Server')
console.log(`📡 MQTT Broker: ${BROKER_URL}`)
console.log(`🔌 WebSocket Port: ${WS_PORT}`)

// Create Express app
const app = express()
app.use(cors())
app.use(express.json())

// API Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: wss ? wss.clients.size : 0 })
})

// AT-02 Inlet Volume - Hourly Accumulation
app.get('/api/wwt01/at02-inlet-hourly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }
    
    console.log('[API] Fetching AT-02 inlet hourly data from', startDate, 'to', endDate)
    
    const query = `
      WITH hourly_data AS (
        SELECT 
          DATE_TRUNC('hour', time) as hour,
          at_02_level,
          time,
          FIRST_VALUE(at_02_level) OVER (PARTITION BY DATE_TRUNC('hour', time) ORDER BY time ASC) as first_level,
          FIRST_VALUE(at_02_level) OVER (PARTITION BY DATE_TRUNC('hour', time) ORDER BY time DESC) as last_level
        FROM wwt01_data
        WHERE time >= $1 AND time < $2
          AND at_02_level IS NOT NULL
      ),
      hourly_summary AS (
        SELECT DISTINCT
          hour,
          first_level,
          last_level
        FROM hourly_data
      )
      SELECT 
        hour,
        first_level,
        last_level,
        CASE 
          WHEN last_level > first_level 
          THEN (last_level - first_level) * 3500
          ELSE 0
        END as total_volume
      FROM hourly_summary
      ORDER BY hour;
    `
    
    const result = await database.pool.query(query, [startDate, endDate])
    
    console.log('[API] AT-02 hourly data:', result.rows.length, 'hours')
    
    res.json(result.rows)
    
  } catch (error) {
    console.error('[API] Error fetching AT-02 hourly data:', error)
    res.status(500).json({ error: error.message })
  }
})

// AT-02 Inlet Volume - Monthly Data
app.get('/api/wwt01/at02-inlet-monthly', async (req, res) => {
  try {
    console.log('[API] Fetching AT-02 inlet monthly data...')
    
    const query = `
      WITH monthly_data AS (
        SELECT 
          DATE_TRUNC('month', time) as month,
          time,
          at_02_level,
          LAG(at_02_level) OVER (PARTITION BY DATE_TRUNC('month', time) ORDER BY time) as prev_level
        FROM wwt01_data
        WHERE time >= DATE_TRUNC('month', NOW() - INTERVAL '2 years')
          AND at_02_level IS NOT NULL
        ORDER BY time
      ),
      monthly_increases AS (
        SELECT 
          month,
          CASE 
            WHEN at_02_level > COALESCE(prev_level, 0) 
            THEN (at_02_level - COALESCE(prev_level, 0)) * 3500
            ELSE 0
          END as volume_increase
        FROM monthly_data
      ),
      monthly_totals AS (
        SELECT 
          month,
          SUM(volume_increase) as total_volume,
          EXTRACT(YEAR FROM month)::INTEGER as year,
          EXTRACT(MONTH FROM month)::INTEGER as month_num
        FROM monthly_increases
        GROUP BY month
        ORDER BY month
      )
      SELECT 
        year,
        month_num,
        COALESCE(total_volume, 0) as total_volume
      FROM monthly_totals
      WHERE year >= EXTRACT(YEAR FROM NOW())::INTEGER - 1
      ORDER BY year, month_num;
    `
    
    const result = await database.pool.query(query)
    
    // Format data as arrays for chart
    const currentYear = new Date().getFullYear()
    const currentYearData = new Array(12).fill(0)
    const previousYearData = new Array(12).fill(0)
    
    result.rows.forEach(row => {
      const monthIndex = row.month_num - 1 // Convert to 0-11
      const volume = parseFloat(row.total_volume) || 0
      
      if (row.year === currentYear) {
        currentYearData[monthIndex] = volume
      } else if (row.year === currentYear - 1) {
        previousYearData[monthIndex] = volume
      }
    })
    
    console.log('[API] AT-02 inlet data processed:', {
      currentYear: currentYearData,
      previousYear: previousYearData
    })
    
    res.json({
      success: true,
      data: {
        currentYear: currentYearData,
        previousYear: previousYearData
      }
    })
    
  } catch (error) {
    console.error('[API] Error fetching AT-02 inlet data:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Create HTTP server for both WebSocket and API
const server = http.createServer(app)

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
