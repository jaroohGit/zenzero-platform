const mqtt = require('mqtt')
const database = require('./database')

// MQTT Broker Configuration
const BROKER_URL = process.env.MQTT_BROKER || 'mqtt://localhost:1883'
const TOPIC = 'zenzero/wwt01'
const CLIENT_ID = `mqtt-subscriber-wwt01-${Math.random().toString(16).slice(3)}`

console.log(`🔌 Connecting to MQTT Broker: ${BROKER_URL}`)
console.log(`📥 Subscribing to topic: ${TOPIC}`)

// Helper function to convert two 16-bit registers to 32-bit float
function registersToFloat(highRegister, lowRegister) {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeUInt16BE(highRegister, 0)
  buffer.writeUInt16BE(lowRegister, 2)
  return buffer.readFloatBE(0)
}

// Helper function to convert two 16-bit registers to 32-bit integer
function registersTo32BitInt(highRegister, lowRegister) {
  return (highRegister << 16) | lowRegister
}

// Parse raw data array to JSON object
function parseWWT01Data(data) {
  if (!Array.isArray(data) || data.length < 124) {
    console.error('Invalid data format or insufficient data length')
    return null
  }

  const jsonObject = {}

  try {
    // ====== Lohand No.1 (AT-1) ======
    jsonObject["PH_Sensor_01"] = registersToFloat(data[20], data[21])
    jsonObject["ORP_Sensor_01"] = registersToFloat(data[1], data[2])
    jsonObject["Temp_01"] = registersToFloat(data[7], data[8])
    jsonObject["PH_Sensor_02"] = registersToFloat(data[3], data[4])
    jsonObject["ORP_Sensor_02"] = registersToFloat(data[5], data[6])
    jsonObject["Temp_02"] = registersToFloat(data[9], data[10])
    
    // ====== Lohand No.2 (AT-2) ======
    jsonObject["PH_Sensor_03"] = registersToFloat(data[29], data[30])
    jsonObject["ORP_Sensor_03"] = registersToFloat(data[31], data[32])
    jsonObject["Temp_03"] = registersToFloat(data[37], data[38])
    jsonObject["PH_Sensor_04"] = registersToFloat(data[33], data[34])
    jsonObject["ORP_Sensor_04"] = registersToFloat(data[35], data[36])
    jsonObject["Temp_04"] = registersToFloat(data[39], data[40])

    // ====== Lohand No.3 (AT-3) ======
    jsonObject["PH_Sensor_05"] = registersToFloat(data[49], data[50])
    jsonObject["ORP_Sensor_05"] = registersToFloat(data[51], data[52])
    jsonObject["Temp_05"] = registersToFloat(data[57], data[58])
    jsonObject["PH_Sensor_06"] = registersToFloat(data[53], data[54])
    jsonObject["ORP_Sensor_06"] = registersToFloat(data[55], data[56])
    jsonObject["Temp_06"] = registersToFloat(data[59], data[60])
    
    // ====== Level Sensors (KM30) ======
    // AT-01 Level (D1128) - signed decimal 16bit x 0.2
    jsonObject["AT_01_Level"] = data[128]
    // Sump Pump Water Level (D1130) - signed decimal 16bit x 0.3
    jsonObject["Sump_Pump_Water_Level"] = data[130]
    // AT-02 Level (D1132) - signed decimal 16bit x 0.3
    jsonObject["AT_02_Level"] = data[132]
    
    // ====== Supnea flow meter No.4 (Sludge Thickener) ======
    jsonObject["Flow_Meter_No4_RealTime"] = registersToFloat(data[21], data[22])
    jsonObject["Flow_Meter_No4_Forward"] = data[23] // อ่านค่า 16-bit integer เดียว

    // ====== Supnea flow meter No.1 (AT-1) ======
    jsonObject["Flow_Meter_No1_RealTime"] = registersToFloat(data[26], data[27])
    jsonObject["Flow_Meter_No1_Forward"] = registersTo32BitInt(data[27], data[28])
    
    // ====== Supnea flow meter No.2 (AT-2) ======
    jsonObject["Flow_Meter_No2_RealTime"] = registersToFloat(data[69], data[70])
    jsonObject["Flow_Meter_No2_Forward"] = registersTo32BitInt(data[71], data[72]) // อ่านค่า 32-bit integer

    // ====== Supnea flow meter No.3 (AT-3) ======
    jsonObject["Flow_Meter_No3_RealTime"] = registersToFloat(data[74], data[75])
    jsonObject["Flow_Meter_No3_Forward"] = registersTo32BitInt(data[75], data[76])
    
    // ====== Power meter MDB-01 ======
    jsonObject["Power_MDB_01_Current"] = registersToFloat(data[78], data[79])
    jsonObject["Power_MDB_01_Active_Power"] = registersToFloat(data[80], data[81])
    jsonObject["Power_MDB_01_Energy"] = registersTo32BitInt(data[81], data[82])
    
    // ====== Power meter MDB-02 ======
    jsonObject["Power_MDB_02_Current"] = registersToFloat(data[84], data[85])
    jsonObject["Power_MDB_02_Active_Power"] = registersToFloat(data[86], data[87])
    jsonObject["Power_MDB_02_Energy"] = registersTo32BitInt(data[87], data[88])
    
    // ====== Power meter MDB-03 ======
    jsonObject["Power_MDB_03_Current"] = registersToFloat(data[90], data[91])
    jsonObject["Power_MDB_03_Active_Power"] = registersToFloat(data[92], data[93])
    jsonObject["Power_MDB_03_Energy"] = registersTo32BitInt(data[93], data[94])
     
    // ====== Turbo blower AT-01 ======
    jsonObject["Turbo_AT01_Output_Power"] = data[95] * 0.1
    jsonObject["Turbo_AT01_Motor_Current"] = data[97] * 0.1
    jsonObject["Turbo_AT01_Flow_Rate"] = data[99] * 0.1
    
    // ====== Turbo blower AT-02 (FAB07) ======
    jsonObject["Turbo_AT02_FAB07_Output_Power"] = data[101] * 0.1
    jsonObject["Turbo_AT02_FAB07_Flow_Rate"] = data[103] * 0.1
    jsonObject["Turbo_AT02_FAB07_Motor_Current"] = data[105]
    jsonObject["Turbo_AT02_FAB07_Running_Time"] = data[107]
    
    // ====== Turbo blower AT-02 (FAB08) ======
    jsonObject["Turbo_AT02_FAB08_Output_Power"] = data[109] * 0.1
    jsonObject["Turbo_AT02_FAB08_Flow_Rate"] = data[111] * 0.1
    jsonObject["Turbo_AT02_FAB08_Motor_Current"] = data[113]
    jsonObject["Turbo_AT02_FAB08_Running_Time"] = data[115]
    
    // ====== Turbo blower AT-02 (GAB05) ======
    jsonObject["Turbo_AT02_GAB05_Output_Power"] = data[117] * 0.1
    jsonObject["Turbo_AT02_GAB05_Flow_Rate"] = data[119] * 0.1
    jsonObject["Turbo_AT02_GAB05_Motor_Current"] = data[121]
    jsonObject["Turbo_AT02_GAB05_Running_Time"] = data[123]

    return jsonObject
  } catch (error) {
    console.error('Error parsing WWT01 data:', error)
    return null
  }
}

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
client.on('message', async (topic, message) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Message received on topic: ${topic}`)
  
  try {
    // Try to parse as JSON
    const rawData = JSON.parse(message.toString())
    
    // Check if it's array data (raw modbus registers)
    if (Array.isArray(rawData)) {
      console.log(`  Received array data with ${rawData.length} elements`)
      
      // Parse raw data to structured format
      const parsedData = parseWWT01Data(rawData)
      
      if (parsedData) {
        console.log(`  ✓ Successfully parsed WWT01 data`)
        console.log(`  Sample: PH_Sensor_01=${parsedData.PH_Sensor_01?.toFixed(2)}, ` +
                    `ORP_Sensor_01=${parsedData.ORP_Sensor_01?.toFixed(2)}, ` +
                    `Temp_01=${parsedData.Temp_01?.toFixed(2)}`)
        
        // Insert to database
        await database.insertWWT01Data(parsedData, topic)
        console.log(`  ✓ Data saved to database`)
      }
    } else if (typeof rawData === 'object') {
      // Already parsed JSON object
      console.log(`  Received pre-parsed JSON data`)
      
      // Insert to database
      await database.insertWWT01Data(rawData, topic)
      console.log(`  ✓ Data saved to database`)
    }
  } catch (e) {
    console.error('  ✗ Error processing message:', e.message)
  }
  
  console.log('---\n')
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
