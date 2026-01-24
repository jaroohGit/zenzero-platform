const express = require('express')
const cors = require('cors')
const database = require('./database')

const app = express()
const PORT = process.env.API_PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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

// WWT01 Historical Data
app.get('/api/wwt01/history', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes) || 60
    const limit = parseInt(req.query.limit) || 1000
    
    const data = await database.getWWT01Data(minutes, limit)
    res.json(data)
  } catch (error) {
    console.error('[API] Error getting WWT01 history:', error)
    res.status(500).json({ error: error.message })
  }
})

// WWT01 Data Range
app.get('/api/wwt01/data-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }
    
    const query = `
      SELECT * FROM wwt01_data
      WHERE time >= $1 AND time < $2
      ORDER BY time ASC
    `
    
    const result = await database.pool.query(query, [startDate, endDate])
    res.json(result.rows)
  } catch (error) {
    console.error('[API] Error getting data range:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`✓ API Server listening on port ${PORT}`)
  console.log(`  Health check: http://localhost:${PORT}/health`)
  console.log(`  AT-02 Inlet: http://localhost:${PORT}/api/wwt01/at02-inlet-monthly`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down API server...')
  process.exit(0)
})
