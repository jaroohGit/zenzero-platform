const mqtt = require('mqtt')

// Connect to MQTT Broker
const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: `mqtt-test-${Math.random().toString(16).slice(3)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 1000
})

client.on('connect', () => {
  console.log('✓ Connected to MQTT Broker')
  
  // Subscribe to test topic
  client.subscribe('test/topic', (err) => {
    if (!err) {
      console.log('✓ Subscribed to test/topic')
      
      // Publish a test message
      client.publish('test/topic', 'Hello MQTT from test client!', () => {
        console.log('✓ Published test message')
      })
    }
  })
})

client.on('message', (topic, message) => {
  console.log(`✓ Received message on ${topic}:`, message.toString())
  
  // Disconnect after receiving message
  setTimeout(() => {
    client.end()
    console.log('✓ Test completed successfully')
    process.exit(0)
  }, 1000)
})

client.on('error', (err) => {
  console.error('✗ Connection error:', err)
  process.exit(1)
})

// Timeout after 10 seconds
setTimeout(() => {
  console.error('✗ Test timeout')
  client.end()
  process.exit(1)
}, 10000)
