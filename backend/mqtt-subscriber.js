const mqtt = require('mqtt')

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const TOPIC = 'zenzero/wwt01'
const CLIENT_ID = `mqtt-subscriber-${Math.random().toString(16).slice(3)}`

console.log(`🔌 Connecting to MQTT Broker: ${BROKER_URL}`)
console.log(`📥 Subscribing to topic: ${TOPIC}`)

// Connect to MQTT Broker
const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
})

// Connection event
client.on('connect', () => {
  console.log(`✓ Connected to MQTT Broker`)
  console.log(`  Client ID: ${CLIENT_ID}`)
  
  // Subscribe to topic
  client.subscribe(TOPIC, { qos: 0 }, (err) => {
    if (err) {
      console.error('✗ Subscription error:', err)
      process.exit(1)
    }
    console.log(`✓ Subscribed to topic: ${TOPIC}`)
    console.log(`\n📡 Waiting for messages...\n`)
  })
})

// Message event
client.on('message', (topic, message) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Message received:`)
  console.log(`  Topic: ${topic}`)
  console.log(`  Payload: ${message.toString()}`)
  
  // Try to parse as JSON
  try {
    const data = JSON.parse(message.toString())
    console.log(`  Parsed JSON:`, JSON.stringify(data, null, 2))
  } catch (e) {
    // Not JSON, just display raw message
    console.log(`  Raw message: ${message.toString()}`)
  }
  console.log('---')
})

// Error event
client.on('error', (err) => {
  console.error('✗ Connection error:', err.message)
})

// Disconnect event
client.on('close', () => {
  console.log('⚠ Disconnected from MQTT Broker')
})

// Reconnect event
client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT Broker...')
})

// Offline event
client.on('offline', () => {
  console.log('📴 Client is offline')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down subscriber...')
  client.unsubscribe(TOPIC, () => {
    console.log(`✓ Unsubscribed from ${TOPIC}`)
    client.end(() => {
      console.log('✓ Disconnected from broker')
      process.exit(0)
    })
  })
})

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down subscriber...')
  client.unsubscribe(TOPIC, () => {
    console.log(`✓ Unsubscribed from ${TOPIC}`)
    client.end(() => {
      console.log('✓ Disconnected from broker')
      process.exit(0)
    })
  })
})
