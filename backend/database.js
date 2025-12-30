const { Pool } = require('pg')

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wwt_data',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection
pool.on('connect', () => {
  console.log('Connected to TimescaleDB')
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

// Insert PH Sensor 02 data
async function insertPHSensor02(value, rawValue, topic) {
  const query = `
    INSERT INTO ph_sensor_02 (time, value, raw_value, topic)
    VALUES (NOW(), $1, $2, $3)
  `
  
  try {
    await pool.query(query, [value, rawValue || null, topic])
    console.log(`Inserted PH Sensor 02: ${value}`)
  } catch (err) {
    console.error('Error inserting PH Sensor 02 data:', err)
  }
}

// Insert complete WWT01 data
async function insertWWT01Data(data, topic) {
  const query = `
    INSERT INTO wwt01_data (
      time,
      ph_sensor_01, orp_sensor_01, temp_01,
      ph_sensor_02, orp_sensor_02, temp_02,
      ph_sensor_03, orp_sensor_03, temp_03,
      ph_sensor_04, orp_sensor_04, temp_04,
      ph_sensor_05, orp_sensor_05, temp_05,
      ph_sensor_06, orp_sensor_06, temp_06,
      flow_meter_no4_realtime, flow_meter_no4_forward,
      flow_meter_no1_realtime, flow_meter_no1_forward,
      flow_meter_no2_realtime, flow_meter_no2_forward,
      flow_meter_no3_realtime, flow_meter_no3_forward,
      power_mdb_01_current, power_mdb_01_active_power, power_mdb_01_energy,
      power_mdb_02_current, power_mdb_02_active_power, power_mdb_02_energy,
      power_mdb_03_current, power_mdb_03_active_power, power_mdb_03_energy,
      turbo_at01_output_power, turbo_at01_motor_current, turbo_at01_flow_rate,
      turbo_at02_fab07_output_power, turbo_at02_fab07_flow_rate, 
      turbo_at02_fab07_motor_current, turbo_at02_fab07_running_time,
      turbo_at02_fab08_output_power, turbo_at02_fab08_flow_rate,
      turbo_at02_fab08_motor_current, turbo_at02_fab08_running_time,
      turbo_at02_gab05_output_power, turbo_at02_gab05_flow_rate,
      turbo_at02_gab05_motor_current, turbo_at02_gab05_running_time,
      topic
    )
    VALUES (
      NOW(),
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24, $25, $26,
      $27, $28, $29, $30, $31, $32, $33, $34, $35,
      $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51
    )
  `
  
  try {
    await pool.query(query, [
      data.PH_Sensor_01 || null,
      data.ORP_Sensor_01 || null,
      data.Temp_01 || null,
      data.PH_Sensor_02 || null,
      data.ORP_Sensor_02 || null,
      data.Temp_02 || null,
      data.PH_Sensor_03 || null,
      data.ORP_Sensor_03 || null,
      data.Temp_03 || null,
      data.PH_Sensor_04 || null,
      data.ORP_Sensor_04 || null,
      data.Temp_04 || null,
      data.PH_Sensor_05 || null,
      data.ORP_Sensor_05 || null,
      data.Temp_05 || null,
      data.PH_Sensor_06 || null,
      data.ORP_Sensor_06 || null,
      data.Temp_06 || null,
      data.Flow_Meter_No4_RealTime || null,
      data.Flow_Meter_No4_Forward || null,
      data.Flow_Meter_No1_RealTime || null,
      data.Flow_Meter_No1_Forward || null,
      data.Flow_Meter_No2_RealTime || null,
      data.Flow_Meter_No2_Forward || null,
      data.Flow_Meter_No3_RealTime || null,
      data.Flow_Meter_No3_Forward || null,
      data.Power_MDB_01_Current || null,
      data.Power_MDB_01_Active_Power || null,
      data.Power_MDB_01_Energy || null,
      data.Power_MDB_02_Current || null,
      data.Power_MDB_02_Active_Power || null,
      data.Power_MDB_02_Energy || null,
      data.Power_MDB_03_Current || null,
      data.Power_MDB_03_Active_Power || null,
      data.Power_MDB_03_Energy || null,
      data.Turbo_AT01_Output_Power || null,
      data.Turbo_AT01_Motor_Current || null,
      data.Turbo_AT01_Flow_Rate || null,
      data.Turbo_AT02_FAB07_Output_Power || null,
      data.Turbo_AT02_FAB07_Flow_Rate || null,
      data.Turbo_AT02_FAB07_Motor_Current || null,
      data.Turbo_AT02_FAB07_Running_Time || null,
      data.Turbo_AT02_FAB08_Output_Power || null,
      data.Turbo_AT02_FAB08_Flow_Rate || null,
      data.Turbo_AT02_FAB08_Motor_Current || null,
      data.Turbo_AT02_FAB08_Running_Time || null,
      data.Turbo_AT02_GAB05_Output_Power || null,
      data.Turbo_AT02_GAB05_Flow_Rate || null,
      data.Turbo_AT02_GAB05_Motor_Current || null,
      data.Turbo_AT02_GAB05_Running_Time || null,
      topic
    ])
    console.log('Inserted WWT01 complete data')
  } catch (err) {
    console.error('Error inserting WWT01 data:', err)
  }
}

// Get recent PH Sensor 02 data
async function getPHSensor02Data(minutes = 5) {
  const query = `
    SELECT time, value, raw_value
    FROM ph_sensor_02
    WHERE time > NOW() - INTERVAL '${minutes} minutes'
    ORDER BY time ASC
  `
  
  try {
    const result = await pool.query(query)
    return result.rows
  } catch (err) {
    console.error('Error getting PH Sensor 02 data:', err)
    throw err
  }
}

// Get aggregated PH Sensor 02 data
async function getPHSensor02Aggregated(minutes = 60) {
  const query = `
    SELECT
      time_bucket('1 minute', time) AS bucket,
      AVG(value) as avg_value,
      MIN(value) as min_value,
      MAX(value) as max_value,
      COUNT(*) as count
    FROM ph_sensor_02
    WHERE time > NOW() - INTERVAL '${minutes} minutes'
    GROUP BY bucket
    ORDER BY bucket ASC
  `
  
  try {
    const result = await pool.query(query)
    return result.rows
  } catch (err) {
    console.error('Error getting aggregated PH Sensor 02 data:', err)
    throw err
  }
}

// Get latest PH Sensor 02 value
async function getLatestPHSensor02() {
  const query = `
    SELECT time, value, raw_value
    FROM ph_sensor_02
    ORDER BY time DESC
    LIMIT 1
  `
  
  try {
    const result = await pool.query(query)
    return result.rows[0] || null
  } catch (err) {
    console.error('Error getting latest PH Sensor 02:', err)
    throw err
  }
}

// Get WWT01 data
async function getWWT01Data(minutes = 60, limit = 1000) {
  const query = `
    SELECT time_bucket('1 second', time) as time,
           AVG(ph_sensor_01) as ph_sensor_01,
           AVG(orp_sensor_01) as orp_sensor_01,
           AVG(temp_01) as temp_01,
           AVG(ph_sensor_02) as ph_sensor_02,
           AVG(orp_sensor_02) as orp_sensor_02,
           AVG(temp_02) as temp_02,
           AVG(ph_sensor_03) as ph_sensor_03,
           AVG(orp_sensor_03) as orp_sensor_03,
           AVG(temp_03) as temp_03,
           AVG(ph_sensor_04) as ph_sensor_04,
           AVG(orp_sensor_04) as orp_sensor_04,
           AVG(temp_04) as temp_04,
           AVG(ph_sensor_05) as ph_sensor_05,
           AVG(orp_sensor_05) as orp_sensor_05,
           AVG(temp_05) as temp_05,
           AVG(ph_sensor_06) as ph_sensor_06,
           AVG(orp_sensor_06) as orp_sensor_06,
           AVG(temp_06) as temp_06,
           AVG(flow_meter_no4_realtime) as flow_meter_no4_realtime,
           MAX(flow_meter_no4_forward) as flow_meter_no4_forward,
           AVG(flow_meter_no1_realtime) as flow_meter_no1_realtime,
           MAX(flow_meter_no1_forward) as flow_meter_no1_forward,
           AVG(flow_meter_no2_realtime) as flow_meter_no2_realtime,
           MAX(flow_meter_no2_forward) as flow_meter_no2_forward,
           AVG(flow_meter_no3_realtime) as flow_meter_no3_realtime,
           MAX(flow_meter_no3_forward) as flow_meter_no3_forward,
           AVG(power_mdb_01_current) as power_mdb_01_current,
           AVG(power_mdb_01_active_power) as power_mdb_01_active_power,
           MAX(power_mdb_01_energy) as power_mdb_01_energy,
           AVG(power_mdb_02_current) as power_mdb_02_current,
           AVG(power_mdb_02_active_power) as power_mdb_02_active_power,
           MAX(power_mdb_02_energy) as power_mdb_02_energy,
           AVG(power_mdb_03_current) as power_mdb_03_current,
           AVG(power_mdb_03_active_power) as power_mdb_03_active_power,
           MAX(power_mdb_03_energy) as power_mdb_03_energy,
           AVG(turbo_at01_output_power) as turbo_at01_output_power,
           AVG(turbo_at01_motor_current) as turbo_at01_motor_current,
           AVG(turbo_at01_flow_rate) as turbo_at01_flow_rate,
           AVG(turbo_at02_fab07_output_power) as turbo_at02_fab07_output_power,
           AVG(turbo_at02_fab07_flow_rate) as turbo_at02_fab07_flow_rate,
           AVG(turbo_at02_fab07_motor_current) as turbo_at02_fab07_motor_current,
           MAX(turbo_at02_fab07_running_time) as turbo_at02_fab07_running_time,
           AVG(turbo_at02_fab08_output_power) as turbo_at02_fab08_output_power,
           AVG(turbo_at02_fab08_flow_rate) as turbo_at02_fab08_flow_rate,
           AVG(turbo_at02_fab08_motor_current) as turbo_at02_fab08_motor_current,
           MAX(turbo_at02_fab08_running_time) as turbo_at02_fab08_running_time,
           AVG(turbo_at02_gab05_output_power) as turbo_at02_gab05_output_power,
           AVG(turbo_at02_gab05_flow_rate) as turbo_at02_gab05_flow_rate,
           AVG(turbo_at02_gab05_motor_current) as turbo_at02_gab05_motor_current,
           MAX(turbo_at02_gab05_running_time) as turbo_at02_gab05_running_time
    FROM wwt01_data
    WHERE time > NOW() - INTERVAL '${minutes} minutes'
    GROUP BY time_bucket('1 second', time)
    ORDER BY time DESC
    LIMIT ${limit}
  `
  
  try {
    const result = await pool.query(query)
    return result.rows
  } catch (err) {
    console.error('Error getting WWT01 data:', err)
    throw err
  }
}

// Get latest WWT01 data
async function getLatestWWT01Data() {
  const query = `
    SELECT *
    FROM wwt01_data
    ORDER BY time DESC
    LIMIT 1
  `
  
  try {
    const result = await pool.query(query)
    return result.rows[0] || null
  } catch (err) {
    console.error('Error getting latest WWT01 data:', err)
    throw err
  }
}

// Get WWT01 data by date range
async function getWWT01DataRange(startDate, endDate) {
  const query = `
    SELECT time,
           ph_sensor_01, orp_sensor_01, temp_01,
           ph_sensor_02, orp_sensor_02, temp_02,
           ph_sensor_03, orp_sensor_03, temp_03,
           ph_sensor_04, orp_sensor_04, temp_04,
           ph_sensor_05, orp_sensor_05, temp_05,
           ph_sensor_06, orp_sensor_06, temp_06,
           flow_meter_no4_realtime, flow_meter_no4_forward,
           flow_meter_no1_realtime, flow_meter_no1_forward,
           flow_meter_no2_realtime, flow_meter_no2_forward,
           flow_meter_no3_realtime, flow_meter_no3_forward,
           power_mdb_01_current, power_mdb_01_active_power, power_mdb_01_energy,
           power_mdb_02_current, power_mdb_02_active_power, power_mdb_02_energy,
           power_mdb_03_current, power_mdb_03_active_power, power_mdb_03_energy,
           turbo_at01_output_power, turbo_at01_motor_current, turbo_at01_flow_rate,
           turbo_at02_fab07_output_power, turbo_at02_fab07_flow_rate, 
           turbo_at02_fab07_motor_current, turbo_at02_fab07_running_time,
           turbo_at02_fab08_output_power, turbo_at02_fab08_flow_rate,
           turbo_at02_fab08_motor_current, turbo_at02_fab08_running_time,
           turbo_at02_gab05_output_power, turbo_at02_gab05_flow_rate,
           turbo_at02_gab05_motor_current, turbo_at02_gab05_running_time
    FROM wwt01_data
    WHERE time >= $1 AND time < $2
    ORDER BY time ASC
  `
  
  try {
    const result = await pool.query(query, [startDate, endDate])
    return result.rows
  } catch (err) {
    console.error('Error getting WWT01 data range:', err)
    throw err
  }
}

module.exports = {
  pool,
  insertPHSensor02,
  insertWWT01Data,
  getPHSensor02Data,
  getPHSensor02Aggregated,
  getLatestPHSensor02,
  getWWT01Data,
  getLatestWWT01Data,
  getWWT01DataRange
}
