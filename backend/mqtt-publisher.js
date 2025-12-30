const mqtt = require('mqtt')

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const TOPIC = 'zenzero/wwt01'
const CLIENT_ID = `mqtt-publisher-${Math.random().toString(16).slice(3)}`

// Sample data for WWT (Wastewater Treatment) monitoring
const generateWWTData = () => {
  return {
    timestamp: new Date().toISOString(),
    device_id: 'wwt01',
    location: 'zenzero',
    sensors: {
      ph: (7.0 + Math.random() * 1.5).toFixed(2),
      temperature: (25 + Math.random() * 10).toFixed(2),
      dissolved_oxygen: (5 + Math.random() * 3).toFixed(2),
      turbidity: (10 + Math.random() * 20).toFixed(2),
      flow_rate: (100 + Math.random() * 50).toFixed(2),
      bod: (20 + Math.random() * 30).toFixed(2),
      cod: (50 + Math.random() * 50).toFixed(2)
    },
    status: 'active'
  }
}

console.log(`🔌 Connecting to MQTT Broker: ${BROKER_URL}`)
console.log(`📤 Publishing to topic: ${TOPIC}`)

// Connect to MQTT Broker
const client = mqtt.connect(BROKER_URL, {
  clientId: CLIENT_ID,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
})

client.on('connect', () => {
  console.log(`✓ Connected to MQTT Broker`)
  console.log(`  Client ID: ${CLIENT_ID}`)
  console.log(`\n📡 Publishing messages every 5 seconds...\n`)
  
  // Publish messages every 5 seconds
  setInterval(() => {
    const data = generateWWTData()
    const message = JSON.stringify(data)
    
    client.publish(TOPIC, message, { qos: 0 }, (err) => {
      if (err) {
        console.error('✗ Publish error:', err)
      } else {
        console.log(`✓ Published at ${data.timestamp}`)
        console.log(`  pH: ${data.sensors.ph}, Temp: ${data.sensors.temperature}°C, DO: ${data.sensors.dissolved_oxygen} mg/L`)
      }
    })
  }, 5000)
  
  // Publish first message immediately
  const data = generateWWTData()
  const message = JSON.stringify(data)
  client.publish(TOPIC, message, { qos: 0 })
})

client.on('error', (err) => {
  console.error('✗ Connection error:', err.message)
})

client.on('close', () => {
  console.log('⚠ Disconnected from MQTT Broker')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down publisher...')
  client.end(() => {
    console.log('✓ Disconnected from broker')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down publisher...')
  client.end(() => {
    console.log('✓ Disconnected from broker')
    process.exit(0)
  })
})
