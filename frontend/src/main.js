import './style.css'
import mqtt from 'mqtt'
import ApexCharts from 'apexcharts'
import { createChatButton } from './chat-button.js'

const app = document.querySelector('#app')

// Chart instance
let phChart = null
const phChartData = []
const MAX_DATA_POINTS = 300 // 5 minutes * 60 seconds = 300 points (assuming 1 second interval)

app.innerHTML = `
  <header class="header">
    <div class="header-left">
      <button class="menu-toggle" id="menuToggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="header-right">
      <button class="theme-toggle" id="themeToggle" title="Toggle Dark Mode">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg class="moon-icon hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      <div class="connection-status" id="mqttStatus">
        <span class="status-dot"></span>
        <span class="status-text">Connecting...</span>
      </div>
      <button class="user-menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>User</span>
      </button>
    </div>
  </header>

  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">zenzero</h1>
      </div>
      <nav class="nav-menu">
        <a href="#" class="nav-item active" data-page="dashboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Dashboard</span>
        </a>
        <a href="#" class="nav-item" data-page="wwt-report">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Report WWT 01</span>
        </a>
        <a href="#" class="nav-item" data-page="orp-analysis">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
          </svg>
          <span>ORP Analysis</span>
        </a>
        <a href="#" class="nav-item" data-page="data-history">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <span>Data History</span>
        </a>
        <a href="#" class="nav-item" data-page="plant-performance">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Plant Performance</span>
        </a>
        <a href="#" class="nav-item" data-page="projects">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Projects</span>
        </a>
        <a href="#" class="nav-item" data-page="tasks">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          <span>Tasks</span>
        </a>
        <a href="#" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Team</span>
        </a>
        <a href="#" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Settings</span>
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <div class="content-header">
        <h2>Dashboard</h2>
        <p>Welcome to your application</p>
      </div>
      <div class="content-body">
        <div class="card">
          <h3>Getting Started</h3>
          <p>This is your main content area. Start building your application here.</p>
        </div>
        <div class="card">
          <h3>Quick Stats</h3>
          <p>Add your content and components here.</p>
        </div>
      </div>
    </main>
  </div>
`

// Toggle sidebar
const menuToggle = document.getElementById('menuToggle')
const sidebar = document.getElementById('sidebar')
const header = document.querySelector('.header')

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed')
  // Adjust header position when sidebar is collapsed
  if (sidebar.classList.contains('collapsed')) {
    header.style.left = '64px' // 16 * 4px (w-16 in Tailwind)
  } else {
    header.style.left = '179px'
  }
})

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle')
const sunIcon = themeToggle.querySelector('.sun-icon')
const moonIcon = themeToggle.querySelector('.moon-icon')

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light'
if (currentTheme === 'dark') {
  document.documentElement.classList.add('dark')
  sunIcon.classList.add('hidden')
  moonIcon.classList.remove('hidden')
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark')
  sunIcon.classList.toggle('hidden')
  moonIcon.classList.toggle('hidden')
  
  // Save preference
  const isDark = document.documentElement.classList.contains('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
  
  // Update ApexCharts theme for all existing charts
  updateChartsTheme(isDark ? 'dark' : 'light')
})

// Function to update all ApexCharts theme
function updateChartsTheme(mode) {
  const textColor = mode === 'dark' ? '#cbd5e1' : '#0f172a';
  const labelColor = mode === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = mode === 'dark' ? '#334155' : '#e2e8f0';
  
  // Update Flow Hourly Chart
  if (typeof flowHourlyChart !== 'undefined' && flowHourlyChart && flowHourlyChart.updateOptions) {
    flowHourlyChart.updateOptions({
      theme: { mode: mode },
      chart: { 
        foreColor: labelColor,
        background: mode === 'dark' ? '#1e293b' : '#ffffff'
      },
      title: { style: { color: textColor, fontSize: '14px' } },
      xaxis: { 
        title: { style: { color: textColor } },
        labels: { style: { colors: labelColor } }
      },
      yaxis: { 
        title: { style: { color: textColor } },
        labels: { style: { colors: labelColor } }
      },
      dataLabels: {
        style: { colors: [textColor] }
      },
      grid: { borderColor: gridColor }
    })
  }
  
  // Update Flow Daily Chart
  if (typeof flowDailyChart !== 'undefined' && flowDailyChart && flowDailyChart.updateOptions) {
    flowDailyChart.updateOptions({
      theme: { mode: mode },
      chart: { 
        foreColor: labelColor,
        background: mode === 'dark' ? '#1e293b' : '#ffffff'
      },
      title: { style: { color: textColor, fontSize: '14px' } },
      xaxis: { 
        title: { style: { color: textColor } },
        labels: { style: { colors: labelColor } }
      },
      yaxis: { 
        title: { style: { color: textColor } },
        labels: { style: { colors: labelColor } }
      },
      dataLabels: {
        style: { colors: [textColor] }
      },
      grid: { borderColor: gridColor }
    })
  }
  
  // Update charts if they exist
  if (typeof lohandCharts !== 'undefined' && lohandCharts) {
    Object.values(lohandCharts).forEach(lohand => {
      if (lohand && typeof lohand === 'object') {
        Object.values(lohand).forEach(chart => {
          if (chart && chart.updateOptions) {
            chart.updateOptions({
              theme: { mode: mode },
              chart: { 
                foreColor: labelColor,
                background: mode === 'dark' ? '#1e293b' : '#ffffff'
              },
              title: { style: { color: textColor, fontSize: '14px' } },
              xaxis: { 
                labels: { }
              },
              yaxis: { 
                title: { style: { color: textColor } },
                decimalsInFloat: 2,
                labels: {
                  formatter: function(val) { return val != null ? val.toFixed(2) : '--' }
                }
              },
              legend: { 
                labels: { colors: [textColor, textColor, textColor, textColor] }
              },
              grid: { borderColor: gridColor }
            })
          }
        })
      }
    })
  }
  
  // Update ORP charts if they exist
  if (typeof orpCharts !== 'undefined' && orpCharts) {
    if (orpCharts.combined && orpCharts.combined.updateOptions) {
      orpCharts.combined.updateOptions({
        theme: { mode: mode },
        chart: { foreColor: labelColor, background: 'transparent' },
        title: { style: { color: textColor, fontSize: '14px' } },
        xaxis: { 
          labels: { 
            datetimeFormatter: { hour: 'HH:mm', minute: 'HH:mm' }
          }
        },
        yaxis: [
          { 
            title: { style: { color: textColor } },
            decimalsInFloat: 2,
            labels: {
              formatter: function(val) { return val ? val.toFixed(2) : '--' }
            }
          },
          { 
            opposite: true,
            title: { style: { color: textColor } },
            decimalsInFloat: 0,
            labels: {
              formatter: function(val) { return val ? val.toFixed(0) : '--' }
            }
          }
        ],
        legend: { labels: { colors: textColor } },
        grid: { borderColor: gridColor }
      })
    }
    if (orpCharts.phRate && orpCharts.phRate.updateOptions) {
      orpCharts.phRate.updateOptions({
        theme: { mode: mode },
        chart: { foreColor: labelColor, background: 'transparent' },
        title: { style: { color: textColor, fontSize: '14px' } },
        xaxis: { 
          labels: { 
            datetimeFormatter: { hour: 'HH:mm', minute: 'HH:mm' }
          }
        },
        yaxis: { 
          title: { style: { color: textColor } },
          decimalsInFloat: 4,
          labels: {
            formatter: function(val) { return val ? val.toFixed(4) : '--' }
          }
        },
        annotations: {
          yaxis: [{
            y: 0,
            borderColor: mode === 'dark' ? '#64748b' : '#999',
            label: { 
              style: { 
                background: mode === 'dark' ? '#1e293b' : '#fff',
                color: textColor
              } 
            }
          }]
        },
        legend: { labels: { colors: textColor } },
        grid: { borderColor: gridColor }
      })
    }
  }
  
  // Update Plant Performance charts if they exist
  if (typeof chartPerformance !== 'undefined' && chartPerformance && chartPerformance.updateOptions) {
    chartPerformance.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      dataLabels: { style: { colors: [textColor] } },
      xaxis: { labels: { style: { colors: Array(24).fill(labelColor), fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: Array(10).fill(labelColor) } } },
      grid: { borderColor: gridColor }
    })
  }
  
  if (typeof chartCost !== 'undefined' && chartCost && chartCost.updateOptions) {
    chartCost.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      dataLabels: { style: { colors: [textColor] } },
      xaxis: { labels: { style: { colors: Array(24).fill(labelColor), fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: Array(10).fill(labelColor) } } },
      grid: { borderColor: gridColor }
    })
  }
  
  if (typeof chartFlow !== 'undefined' && chartFlow && chartFlow.updateOptions) {
    chartFlow.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      xaxis: { labels: { style: { colors: Array(24).fill(labelColor), fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: Array(10).fill(labelColor) } } },
      legend: { labels: { colors: [textColor, textColor, textColor] } },
      grid: { borderColor: gridColor }
    })
  }
  
  if (typeof chartEnergy !== 'undefined' && chartEnergy && chartEnergy.updateOptions) {
    chartEnergy.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      xaxis: { labels: { style: { colors: Array(24).fill(labelColor), fontSize: '10px' } } },
      yaxis: { labels: { style: { colors: Array(10).fill(labelColor) } } },
      legend: { labels: { colors: [textColor, textColor, textColor] } },
      grid: { borderColor: gridColor }
    })
  }
  
  if (typeof chartFlowPie !== 'undefined' && chartFlowPie && chartFlowPie.updateOptions) {
    chartFlowPie.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      legend: { labels: { colors: [textColor, textColor, textColor] } }
    })
  }
  
  if (typeof chartEnergyPie !== 'undefined' && chartEnergyPie && chartEnergyPie.updateOptions) {
    chartEnergyPie.updateOptions({
      theme: { mode: mode },
      chart: { foreColor: labelColor, background: 'transparent' },
      title: { style: { color: textColor, fontSize: '12px' } },
      legend: { labels: { colors: [textColor, textColor, textColor, textColor] } }
    })
  }
}

// MQTT Connection - Use MQTT WebSocket
// Use relative path with protocol based on current page protocol
const getWebSocketURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host // includes hostname and port if any
  const hostname = window.location.hostname
  
  console.log('🌐 Current host:', host)
  console.log('🖥️ Hostname:', hostname)
  console.log('🔌 Protocol:', protocol)
  
  // Development mode ONLY for actual localhost/127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const devUrl = 'ws://localhost:8085'
    console.log('✅ Development mode - Using', devUrl)
    return devUrl
  }
  
  // Production mode - Use same host with /mqtt path (Reverse proxy required)
  const prodUrl = `${protocol}//${host}/mqtt`
  console.log('🏭 Production mode - Using', prodUrl)
  return prodUrl
}

const MQTT_BROKER = getWebSocketURL()
const MQTT_TOPICS = ['zenzero/wwt01', 'zenzero/wwt02']
let mqttClient = null
let latestData = {
  'zenzero/wwt01': {},
  'zenzero/wwt02': {}
}

// Get API Base URL based on environment
const getAPIBaseURL = () => {
  const host = window.location.host
  
  // Development mode - connect directly to backend port
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':5173')) {
    return 'http://localhost:3001/api'
  }
  
  // Production mode - use relative path (Caddy will reverse proxy)
  return '/api'
}

function getAPIBaseURL3002() {
  const host = window.location.hostname
  
  // Development mode - connect to port 3002
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes(':5173')) {
    return 'http://localhost:3002/api'
  }
  
  // Production mode - use relative path (Caddy will reverse proxy)
  return '/api'
}

const API_BASE_URL = getAPIBaseURL()
const API_BASE_URL_3002 = getAPIBaseURL3002()

// Connect to MQTT Broker
function connectMQTT() {
  const statusEl = document.getElementById('mqttStatus')
  
  try {
    // Show connecting status
    statusEl.innerHTML = '<span class="status-dot"></span><span class="status-text">Connecting...</span>'
    
    console.log('Connecting to MQTT Broker:', MQTT_BROKER)
    
    mqttClient = mqtt.connect(MQTT_BROKER, {
      clientId: `web-client-${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 5000,
      keepalive: 60,
      rejectUnauthorized: false // Allow self-signed certificates
    })

    mqttClient.on('connect', () => {
      console.log('✅ Connected to MQTT Broker')
      console.log('Status Element:', statusEl)
      if (statusEl) {
        statusEl.innerHTML = '<span class=\"status-dot connected\"></span><span class=\"status-text\">Connected</span>'
        console.log('✅ Status updated to Connected')
      } else {
        console.error('❌ statusEl not found!')
      }
      
      // Subscribe to all topics
      MQTT_TOPICS.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`Subscribed to ${topic}`)
          }
        })
      })
    })

    mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString())
        data.timestamp = new Date().toISOString()
        latestData[topic] = data
        
        // Update display based on current page
        const currentPage = document.querySelector('.nav-item.active')?.getAttribute('data-page')
        if (currentPage === 'wwt-report' && topic === 'zenzero/wwt01') {
          updateWWT01Display(data)
        } else if (currentPage === 'dashboard' && topic === 'zenzero/wwt01') {
          // Update dashboard with Lohand charts and Flow/Energy charts
          updateLohandCharts(data)
          updateFlowEnergyChartsRealtime(data)
          updateAT02LevelChartRealtime(data)
        } else if (currentPage === 'orp-analysis' && topic === 'zenzero/wwt01') {
          // Update ORP Analysis
          updateORPAnalysisRealtime(data)
        }
      } catch (e) {
        console.error('Error parsing message:', e)
      }
    })

    mqttClient.on('error', (err) => {
      console.error('❌ MQTT Error:', err)
      if (statusEl) {
        statusEl.innerHTML = '<span class=\"status-dot error\"></span><span class=\"status-text\">Error</span>'
      }
    })

    mqttClient.on('close', () => {
      console.log('⚠️ MQTT Connection Closed')
      if (statusEl) {
        statusEl.innerHTML = '<span class=\"status-dot\"></span><span class=\"status-text\">Disconnected</span>'
      }
    })
  } catch (err) {
    console.error('❌ Failed to connect:', err)
    statusEl.innerHTML = '<span class=\"status-dot error\"></span><span class=\"status-text\">Failed</span>'
  }
}

// Page content templates
const pages = {
  dashboard: {
    title: 'Dashboard - Real-time Lohand Monitoring',
    description: 'Live monitoring of Lohand AT-1, AT-2, and AT-3 sensors',
    content: `
      <!-- Flow Accumulation Hourly Chart (แถวแรก) -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 class="chart-section-header" style="margin: 0;">Flow Meter No.1 - Hourly Accumulation Comparison</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="filter-label">Select Date:</label>
            <input type="date" id="flow-chart-date" class="filter-select" style="padding: 8px;" />
            <button id="flow-chart-today-btn" class="btn-primary" style="padding: 8px 15px;">Today</button>
            <button id="flow-chart-load-btn" class="btn-primary" style="padding: 8px 15px;">Load</button>
          </div>
        </div>
        <div style="padding: 10px;">
          <div id="chart-flow-hourly" style="width: 100%; height: 400px;"></div>
        </div>
      </div>

      <!-- Flow Accumulation Daily/Monthly Chart -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 class="chart-section-header" style="margin: 0;">Flow Meter No.1 - Daily Flow, ORP & Energy (Monthly View)</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="filter-label">Select Month:</label>
            <input type="month" id="flow-daily-chart-month" class="filter-select" style="padding: 8px;" />
            <button id="flow-daily-chart-current-btn" class="btn-primary" style="padding: 8px 15px;">Current Month</button>
            <button id="flow-daily-chart-load-btn" class="btn-primary" style="padding: 8px 15px;">Load</button>
          </div>
        </div>
        <div style="padding: 10px;">
          <div id="chart-flow-daily" style="width: 100%; height: 400px;"></div>
        </div>
      </div>

      <!-- AT-02 Level Real-time Chart -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 10px 0 10px;">
          <h3 class="chart-section-header" style="margin: 0;">📊 AT-02 Water Level - Real-time Monitoring</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label style="font-size: 12px; color: #64748b;">Threshold:</label>
            <input 
              type="number" 
              id="at02-threshold-input" 
              value="-0.005" 
              step="0.001" 
              min="-1" 
              max="0" 
              style="width: 80px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px;"
            />
            <button 
              id="at02-threshold-apply" 
              style="padding: 4px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 500;"
            >Apply</button>
          </div>
        </div>
        <div style="padding: 10px;">
          <div id="chart-at02-level" style="width: 100%; height: 350px;"></div>
        </div>
      </div>

      <!-- AT-02 Inlet Volume Hourly Chart -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 class="chart-section-header" style="margin: 0;">💧 AT-02 Outlet Volume - Hourly Accumulation Comparison</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            <label class="filter-label">Select Date:</label>
            <input type="date" id="at02-chart-date" class="filter-select" style="padding: 8px;" />
            <button id="at02-chart-today-btn" class="btn-primary" style="padding: 8px 15px;">Today</button>
            <button id="at02-chart-load-btn" class="btn-primary" style="padding: 8px 15px;">Load</button>
          </div>
        </div>
        <div style="padding: 10px;">
          <div id="chart-at02-hourly" style="width: 100%; height: 400px;"></div>
        </div>
      </div>

      <!-- AT-02 Outlet Volume Monthly Chart -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <div style="padding: 15px;">
          <h3 class="chart-section-header" style="margin: 0 0 10px 0;">💧 AT-02 Outlet Volume - Monthly Comparison</h3>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">Total outlet water volume calculated from AT-02 level decreases only (increases/constant = not counted)</p>
          <div id="chart-at02-inlet" style="width: 100%; height: 400px;"></div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
            <div style="text-align: center; padding: 15px; background: #eff6ff; border-radius: 8px;">
              <div style="color: #6b7280; font-size: 14px;">Current Month Total</div>
              <div id="at02-current-month-total" style="font-size: 28px; font-weight: bold; color: #3b82f6; margin-top: 5px;">0 m³</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <div style="color: #6b7280; font-size: 14px;">Same Month Last Year</div>
              <div id="at02-last-year-total" style="font-size: 28px; font-weight: bold; color: #6b7280; margin-top: 5px;">0 m³</div>
            </div>
          </div>
        </div>
      </div>

      <!-- AT-02 ORP Sensors Chart -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <h3 class="chart-section-header">AT-02 ORP Sensors (ORP-03, ORP-04)</h3>
        <div style="padding: 10px;">
          <div id="chart-at02-orp-sensors" style="width: 100%; height: 400px;"></div>
        </div>
      </div>

      <!-- Time Range Selector -->
      <div class="card" style="margin-bottom: 20px; padding: 15px;">
        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
          <label class="filter-label">Historical Data Range:</label>
          <select id="dashboard-time-range" class="filter-select">
            <option value="5">Last 5 minutes</option>
            <option value="15">Last 15 minutes</option>
            <option value="30" selected>Last 30 minutes</option>
            <option value="60">Last 1 hour</option>
            <option value="180">Last 3 hours</option>
          </select>
          <button id="dashboard-reload-btn" class="btn-primary" style="padding: 8px 20px;">Reload Data</button>
          <span id="dashboard-status" class="status-text" style="margin-left: auto;">Loading...</span>
        </div>
      </div>

      <!-- Lohand AT-1 Charts -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <h3 class="chart-section-header">Lohand No.1 (AT-1)</h3>
        <div style="padding: 10px;">
          <div id="chart-at1-ph" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at1-orp" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at1-temp" style="width: 100%;"></div>
        </div>
      </div>

      <!-- Lohand AT-2 Charts -->
      <div class="card chart-container full-width" style="margin-bottom: 20px;">
        <h3 class="chart-section-header">Lohand No.2 (AT-2)</h3>
        <div style="padding: 10px;">
          <div id="chart-at2-ph" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at2-orp" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at2-temp" style="width: 100%;"></div>
        </div>
      </div>

      <!-- Lohand AT-3 Charts -->
      <div class="card chart-container full-width">
        <h3 class="chart-section-header">Lohand No.3 (AT-3)</h3>
        <div style="padding: 10px;">
          <div id="chart-at3-ph" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at3-orp" style="width: 100%; margin-bottom: 15px;"></div>
          <div id="chart-at3-temp" style="width: 100%;"></div>
        </div>
      </div>
    `,
    onLoad: function() {
      console.log('[Dashboard] onLoad called')
      // Wait for DOM to be fully ready
      setTimeout(() => {
        console.log('[Dashboard] Starting initialization after timeout')
        try {
          initializeFlowHourlyChart()
          initializeFlowDailyChart()
          initializeAT02LevelChart()
          initializeAT02HourlyChart()
          initializeAT02InletChart()
          initializeAT02ORPChart()
          initializeLohandCharts()
          loadFlowHourlyData()
          loadFlowDailyData()
          loadAT02LevelData()
          loadAT02HourlyData()
          loadAT02InletData()
          loadDashboardHistoricalData()
          setupDashboardHandlers()
        } catch (err) {
          console.error('[Dashboard] Error during initialization:', err)
        }
      }, 100)
    }
  },
  'wwt-report': {
    title: 'Report WWT 01',
    description: 'Real-time Wastewater Treatment Monitoring - zenzero/wwt01',
    content: `
      <div class="wwt-report-container">
        <!-- Lohand No.1 (AT-1) Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Lohand No.1 (AT-1)</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item">
              <label>PH Sensor - 01</label>
              <div class="sensor-value" id="wwt01-D1020">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 01</label>
              <div class="sensor-value" id="wwt01-D1001">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 01</label>
              <div class="sensor-value" id="wwt01-D1007">--</div>
              <span class="sensor-unit">°C</span>
            </div>
            <div class="sensor-item">
              <label>PH Sensor - 02</label>
              <div class="sensor-value" id="wwt01-D1003">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 02</label>
              <div class="sensor-value" id="wwt01-D1005">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 02</label>
              <div class="sensor-value" id="wwt01-D1006">--</div>
              <span class="sensor-unit">°C</span>
            </div>
            <div class="sensor-item">
              <label>AT-01 Level</label>
              <div class="sensor-value" id="wwt01-D1128">--</div>
              <span class="sensor-unit">m³</span>
            </div>
          </div>
        </div>

        <!-- Lohand No.2 (AT-2) Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Lohand No.2 (AT-2)</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item">
              <label>PH Sensor - 03</label>
              <div class="sensor-value" id="wwt01-D1029">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 03</label>
              <div class="sensor-value" id="wwt01-D1031">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 03</label>
              <div class="sensor-value" id="wwt01-D1037">--</div>
              <span class="sensor-unit">°C</span>
            </div>
            <div class="sensor-item">
              <label>PH Sensor - 04</label>
              <div class="sensor-value" id="wwt01-D1033">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 04</label>
              <div class="sensor-value" id="wwt01-D1035">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 04</label>
              <div class="sensor-value" id="wwt01-D1036">--</div>
              <span class="sensor-unit">°C</span>
            </div>
            <div class="sensor-item">
              <label>Sump Pump Water Level</label>
              <div class="sensor-value" id="wwt01-D1130">--</div>
              <span class="sensor-unit">m³</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 Level</label>
              <div class="sensor-value" id="wwt01-D1132">--</div>
              <span class="sensor-unit">m³</span>
            </div>
          </div>
        </div>

        <!-- Lohand No.3 (AT-3) Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Lohand No.3 (AT-3)</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item">
              <label>PH Sensor - 05</label>
              <div class="sensor-value" id="wwt01-D1049">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 05</label>
              <div class="sensor-value" id="wwt01-D1051">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 05</label>
              <div class="sensor-value" id="wwt01-D1057">--</div>
              <span class="sensor-unit">°C</span>
            </div>
            <div class="sensor-item">
              <label>PH Sensor - 06</label>
              <div class="sensor-value" id="wwt01-D1053">--</div>
              <span class="sensor-unit">pH</span>
            </div>
            <div class="sensor-item">
              <label>ORP sensor - 06</label>
              <div class="sensor-value" id="wwt01-D1055">--</div>
              <span class="sensor-unit">mV</span>
            </div>
            <div class="sensor-item">
              <label>Temp - 06</label>
              <div class="sensor-value" id="wwt01-D1056">--</div>
              <span class="sensor-unit">°C</span>
            </div>
          </div>
        </div>

        <!-- Supmea Flow Meters Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Supmea Flow Meters</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item wide">
              <label>Supmea flow meter No.4 (Sludge thickener) - Real-time flow rate</label>
              <div class="sensor-value" id="wwt01-D1021">--</div>
              <span class="sensor-unit">M3/hr</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.4 - Forward flow accumulation</label>
              <div class="sensor-value" id="wwt01-D1022">--</div>
              <span class="sensor-unit">Integer</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.1 (AT-1) - Real-time flow rate</label>
              <div class="sensor-value" id="wwt01-D1023">--</div>
              <span class="sensor-unit">M3/hr</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.1 - Forward flow accumulation</label>
              <div class="sensor-value" id="wwt01-D1024">--</div>
              <span class="sensor-unit">Integer</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.2 (AT-2) - Real-time flow rate</label>
              <div class="sensor-value" id="wwt01-D1025">--</div>
              <span class="sensor-unit">M3/hr</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.2 - Forward flow accumulation</label>
              <div class="sensor-value" id="wwt01-D1026">--</div>
              <span class="sensor-unit">Integer</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.3 (AT-3) - Real-time flow rate</label>
              <div class="sensor-value" id="wwt01-D1027">--</div>
              <span class="sensor-unit">M3/hr</span>
            </div>
            <div class="sensor-item wide">
              <label>Supmea flow meter No.3 - Forward flow accumulation</label>
              <div class="sensor-value" id="wwt01-D1028">--</div>
              <span class="sensor-unit">Integer</span>
            </div>
          </div>
        </div>

        <!-- Power Meters MDB Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Power Meters M08</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item">
              <label>M08 - 01 Current Avg</label>
              <div class="sensor-value" id="wwt01-D1070">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 01 Active Power Total</label>
              <div class="sensor-value" id="wwt01-D1071">--</div>
              <span class="sensor-unit">W</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 01 Active Energy</label>
              <div class="sensor-value" id="wwt01-D1072">--</div>
              <span class="sensor-unit">kWh</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 02 Current Avg</label>
              <div class="sensor-value" id="wwt01-D1073">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 02 Active Power Total</label>
              <div class="sensor-value" id="wwt01-D1074">--</div>
              <span class="sensor-unit">W</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 02 Active Energy</label>
              <div class="sensor-value" id="wwt01-D1075">--</div>
              <span class="sensor-unit">kWh</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 03 Current Avg</label>
              <div class="sensor-value" id="wwt01-D1076">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 03 Active Power Total</label>
              <div class="sensor-value" id="wwt01-D1077">--</div>
              <span class="sensor-unit">W</span>
            </div>
            <div class="sensor-item">
              <label>M08 - 03 Active Energy</label>
              <div class="sensor-value" id="wwt01-D1078">--</div>
              <span class="sensor-unit">kWh</span>
            </div>
          </div>
        </div>

        <!-- Turbo Blowers Group -->
        <div class="group-card">
          <div class="group-header">
            <h3>Turbo Blowers</h3>
          </div>
          <div class="sensor-grid">
            <div class="sensor-item">
              <label>AT-01 Output Power</label>
              <div class="sensor-value" id="wwt01-D1079">--</div>
              <span class="sensor-unit">kW</span>
            </div>
            <div class="sensor-item">
              <label>AT-01 Motor Current</label>
              <div class="sensor-value" id="wwt01-D1080">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>AT-01 Flow Rate</label>
              <div class="sensor-value" id="wwt01-D1081">--</div>
              <span class="sensor-unit">M3/min</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB07) Output Power</label>
              <div class="sensor-value" id="wwt01-D1082">--</div>
              <span class="sensor-unit">kW</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB07) Flow Rate</label>
              <div class="sensor-value" id="wwt01-D1083">--</div>
              <span class="sensor-unit">M3/min</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB07) Motor Current</label>
              <div class="sensor-value" id="wwt01-D1084">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB07) Running time</label>
              <div class="sensor-value" id="wwt01-D1085">--</div>
              <span class="sensor-unit">hr</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB08) Output Power</label>
              <div class="sensor-value" id="wwt01-D1086">--</div>
              <span class="sensor-unit">kW</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB08) Flow Rate</label>
              <div class="sensor-value" id="wwt01-D1087">--</div>
              <span class="sensor-unit">M3/min</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB08) Motor Current</label>
              <div class="sensor-value" id="wwt01-D1088">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (FAB08) Running time</label>
              <div class="sensor-value" id="wwt01-D1089">--</div>
              <span class="sensor-unit">hr</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (GAB05) Output Power</label>
              <div class="sensor-value" id="wwt01-D1090">--</div>
              <span class="sensor-unit">kW</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (GAB05) Flow Rate</label>
              <div class="sensor-value" id="wwt01-D1091">--</div>
              <span class="sensor-unit">M3/min</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (GAB05) Motor Current</label>
              <div class="sensor-value" id="wwt01-D1092">--</div>
              <span class="sensor-unit">A</span>
            </div>
            <div class="sensor-item">
              <label>AT-02 (GAB05) Running time</label>
              <div class="sensor-value" id="wwt01-D1093">--</div>
              <span class="sensor-unit">hr</span>
            </div>
          </div>
        </div>
      </div>
    `
  },
  'orp-analysis': {
    title: 'ORP/pH Analysis & Control',
    description: 'Real-time ORP and pH monitoring for SBR process control',
    content: `
      <div class="orp-analysis-container">
        <!-- Status Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
          <!-- Process Phase Card -->
          <div class="card" style="padding: 20px;">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Current Process Phase</div>
            <div id="process-phase" style="font-size: 24px; font-weight: bold; color: #3b82f6;">Monitoring</div>
            <div id="phase-duration" style="color: #9ca3af; font-size: 12px; margin-top: 5px;">Duration: --</div>
          </div>
          
          <!-- pH Rate Card -->
          <div class="card" style="padding: 20px;">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">pH Rate of Change (ΔpH/Δt)</div>
            <div id="ph-rate" style="font-size: 24px; font-weight: bold; color: #10b981;">0.00</div>
            <div style="color: #9ca3af; font-size: 12px; margin-top: 5px;">pH units/min</div>
          </div>
          
          <!-- Blower Recommendation Card -->
          <div class="card" style="padding: 20px;">
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Blower Control Recommendation</div>
            <div id="blower-recommendation" style="font-size: 20px; font-weight: bold; color: #6b7280;">Monitoring</div>
            <div id="recommendation-reason" style="color: #9ca3af; font-size: 12px; margin-top: 5px;">--</div>
          </div>
        </div>

        <!-- Lohand Selector -->
        <div class="card" style="margin-bottom: 20px; padding: 15px;">
          <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
            <label class="filter-label">Select Lohand Unit:</label>
            <select id="orp-lohand-selector" class="filter-select">
              <option value="at1">Lohand AT-1</option>
              <option value="at2">Lohand AT-2</option>
              <option value="at3">Lohand AT-3</option>
            </select>
            <label class="filter-label" style="margin-left: 20px;">Time Range:</label>
            <select id="orp-time-range" class="filter-select">
              <option value="5">Last 5 minutes</option>
              <option value="15">Last 15 minutes</option>
              <option value="30" selected>Last 30 minutes</option>
              <option value="60">Last 1 hour</option>
            </select>
            <button id="orp-reload-btn" class="btn-primary" style="padding: 8px 20px;">Reload</button>
          </div>
        </div>

        <!-- Current Values -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px;">
          <div class="card" style="padding: 15px; text-align: center;">
            <div class="kpi-sublabel">pH Sensor 01</div>
            <div id="current-ph01" class="kpi-main-value" style="font-size: 28px; margin: 10px 0;">--</div>
          </div>
          <div class="card" style="padding: 15px; text-align: center;">
            <div class="kpi-sublabel">pH Sensor 02</div>
            <div id="current-ph02" class="kpi-main-value" style="font-size: 28px; margin: 10px 0;">--</div>
          </div>
          <div class="card" style="padding: 15px; text-align: center;">
            <div class="kpi-sublabel">ORP-In</div>
            <div id="current-orp01" class="kpi-main-value" style="font-size: 28px; margin: 10px 0;">--</div>
            <div class="kpi-unit">mV</div>
          </div>
          <div class="card" style="padding: 15px; text-align: center;">
            <div class="kpi-sublabel">ORP-Out</div>
            <div id="current-orp02" class="kpi-main-value" style="font-size: 28px; margin: 10px 0;">--</div>
            <div class="kpi-unit">mV</div>
          </div>
        </div>

        <!-- Combined ORP/pH Chart -->
        <div class="card chart-container full-width" style="margin-bottom: 20px;">
          <h3 style="padding: 15px; margin: 0; border-bottom: 1px solid #e5e7eb;">ORP & pH Trends (Dual Axis)</h3>
          <div style="padding: 10px;">
            <div id="chart-orp-ph-combined" style="width: 100%;"></div>
          </div>
        </div>

        <!-- pH Rate Chart -->
        <div class="card chart-container full-width" style="margin-bottom: 20px;">
          <h3 style="padding: 15px; margin: 0; border-bottom: 1px solid #e5e7eb;">pH Rate of Change (ΔpH/Δt)</h3>
          <div style="padding: 10px;">
            <div id="chart-ph-rate" style="width: 100%;"></div>
          </div>
        </div>

        <!-- Process Control Guidelines -->
        <div class="card" style="padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0;">🔑 Up Flow Turning Point Batch Reactor - AI/ML Control System</h3>
          <p style="color: #6b7280; margin-bottom: 20px; font-style: italic;">
            สถาปัตยกรรมระบบ AI และ Machine Learning สำหรับการควบคุมแบบเวลาจริง
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <!-- Anoxic Phase - Nitrate Turning -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 20px; border-radius: 8px; color: white;">
              <h4 style="color: #93c5fd; margin-bottom: 15px; font-size: 18px;">
                ⓘ ช่วงพักการเติมอากาศ (Anoxic Phase) และการหา Nitrate Turning
              </h4>
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; line-height: 1.6;">
                  หลังจากหยุดการเติมอากาศ ระบบจะเข้าสู่ช่วง Denitrification โดยจุลินทรีย์จะใช้คาร์บอนที่มีอยู่อย่างสัมเหคือ (COD/TKN > 8) ในการรีดักซ์ในเคชฑ<sup>3</sup>
                </p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #fbbf24;">• เกณฑ์ของ ORP:</strong>
                <p style="margin: 5px 0 0 20px; line-height: 1.6;">
                  ค่า ORP จะลดลงอย่างต่อเนื่องเมื่อในเคชฑทุกมีไมาก<sup>13</sup>
                </p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #fbbf24;">• การเกิด Nitrate Turning:</strong>
                <p style="margin: 5px 0 0 20px; line-height: 1.6;">
                  เมื่อในเคชฑทุกกก้าจัดจนหมด (Complete Denitrification) ค้กยจัดคกาซิงจะลดลง
                  อย่างรวดเร็วเป็นเมฉขัน (Sharp drop) แนองจากระบบเปลี่ยนสถานะจาก Anoxic (ที่มีในเคชฑเป็นตัวรับ
                  อิเล็กตรอน) ไปสู่สภาวะ Anaerobic (Fermentation)
                </p>
              </div>
              
              <div style="background: rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 6px; border-left: 4px solid #fbbf24;">
                <strong style="color: #fef3c7;">🤖 เกณฑ์การจับเฟส์:</strong>
                <p style="margin: 5px 0 0 0; line-height: 1.6;">
                  จุด Nitrate Knee นี้มักปรากฏเมื่อค่า ORP อยู่ในช่วง <strong>-100 ถึง -200 mV</strong> (ขึ้นอยู่กับนำเสีย)
                  ระบบ AI จะตรวจจับจุดนี้เพื่อสั่นสุดการควบคุมผลและเตรียมการตกตะกอน
                </p>
              </div>
            </div>

            <!-- Aerobic Phase - Ammonia Valley -->
            <div style="background: linear-gradient(135deg, #065f46 0%, #10b981 100%); padding: 20px; border-radius: 8px; color: white;">
              <h4 style="color: #6ee7b7; margin-bottom: 15px; font-size: 18px;">
                ⓘ ช่วงการเติมอากาศ (Aerobic Phase) และการหา Ammonia Valley
              </h4>
              <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0 0 10px 0; line-height: 1.6;">
                  เครื่องเติมอากาศจะทำงานเพื่อเพิ่มระดับ DO ให้จุลินทรีย์เปลี่ยนรูปแอมโมเนียและย่อยสลายคาร์บอน
                </p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #fbbf24;">• เกณฑ์ของ pH:</strong>
                <p style="margin: 5px 0 0 20px; line-height: 1.6;">
                  ค่า pH จะลดลงเป็นเส้นโค้งที่ค่อย ๆ สาดลง เนื่องจากกระบวนการ Nitritation ปล่อยกรดออกมา
                </p>
              </div>
              
              <div style="margin-bottom: 12px;">
                <strong style="color: #fbbf24;">• การเกิด Ammonia Valley:</strong>
                <p style="margin: 5px 0 0 20px; line-height: 1.6;">
                  เมื่อความเข้มข้นของ NH<sub>4</sub>⁺ ลดลงจนถึงระดับบรีตยุด (มากต่ำกว่า 0.5 - 1.0 mg/L)
                  อัตราการลดลงของ pH จะช้าลงและเริ่มวกกลับขึ้นเล็กน้อยเนื่องจากกระบวนการ CO2 Stripping จากการเติม
                  อากาศที่มีความเด่นชัดกว่าการผลิตกรด
                </p>
              </div>
              
              <div style="background: rgba(251, 191, 36, 0.2); padding: 12px; border-radius: 6px; border-left: 4px solid #fbbf24;">
                <strong style="color: #fef3c7;">🤖 เกณฑ์การหยุดเติมอากาศ:</strong>
                <p style="margin: 5px 0 0 0; line-height: 1.6;">
                  ระบบ AI จะวิเคราะห้อยุทธ์ของ pH (dpH/dt) เมื่อค่าความชันเปลี่ยนจาก
                  ลบเป็นศูนย์หรือบวกเล็กน้อง (เช่น 5-15 นาที) ระบบจะระบุจุด Ammonia Valley และส่ง "หยุด
                  เติมอากาศทันที" เพื่อประหยัดพลังงาน
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Traditional Control Guidelines -->
        <div class="card" style="padding: 20px;">
          <h3 style="margin: 0 0 15px 0;">ORP/pH Control Guidelines (Traditional Methods)</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div>
              <h4 style="color: #3b82f6; margin-bottom: 10px;">Nitrification End</h4>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li><strong>ORP:</strong> Highest peak (maximum)</li>
                <li><strong>pH:</strong> Constant or slightly increasing</li>
                <li><strong>Indication:</strong> NH₄⁺ depleted, NO₃⁻ starts accumulating</li>
                <li><strong>Action:</strong> Consider stopping aeration when ΔpH/Δt ≈ 0</li>
              </ul>
            </div>
            <div>
              <h4 style="color: #10b981; margin-bottom: 10px;">Denitrification End</h4>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li><strong>ORP:</strong> Lowest point and stable</li>
                <li><strong>pH:</strong> Highest peak</li>
                <li><strong>Indication:</strong> NO₃⁻ depleted, OH⁻ production creates alkalinity</li>
                <li><strong>Action:</strong> Consider starting aeration when ΔpH/Δt ≈ 0</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `,
    onLoad: function() {
      console.log('[ORP Analysis] Page loaded')
      setTimeout(() => {
        initializeORPAnalysis()
        setupORPAnalysisHandlers()
      }, 100)
    }
  },
  'plant-performance': {
    title: 'Plant Performance Dashboard',
    description: 'Real-time Plant Performance Monitoring',
    content: `
      <div class="plant-performance-container">
        <!-- Top KPI Section -->
        <div class="perf-header">
          <div class="perf-kpi-grid">
            <!-- Total Flow -->
            <div class="perf-kpi-card">
              <div class="kpi-label">TOTAL FLOW</div>
              <div class="kpi-values-row">
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT1</div>
                  <div class="kpi-subvalue" id="kpi-at1">36,466</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT2</div>
                  <div class="kpi-subvalue" id="kpi-at2">108,848</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT3</div>
                  <div class="kpi-subvalue" id="kpi-at3">275,673</div>
                </div>
              </div>
              <div class="kpi-main-value" id="kpi-total-flow">420,987</div>
              <div class="kpi-unit">m³</div>
            </div>

            <!-- Average Flow -->
            <div class="perf-kpi-card">
              <div class="kpi-label">AVERAGE FLOW</div>
              <div class="kpi-values-row">
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT1</div>
                  <div class="kpi-subvalue" id="kpi-avg-at1">2,026</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT2</div>
                  <div class="kpi-subvalue" id="kpi-avg-at2">6,047</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">AT3</div>
                  <div class="kpi-subvalue" id="kpi-avg-at3">8,615</div>
                </div>
              </div>
              <div class="kpi-main-value" id="kpi-avg-flow">8,615</div>
              <div class="kpi-unit">m³/Day</div>
            </div>

            <!-- Total Energy -->
            <div class="perf-kpi-card purple">
              <div class="kpi-label">TOTAL ENERGY</div>
              <div class="kpi-values-row">
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB1</div>
                  <div class="kpi-subvalue" id="kpi-mdb1">85,589</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB2</div>
                  <div class="kpi-subvalue" id="kpi-mdb2">69,707</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB3</div>
                  <div class="kpi-subvalue" id="kpi-mdb3">195,694</div>
                </div>
              </div>
              <div class="kpi-main-value" id="kpi-total-energy">350,990</div>
              <div class="kpi-unit">kWh</div>
            </div>

            <!-- Total Cost -->
            <div class="perf-kpi-card green">
              <div class="kpi-label">TOTAL COST</div>
              <div class="kpi-values-row">
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB1</div>
                  <div class="kpi-subvalue" id="kpi-cost-mdb1">85,589</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB2</div>
                  <div class="kpi-subvalue" id="kpi-cost-mdb2">69,707</div>
                </div>
                <div class="kpi-item">
                  <div class="kpi-sublabel">MDB3</div>
                  <div class="kpi-subvalue" id="kpi-cost-mdb3">195,694</div>
                </div>
              </div>
              <div class="kpi-main-value" id="kpi-total-cost">1,509,257</div>
              <div class="kpi-unit">THB</div>
            </div>

            <!-- Plant Performance -->
            <div class="perf-kpi-card performance-card">
              <div class="kpi-label">PLANT PERFORMANCE</div>
              <div class="performance-values">
                <div class="perf-value-yellow" id="kpi-perf-kwh">1.34</div>
                <div class="perf-value-red" id="kpi-perf-thb">3.59</div>
              </div>
              <div class="performance-units">
                <span>kWh/m³</span>
                <span>THB/m³</span>
              </div>
            </div>

            <!-- Date Display -->
            <div class="perf-kpi-card date-card">
              <div class="date-display" id="perf-date">Loading...</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="card" style="margin-bottom: 20px; padding: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <label style="font-weight: bold;">Date Range:</label>
            <input type="date" id="perf-date-start" style="padding: 8px 15px; border-radius: 4px; border: 1px solid #ddd;">
            <label style="font-weight: bold;">to</label>
            <input type="date" id="perf-date-end" style="padding: 8px 15px; border-radius: 4px; border: 1px solid #ddd;">
            <button id="perf-reload-btn" style="padding: 8px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Calculate</button>
            <span id="perf-status" style="color: #6b7280; margin-left: auto;">Ready</span>
          </div>
        </div>

        <!-- Main Content Area with Charts and Right Panel -->
        <div class="perf-main-content">
          <!-- Charts Section -->
          <div class="perf-charts-section">
            <!-- Plant Performance Chart -->
            <div class="chart-container">
              <div id="chart-performance"></div>
            </div>

            <!-- Total Cost Chart -->
            <div class="chart-container">
              <div id="chart-cost"></div>
            </div>

            <!-- Total Flow Chart -->
            <div class="chart-container">
              <div id="chart-flow"></div>
            </div>

            <!-- Total Energy Chart -->
            <div class="chart-container">
              <div id="chart-energy"></div>
            </div>
          </div>

          <!-- Right Panel -->
          <div class="perf-right-panel">
            <!-- Flow Table -->
            <div class="panel-section">
              <table class="perf-table">
                <tbody>
                  <tr>
                    <td></td>
                    <td>AT1</td>
                    <td>AT2</td>
                    <td>AT3</td>
                    <td>Total</td>
                  </tr>
                  <tr>
                    <td>Flow</td>
                    <td id="panel-at1">2,093</td>
                    <td id="panel-at2">3,029</td>
                    <td id="panel-at3">4,672</td>
                    <td id="panel-flow-total">9,721</td>
                  </tr>
                  <tr>
                    <td>ORP 1</td>
                    <td id="panel-orp1-1">-</td>
                    <td id="panel-orp1-2">-18</td>
                    <td id="panel-orp1-3">-113</td>
                    <td id="panel-orp1-total">-280</td>
                  </tr>
                  <tr>
                    <td>ORP 2</td>
                    <td id="panel-orp2-1">-</td>
                    <td id="panel-orp2-2">36</td>
                    <td id="panel-orp2-3">23</td>
                    <td id="panel-orp2-total">-159</td>
                  </tr>
                  <tr>
                    <td>PH1</td>
                    <td id="panel-ph1-1">-</td>
                    <td id="panel-ph1-2">7.4</td>
                    <td id="panel-ph1-3">7.6</td>
                    <td id="panel-ph1-total">7.3</td>
                  </tr>
                  <tr>
                    <td>PH2</td>
                    <td id="panel-ph2-1">-</td>
                    <td id="panel-ph2-2">7.2</td>
                    <td id="panel-ph2-3">7.4</td>
                    <td id="panel-ph2-total">7.4</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- MDB Table -->
            <div class="panel-section">
              <table class="perf-table">
                <tbody>
                  <tr>
                    <td></td>
                    <td>MDB1</td>
                    <td>MDB2</td>
                    <td>MDB3</td>
                  </tr>
                  <tr>
                    <td>Energy</td>
                    <td id="panel-mdb1-energy">2,444</td>
                    <td id="panel-mdb2-energy">1,608</td>
                    <td id="panel-mdb3-energy">5,650</td>
                  </tr>
                  <tr>
                    <td>Cost</td>
                    <td id="panel-mdb1-cost">10,509</td>
                    <td id="panel-mdb2-cost">6,914</td>
                    <td id="panel-mdb3-cost">24,295</td>
                  </tr>
                </tbody>
              </table>
              <div class="panel-totals">
                <div class="total-row">
                  <span>Energy</span>
                  <span id="panel-energy-total">9,702</span>
                  <span>kWh/Day</span>
                </div>
                <div class="total-row">
                  <span>Cost</span>
                  <span id="panel-cost-total">41,719</span>
                  <span>THB/Day</span>
                </div>
              </div>
            </div>

            <!-- Pie Charts -->
            <div class="panel-section">
              <div class="pie-chart-container">
                <div id="chart-flow-pie"></div>
              </div>
            </div>

            <div class="panel-section">
              <div class="pie-chart-container">
                <div id="chart-energy-pie"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    onLoad: function() {
      console.log('[Plant Performance] Page loaded')
      setTimeout(() => {
        initPlantPerformanceCharts() // Initialize template charts first
        loadPlantPerformanceData()
        setupPlantPerformanceHandlers()
      }, 100)
    }
  },
  'data-history': {
    title: 'Data History - WWT01',
    description: 'Historical Data from WWT01 Sensors',
    content: `
      <div class="card full-width">
        <div class="filter-section">
          <h3>WWT01 Data History</h3>
          <div class="filter-controls">
            <div class="filter-group">
              <label>Time Range:</label>
              <select id="time-range">
                <option value="5">Last 5 minutes</option>
                <option value="15">Last 15 minutes</option>
                <option value="30">Last 30 minutes</option>
                <option value="60" selected>Last 1 hour</option>
                <option value="180">Last 3 hours</option>
                <option value="360">Last 6 hours</option>
                <option value="720">Last 12 hours</option>
                <option value="1440">Last 24 hours</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Limit:</label>
              <select id="data-limit">
                <option value="100">100 records</option>
                <option value="500" selected>500 records</option>
                <option value="1000">1000 records</option>
                <option value="5000">5000 records</option>
              </select>
            </div>
            <button id="load-data-btn" class="btn-primary">Load Data</button>
            <button id="refresh-data-btn" class="btn-secondary">Refresh</button>
            <button id="export-csv-btn" class="btn-secondary">Export CSV</button>
          </div>
        </div>
        
        <div class="data-stats" id="data-stats">
          <div class="stat-item">
            <span class="stat-label">Total Records:</span>
            <span class="stat-value" id="total-records">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Time Range:</span>
            <span class="stat-value" id="time-range-display">-</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Latest Update:</span>
            <span class="stat-value" id="latest-update">-</span>
          </div>
        </div>
        
        <div class="table-container" style="max-height: 600px; overflow: auto;">
          <table class="data-table" id="data-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead id="table-header" style="position: sticky; top: 0; background: white; z-index: 10;">
              <tr>
                <th rowspan="2" style="vertical-align: middle;">Time</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-1 Sensor 1</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-1 Sensor 2</th>
                <th style="text-align: center; border-bottom: 1px solid #ddd;">AT-1 Level</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-2 Sensor 3</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-2 Sensor 4</th>
                <th style="text-align: center; border-bottom: 1px solid #ddd;">Sump Level</th>
                <th style="text-align: center; border-bottom: 1px solid #ddd;">AT-2 Level</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-3 Sensor 5</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">AT-3 Sensor 6</th>
                <th colspan="2" style="text-align: center; border-bottom: 1px solid #ddd;">Flow-1</th>
                <th colspan="2" style="text-align: center; border-bottom: 1px solid #ddd;">Flow-2</th>
                <th colspan="2" style="text-align: center; border-bottom: 1px solid #ddd;">Flow-3</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">Power MDB-1</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">Power MDB-2</th>
                <th colspan="3" style="text-align: center; border-bottom: 1px solid #ddd;">Power MDB-3</th>
              </tr>
              <tr>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>m³</th>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>m³</th>
                <th>m³</th>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>PH</th><th>ORP</th><th>Temp</th>
                <th>RT</th><th>Fwd</th>
                <th>RT</th><th>Fwd</th>
                <th>RT</th><th>Fwd</th>
                <th>Curr</th><th>Pwr</th><th>Energy</th>
                <th>Curr</th><th>Pwr</th><th>Energy</th>
                <th>Curr</th><th>Pwr</th><th>Energy</th>
              </tr>
            </thead>
            <tbody id="table-body">
              <tr>
                <td colspan="37" class="loading-cell" style="text-align: center; padding: 20px;">Click "Load Data" to view historical data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
    onLoad: function() {
      setupDataHistoryHandlers()
    }
  },
  projects: {
    title: 'Projects',
    description: 'Manage your projects',
    content: `
      <div class="card">
        <h3>Projects</h3>
        <p>Project management coming soon.</p>
      </div>
    `
  },
  tasks: {
    title: 'Tasks',
    description: 'Task management',
    content: `
      <div class="card">
        <h3>Tasks</h3>
        <p>Task tracking coming soon.</p>
      </div>
    `
  }
}

// Helper function to format PH value
const formatPH = (value) => {
  if (value === -32768 || value === 0) return '--'
  return (value / 100).toFixed(2)
}

// Initialize PH Chart
async function initializePHChart() {
  const chartElement = document.getElementById('ph-chart')
  if (!chartElement) return
  
  // Destroy existing chart if any
  if (phChart) {
    phChart.destroy()
    phChartData.length = 0
  }
  
  const options = {
    series: [{
      name: 'pH Level',
      data: []
    }],
    chart: {
      type: 'line',
      height: 350,
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: {
          hour: 'HH:mm',
          minute: 'HH:mm:ss'
        }
      }
    },
    yaxis: {
      title: {
        text: 'pH Level'
      },
      decimalsInFloat: 2
    },
    legend: {
      show: true
    },
    tooltip: {
      x: {
        format: 'HH:mm:ss'
      }
    },
    colors: ['#00E396']
  }
  
  phChart = new ApexCharts(chartElement, options)
  phChart.render()
  
  // Load historical data from database
  try {
    const apiUrl = `${API_BASE_URL}/ph-sensor-02/history?minutes=5`
    const response = await fetch(apiUrl)
    const historicalData = await response.json()
    
    console.log('Loaded historical data:', historicalData.length, 'records')
    
    // Add historical data to chart
    if (historicalData.length > 0) {
      historicalData.forEach(record => {
        phChartData.push({
          x: new Date(record.time).getTime(),
          y: record.value
        })
      })
      
      // Update chart with historical data
      phChart.updateSeries([{
        data: phChartData
      }])
      
      // Update current value display
      const latestRecord = historicalData[historicalData.length - 1]
      const valueEl = document.getElementById('dashboard-ph-02')
      const timeEl = document.getElementById('dashboard-ph-02-time')
      
      if (valueEl && latestRecord) {
        valueEl.textContent = latestRecord.value.toFixed(2)
        timeEl.textContent = `Updated: ${new Date(latestRecord.time).toLocaleTimeString()}`
      }
    }
  } catch (err) {
    console.error('Error loading historical data:', err)
  }
}

// Update PH Chart with new data
function updatePHChart(value) {
  if (!phChart) return
  
  const timestamp = new Date().getTime()
  const phValue = parseFloat(value)
  
  if (isNaN(phValue) || value === '--') return
  
  phChartData.push({
    x: timestamp,
    y: phValue
  })
  
  // Keep only last 5 minutes of data (300 points)
  if (phChartData.length > MAX_DATA_POINTS) {
    phChartData.shift()
  }
  
  phChart.updateSeries([{
    data: phChartData
  }])
}

// Update WWT01 display
function updateWWT01Display(data) {
  console.log('Updating WWT01 Display:', data)
  
  // Helper function to update sensor value
  const updateSensor = (id, value, formatter = null) => {
    const element = document.getElementById(id)
    if (element && value !== undefined && value !== null) {
      element.textContent = formatter ? formatter(value) : value
      element.classList.add('data-updated')
      setTimeout(() => element.classList.remove('data-updated'), 300)
    }
  }
  
  // Formatter for values
  const formatValue = (value) => {
    if (value === -32768 || value === 0) return '--'
    if (typeof value === 'number') return value.toFixed(2)
    return value
  }
  
  const formatPHValue = (value) => {
    if (value === -32768 || value === 0) return '--'
    return (value / 100).toFixed(2)
  }
  
  // Lohand No.1 (AT-1)
  updateSensor('wwt01-D1020', data.PH_Sensor_01, formatValue)   // PH Sensor 01
  updateSensor('wwt01-D1001', data.ORP_Sensor_01, formatValue)  // ORP sensor 01
  updateSensor('wwt01-D1007', data.Temp_01, formatValue)        // Temp 01
  updateSensor('wwt01-D1003', data.PH_Sensor_02, formatValue)   // PH Sensor 02
  updateSensor('wwt01-D1005', data.ORP_Sensor_02, formatValue)  // ORP sensor 02
  updateSensor('wwt01-D1006', data.Temp_02, formatValue)        // Temp 02
  // AT-01 Level (D1128) - already multiplied by 0.2 from MQTT, just multiply by 3500 for volume in m³
  if (data.AT_01_Level !== undefined && data.AT_01_Level !== null && data.AT_01_Level !== -32768) {
    const volume = data.AT_01_Level * 3500
    updateSensor('wwt01-D1128', volume, (v) => v.toFixed(2))
  }
  
  // Lohand No.2 (AT-2)
  updateSensor('wwt01-D1029', data.PH_Sensor_03, formatValue)   // PH Sensor 03
  updateSensor('wwt01-D1031', data.ORP_Sensor_03, formatValue)  // ORP sensor 03
  updateSensor('wwt01-D1037', data.Temp_03, formatValue)        // Temp 03
  updateSensor('wwt01-D1033', data.PH_Sensor_04, formatValue)   // PH Sensor 04
  updateSensor('wwt01-D1035', data.ORP_Sensor_04, formatValue)  // ORP sensor 04
  updateSensor('wwt01-D1036', data.Temp_04, formatValue)        // Temp 04
  // Sump Pump Water Level (D1130) - already multiplied by 0.3 from MQTT, just multiply by 3500 for volume in m³
  if (data.Sump_Pump_Water_Level !== undefined && data.Sump_Pump_Water_Level !== null && data.Sump_Pump_Water_Level !== -32768) {
    const volume = data.Sump_Pump_Water_Level * 3500
    updateSensor('wwt01-D1130', volume, (v) => v.toFixed(2))
  }
  // AT-02 Level (D1132) - already multiplied by 0.3 from MQTT, just multiply by 3500 for volume in m³
  if (data.AT_02_Level !== undefined && data.AT_02_Level !== null && data.AT_02_Level !== -32768) {
    const volume = data.AT_02_Level * 3500
    updateSensor('wwt01-D1132', volume, (v) => v.toFixed(2))
  }
  
  // Lohand No.3 (AT-3)
  updateSensor('wwt01-D1049', data.PH_Sensor_05, formatValue)   // PH Sensor 05
  updateSensor('wwt01-D1051', data.ORP_Sensor_05, formatValue)  // ORP sensor 05
  updateSensor('wwt01-D1057', data.Temp_05, formatValue)        // Temp 05
  updateSensor('wwt01-D1053', data.PH_Sensor_06, formatValue)   // PH Sensor 06
  updateSensor('wwt01-D1055', data.ORP_Sensor_06, formatValue)  // ORP sensor 06
  updateSensor('wwt01-D1056', data.Temp_06, formatValue)        // Temp 06
  
  // Supmea Flow Meters
  updateSensor('wwt01-D1021', data.Flow_Meter_No4_RealTime, formatValue)  // Supmea No.4 Real-time flow rate
  updateSensor('wwt01-D1022', data.Flow_Meter_No4_Forward, formatValue)   // Supmea No.4 Forward flow accumulation
  updateSensor('wwt01-D1023', data.Flow_Meter_No1_RealTime, formatValue)  // Supmea No.1 Real-time flow rate
  updateSensor('wwt01-D1024', data.Flow_Meter_No1_Forward, formatValue)   // Supmea No.1 Forward flow accumulation
  updateSensor('wwt01-D1025', data.Flow_Meter_No2_RealTime, formatValue)  // Supmea No.2 Real-time flow rate
  updateSensor('wwt01-D1026', data.Flow_Meter_No2_Forward, formatValue)   // Supmea No.2 Forward flow accumulation
  updateSensor('wwt01-D1027', data.Flow_Meter_No3_RealTime, formatValue)  // Supmea No.3 Real-time flow rate
  updateSensor('wwt01-D1028', data.Flow_Meter_No3_Forward, formatValue)   // Supmea No.3 Forward flow accumulation
  
  // Power Meters MDB
  updateSensor('wwt01-D1070', data.Power_MDB_01_Current, formatValue)      // MDB-01 Current
  updateSensor('wwt01-D1071', data.Power_MDB_01_Active_Power, formatValue) // MDB-01 Active Power Total
  updateSensor('wwt01-D1072', data.Power_MDB_01_Energy, formatValue)       // MDB-01 Active Energy
  updateSensor('wwt01-D1073', data.Power_MDB_02_Current, formatValue)      // MDB-02 Current
  updateSensor('wwt01-D1074', data.Power_MDB_02_Active_Power, formatValue) // MDB-02 Active Power Total
  updateSensor('wwt01-D1075', data.Power_MDB_02_Energy, formatValue)       // MDB-02 Active Energy
  updateSensor('wwt01-D1076', data.Power_MDB_03_Current, formatValue)      // MDB-03 Current
  updateSensor('wwt01-D1077', data.Power_MDB_03_Active_Power, formatValue) // MDB-03 Active Power Total
  updateSensor('wwt01-D1078', data.Power_MDB_03_Energy, formatValue)       // MDB-03 Active Energy
  
  // Turbo Blowers
  updateSensor('wwt01-D1079', data.Turbo_AT01_Output_Power, formatValue)      // AT-01 Output Power
  updateSensor('wwt01-D1080', data.Turbo_AT01_Motor_Current, formatValue)     // AT-01 Motor Current
  updateSensor('wwt01-D1081', data.Turbo_AT01_Flow_Rate, formatValue)         // AT-01 Flow Rate
  updateSensor('wwt01-D1082', data.Turbo_AT02_FAB07_Output_Power, formatValue)  // AT-02 (FAB07) Output Power
  updateSensor('wwt01-D1083', data.Turbo_AT02_FAB07_Flow_Rate, formatValue)     // AT-02 (FAB07) Flow Rate
  updateSensor('wwt01-D1084', data.Turbo_AT02_FAB07_Motor_Current, formatValue) // AT-02 (FAB07) Motor Current
  updateSensor('wwt01-D1085', data.Turbo_AT02_FAB07_Running_Time, formatValue)  // AT-02 (FAB07) Running time
  updateSensor('wwt01-D1086', data.Turbo_AT02_FAB08_Output_Power, formatValue)  // AT-02 (FAB08) Output Power
  updateSensor('wwt01-D1087', data.Turbo_AT02_FAB08_Flow_Rate, formatValue)     // AT-02 (FAB08) Flow Rate
  updateSensor('wwt01-D1088', data.Turbo_AT02_FAB08_Motor_Current, formatValue) // AT-02 (FAB08) Motor Current
  updateSensor('wwt01-D1089', data.Turbo_AT02_FAB08_Running_Time, formatValue)  // AT-02 (FAB08) Running time
  updateSensor('wwt01-D1090', data.Turbo_AT02_GAB05_Output_Power, formatValue)  // AT-02 (GAB05) Output Power
  updateSensor('wwt01-D1091', data.Turbo_AT02_GAB05_Flow_Rate, formatValue)     // AT-02 (GAB05) Flow Rate
  updateSensor('wwt01-D1092', data.Turbo_AT02_GAB05_Motor_Current, formatValue) // AT-02 (GAB05) Motor Current
  updateSensor('wwt01-D1093', data.Turbo_AT02_GAB05_Running_Time, formatValue)  // AT-02 (GAB05) Running time
}

// Initialize Plant Performance Charts
function initPlantPerformanceCharts() {
  // Generate hourly time labels (22:00 - 22:Nov)
  const hours = [];
  for (let i = 22; i >= 0; i--) {
    hours.push(`${i}:00`);
  }
  hours.reverse();

  // Sample data for demonstration
  const performanceData = [2.26, 1.91, 1.53, 1.13, 1.31, 1.04, 1.16, 1.11, 1.46, 1.25, 1.20, 1.83, 1.07, 1.20, 1.31, 1.13, 1.18, 1.17, 1.48, 1.16, 1.22, 1.11, 1.10];
  const costData = [9.76, 8.10, 5.56, 6.56, 4.06, 5.61, 4.54, 5.03, 4.79, 7.37, 6.50, 9.26, 5.38, 5.18, 3.58, 4.58, 5.40, 6.02, 4.84, 5.06, 5.02, 6.38, 5.61];
  const costTarget = Array(23).fill(5.72);
  
  // Flow data (stacked)
  const flowAT1 = [4.78, 3.46, 3.24, 7.93, 6.75, 5.10, 5.97, 8.77, 4.72, 5.33, 3.08, 7.92, 6.55, 4.83, 9.52, 3.91, 4.44, 3.35, 9.57, 5.99, 3.73, 3.68, 4.62];
  const flowAT2 = [1.45, 2.79, 3.42, 3.79, 3.10, 4.15, 4.80, 4.93, 9.08, 5.02, 8.66, 3.02, 5.31, 6.02, 3.04, 4.58, 4.48, 5.55, 4.31, 3.77, 9.68, 4.73, 3.72];
  const flowAT3 = [1.50, 2.73, 1.60, 2.28, 1.47, 2.44, 2.19, 3.47, 4.25, 2.39, 3.41, 1.72, 1.51, 1.60, 2.11, 1.72, 2.41, 1.71, 1.98, 1.63, 1.41, 1.72, 1.59];

  // Energy data (stacked)
  const energyMDB1 = [2.48, 2.13, 2.09, 2.97, 2.15, 2.28, 3.17, 3.97, 3.74, 2.40, 2.52, 2.01, 2.71, 2.76, 3.06, 2.44, 2.46, 2.44];
  const energyMDB2 = [10.91, 11.04, 10.08, 8.20, 8.09, 10.19, 10.47, 9.77, 10.18, 11.93, 11.22, 11.99, 11.23, 11.48, 10.72, 11.62, 11.18, 10.12];
  const energyMDB3 = [2.20, 2.52, 2.09, 2.23, 2.12, 2.08, 2.11, 2.31, 2.20, 2.83, 3.02, 2.94, 3.07, 3.07, 2.19, 3.07, 3.01, 2.34];

  // Detect dark mode
  const isDark = document.documentElement.classList.contains('dark')

  // Chart 1: Plant Performance (kwh/m³)
  chartPerformance = new ApexCharts(document.querySelector("#chart-performance"), {
    series: [{
      name: 'Performance (kWh/m³)',
      data: performanceData
    }],
    chart: {
      type: 'bar',
      height: 200,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: isDark ? '#94a3b8' : '#64748b'
    },
    plotOptions: {
      bar: {
        columnWidth: '90%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: [isDark ? '#cbd5e1' : '#213547']
      }
    },
    colors: ['#3b82f6'],
    title: {
      text: 'Plant Performance (kWh/m³)',
      align: 'left',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: hours,
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464', fontSize: '10px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464' }
      },
      min: 0,
      max: 3.2
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e0e0e0'
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Chart 2: Total Cost (THB/m3)
  chartCost = new ApexCharts(document.querySelector("#chart-cost"), {
    series: [{
      name: 'Cost (THB/m3)',
      data: costData
    }, {
      name: 'Target (THB/m3)',
      data: costTarget
    }],
    chart: {
      type: 'bar',
      height: 200,
      background: 'transparent',
      toolbar: { show: false },
      foreColor: isDark ? '#94a3b8' : '#64748b'
    },
    plotOptions: {
      bar: {
        columnWidth: '90%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: [isDark ? '#cbd5e1' : '#213547']
      }
    },
    colors: ['#22c55e', '#999'],
    title: {
      text: 'Total Cost (THB/m3)',
      align: 'left',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: hours,
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464', fontSize: '10px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464' }
      },
      min: 0,
      max: 10
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e0e0e0'
    },
    legend: {
      labels: { colors: isDark ? '#cbd5e1' : '#646464' }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Chart 3: Total Flow (m3/day) - Stacked
  chartFlow = new ApexCharts(document.querySelector("#chart-flow"), {
    series: [{
      name: 'AT1',
      data: flowAT1
    }, {
      name: 'AT2',
      data: flowAT2
    }, {
      name: 'AT3',
      data: flowAT3
    }],
    chart: {
      type: 'bar',
      height: 200,
      stacked: true,
      background: 'transparent',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        columnWidth: '90%'
      }
    },
    colors: ['#3b82f6', '#a855f7', '#22c55e'],
    title: {
      text: 'Total Flow (m3/day)',
      align: 'left',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: hours,
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464', fontSize: '10px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464' }
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e0e0e0'
    },
    legend: {
      position: 'top',
      labels: { colors: isDark ? '#94a3b8' : '#646464' }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Chart 4: Total Energy (kwh/day) - Stacked
  chartEnergy = new ApexCharts(document.querySelector("#chart-energy"), {
    series: [{
      name: 'MDB1',
      data: energyMDB1
    }, {
      name: 'MDB2',
      data: energyMDB2
    }, {
      name: 'MDB3',
      data: energyMDB3
    }],
    chart: {
      type: 'bar',
      height: 200,
      stacked: true,
      background: 'transparent',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        columnWidth: '90%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val ? val.toFixed(1) : '0'
      },
      style: {
        fontSize: '10px',
        colors: ['#fff']
      }
    },
    colors: ['#3b82f6', '#a855f7', '#fbbf24'],
    title: {
      text: 'Total Energy (kwh/day)',
      align: 'left',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: hours.slice(0, 18),
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464', fontSize: '10px' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: isDark ? '#94a3b8' : '#646464' }
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e0e0e0'
    },
    legend: {
      position: 'top',
      labels: { colors: isDark ? '#94a3b8' : '#646464' }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Pie Chart 1: Total Flow Distribution
  chartFlowPie = new ApexCharts(document.querySelector("#chart-flow-pie"), {
    series: [40, 13, 47],
    chart: {
      type: 'donut',
      height: 250,
      background: 'transparent'
    },
    labels: ['AT1', 'AT2', 'AT3'],
    colors: ['#22c55e', '#3b82f6', '#a855f7'],
    title: {
      text: 'Total Flow',
      align: 'center',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '14px'
      }
    },
    legend: {
      position: 'bottom',
      labels: { colors: isDark ? '#94a3b8' : '#646464' }
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      },
      formatter: function (val) {
        return Math.round(val) + "%"
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%'
        }
      }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Pie Chart 2: Energy Distribution
  chartEnergyPie = new ApexCharts(document.querySelector("#chart-energy-pie"), {
    series: [80, 589, 195, 694],
    chart: {
      type: 'donut',
      height: 250,
      background: 'transparent'
    },
    labels: ['MDB1', 'MDB2', 'MDB3'],
    colors: ['#3b82f6', '#ef4444', '#22c55e'],
    title: {
      text: 'Energy (kwh)',
      align: 'center',
      style: {
        color: isDark ? '#cbd5e1' : '#213547',
        fontSize: '14px'
      }
    },
    legend: {
      position: 'bottom',
      labels: { colors: isDark ? '#94a3b8' : '#646464' }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%'
        }
      }
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  });

  // Render all charts
  chartPerformance.render();
  chartCost.render();
  chartFlow.render();
  chartEnergy.render();
  chartFlowPie.render();
  chartEnergyPie.render();

  // Update date display
  const dateElement = document.getElementById('perf-date');
  if (dateElement) {
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

// Change page content
function changePage(pageName) {
  console.log('[changePage] Changing to:', pageName)
  const page = pages[pageName] || pages.dashboard
  const contentHeader = document.querySelector('.content-header')
  const contentBody = document.querySelector('.content-body')
  
  contentHeader.innerHTML = `
    <h2>${page.title}</h2>
    <p>${page.description}</p>
  `
  contentBody.innerHTML = page.content
  console.log('[changePage] HTML content inserted')
  
  // Call page-specific onLoad function if it exists
  if (page.onLoad && typeof page.onLoad === 'function') {
    console.log('[changePage] Calling onLoad for:', pageName)
    page.onLoad()
  }
  
  // Update latest data if on WWT page
  if (pageName === 'wwt-report' && Object.keys(latestData['zenzero/wwt01']).length > 0) {
    updateWWT01Display(latestData['zenzero/wwt01'])
  } else if (pageName === 'wwt02-report' && Object.keys(latestData['zenzero/wwt02']).length > 0) {
    updateWWT02Display(latestData['zenzero/wwt02'])
  }
}

// Initialize Data History page
function initializeDataHistory() {
  const loadBtn = document.getElementById('load-data-btn')
  const refreshBtn = document.getElementById('refresh-data-btn')
  
  if (loadBtn) {
    loadBtn.addEventListener('click', loadHistoricalData)
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadHistoricalData)
  }
}

// Load historical data from API
async function loadHistoricalData() {
  const timeRange = document.getElementById('time-range').value
  const dataType = document.getElementById('data-type').value
  const tableBody = document.getElementById('table-body')
  const tableHeader = document.getElementById('table-header')
  const totalRecords = document.getElementById('total-records')
  const timeRangeDisplay = document.getElementById('time-range-display')
  
  tableBody.innerHTML = '<tr><td colspan="10" class="loading-cell">Loading data...</td></tr>'
  
  try {
    let data = []
    let apiUrl = `${API_BASE_URL}/`
    
    if (dataType === 'ph-sensor-02') {
      apiUrl += `ph-sensor-02/history?minutes=${timeRange}`
      const response = await fetch(apiUrl)
      data = await response.json()
      
      // Update table header for PH Sensor 02
      tableHeader.innerHTML = `
        <tr>
          <th>Time</th>
          <th>pH Value</th>
          <th>Raw Value</th>
        </tr>
      `
      
      // Update table body
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="loading-cell">No data available</td></tr>'
      } else {
        tableBody.innerHTML = data.map(row => `
          <tr>
            <td>${new Date(row.time).toLocaleString()}</td>
            <td class="data-value">${row.value.toFixed(2)}</td>
            <td>${row.raw_value}</td>
          </tr>
        `).join('')
      }
      
    } else if (dataType === 'wwt01') {
      apiUrl += `wwt01/history?minutes=${timeRange}`
      const response = await fetch(apiUrl)
      data = await response.json()
      
      // Update table header for WWT01
      tableHeader.innerHTML = `
        <tr>
          <th>Time</th>
          <th>ORP 01</th>
          <th>PH 01</th>
          <th>ORP 02</th>
          <th>PH 02</th>
          <th>ORP 03</th>
          <th>SL Tank</th>
          <th>Feed Tank</th>
          <th>Feed/Day</th>
          <th>Total Feed</th>
        </tr>
      `
      
      // Update table body
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="loading-cell">No data available</td></tr>'
      } else {
        tableBody.innerHTML = data.map(row => `
          <tr>
            <td>${new Date(row.time).toLocaleString()}</td>
            <td>${row.orp_sensor_01 || '-'}</td>
            <td>${row.ph_sensor_01 ? (row.ph_sensor_01 / 100).toFixed(2) : '-'}</td>
            <td>${row.orp_sensor_02 || '-'}</td>
            <td>${row.ph_sensor_02 ? (row.ph_sensor_02 / 100).toFixed(2) : '-'}</td>
            <td>${row.orp_sensor_03 || '-'}</td>
            <td>${row.sl_tank_sensor || '-'}</td>
            <td>${row.feed_tank_sensor || '-'}</td>
            <td>${row.feed_per_day || '-'}</td>
            <td>${row.total_feed || '-'}</td>
          </tr>
        `).join('')
      }
    }
    
    // Update stats
    totalRecords.textContent = data.length
    if (data.length > 0) {
      const firstTime = new Date(new Date(data[0].time).getTime() + (7 * 60 * 60 * 1000))
      const lastTime = new Date(new Date(data[data.length - 1].time).getTime() + (7 * 60 * 60 * 1000))
      timeRangeDisplay.textContent = `${firstTime.toLocaleString()} - ${lastTime.toLocaleString()}`
    } else {
      timeRangeDisplay.textContent = '-'
    }
    
  } catch (err) {
    console.error('Error loading data:', err)
    tableBody.innerHTML = `<tr><td colspan="10" class="error-cell">Error loading data: ${err.message}</td></tr>`
  }
}

// Handle navigation
const navItems = document.querySelectorAll('.nav-item')
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault()
    navItems.forEach(nav => nav.classList.remove('active'))
    item.classList.add('active')
    
    const pageName = item.getAttribute('data-page') || 'dashboard'
    changePage(pageName)
  })
})

// Lohand Charts - Separated by Lohand and Variable Type
let lohandCharts = {
  at1: { ph: null, orp: null, temp: null },
  at2: { ph: null, orp: null, temp: null },
  at3: { ph: null, orp: null, temp: null }
}

let flowHourlyChart = null
let flowDailyChart = null

let lohandData = {
  at1: { 
    ph: { ph01: [], ph02: [] },
    orp: { orp01: [], orp02: [] },
    temp: { temp01: [], temp02: [] }
  },
  at2: { 
    ph: { ph03: [], ph04: [] },
    orp: { orp03: [], orp04: [] },
    temp: { temp03: [], temp04: [] }
  },
  at3: { 
    ph: { ph05: [], ph06: [] },
    orp: { orp05: [], orp06: [] },
    temp: { temp05: [], temp06: [] }
  }
}

const MAX_CHART_POINTS = 200
let hasReceivedData = false

// Initialize Lohand Charts
function initializeLohandCharts() {
  console.log('[Dashboard] Initializing separated Lohand charts...')
  
  // Check if chart containers exist
  const containers = ['chart-at1-ph', 'chart-at1-orp', 'chart-at1-temp', 
                     'chart-at2-ph', 'chart-at2-orp', 'chart-at2-temp',
                     'chart-at3-ph', 'chart-at3-orp', 'chart-at3-temp']
  containers.forEach(id => {
    const el = document.getElementById(id)
    console.log(`[Dashboard] Container ${id}:`, el ? 'Found' : 'NOT FOUND')
  })
  
  // Base chart options
  const createChartOptions = (title, seriesConfig, yaxisTitle, yaxisDecimals = 2) => {
    const isDark = document.documentElement.classList.contains('dark')
    return {
      series: seriesConfig.map(s => ({ name: s.name, data: [] })),
      chart: {
        type: 'line',
        height: 350,
        animations: {
          enabled: true,
          easing: 'linear',
          dynamicAnimation: { speed: 1000 }
        },
        toolbar: { show: true, tools: { download: true, zoom: true, pan: true } },
        zoom: { enabled: true, type: 'x' },
        foreColor: isDark ? '#94a3b8' : '#64748b',
        background: isDark ? '#1e293b' : '#ffffff'
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      markers: { size: 0 },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeFormatter: {
            hour: 'HH:mm',
            minute: 'HH:mm'
          },
          style: { colors: isDark ? '#94a3b8' : '#64748b' }
        }
      },
      yaxis: {
        title: { text: yaxisTitle, style: { color: isDark ? '#cbd5e1' : '#0f172a' } },
        decimalsInFloat: yaxisDecimals,
        labels: { 
          formatter: (val) => val ? val.toFixed(yaxisDecimals) : '--',
          style: { colors: isDark ? '#94a3b8' : '#64748b' }
        }
      },
      legend: { show: true, position: 'top', labels: { colors: isDark ? '#cbd5e1' : '#0f172a' } },
      tooltip: { 
        theme: isDark ? 'dark' : 'light',
        x: { format: 'HH:mm:ss' },
        y: {
          formatter: (val) => val ? val.toFixed(yaxisDecimals) : '--'
        }
      },
      title: { text: title, align: 'center', style: { fontSize: '14px', color: isDark ? '#cbd5e1' : '#0f172a' } },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      grid: {
        borderColor: isDark ? '#334155' : '#e2e8f0'
      },
      theme: { mode: isDark ? 'dark' : 'light' }
    }
  }

  // AT-1 Charts
  const at1PhEl = document.getElementById('chart-at1-ph')
  if (!at1PhEl) {
    console.error('[Dashboard] chart-at1-ph element not found!')
    return
  }
  
  lohandCharts.at1.ph = new ApexCharts(
    at1PhEl,
    createChartOptions('PH Sensors', [
      { name: 'PH-01' },
      { name: 'PH-02' }
    ], 'pH Level', 2)
  )
  lohandCharts.at1.ph.render()

  lohandCharts.at1.orp = new ApexCharts(
    document.getElementById('chart-at1-orp'),
    createChartOptions('ORP Sensors', [
      { name: 'ORP-01' },
      { name: 'ORP-02' }
    ], 'ORP (mV)', 0)
  )
  lohandCharts.at1.orp.render()

  lohandCharts.at1.temp = new ApexCharts(
    document.getElementById('chart-at1-temp'),
    createChartOptions('Temperature', [
      { name: 'Temp-01' },
      { name: 'Temp-02' }
    ], 'Temperature (°C)', 1)
  )
  lohandCharts.at1.temp.render()

  // AT-2 Charts
  lohandCharts.at2.ph = new ApexCharts(
    document.getElementById('chart-at2-ph'),
    createChartOptions('PH Sensors', [
      { name: 'PH-03' },
      { name: 'PH-04' }
    ], 'pH Level', 2)
  )
  lohandCharts.at2.ph.render()

  lohandCharts.at2.orp = new ApexCharts(
    document.getElementById('chart-at2-orp'),
    createChartOptions('ORP Sensors', [
      { name: 'ORP-03' },
      { name: 'ORP-04' }
    ], 'ORP (mV)', 0)
  )
  lohandCharts.at2.orp.render()

  lohandCharts.at2.temp = new ApexCharts(
    document.getElementById('chart-at2-temp'),
    createChartOptions('Temperature', [
      { name: 'Temp-03' },
      { name: 'Temp-04' }
    ], 'Temperature (°C)', 1)
  )
  lohandCharts.at2.temp.render()

  // AT-3 Charts
  lohandCharts.at3.ph = new ApexCharts(
    document.getElementById('chart-at3-ph'),
    createChartOptions('PH Sensors', [
      { name: 'PH-05' },
      { name: 'PH-06' }
    ], 'pH Level', 2)
  )
  lohandCharts.at3.ph.render()

  lohandCharts.at3.orp = new ApexCharts(
    document.getElementById('chart-at3-orp'),
    createChartOptions('ORP Sensors', [
      { name: 'ORP-05' },
      { name: 'ORP-06' }
    ], 'ORP (mV)', 0)
  )
  lohandCharts.at3.orp.render()

  lohandCharts.at3.temp = new ApexCharts(
    document.getElementById('chart-at3-temp'),
    createChartOptions('Temperature', [
      { name: 'Temp-05' },
      { name: 'Temp-06' }
    ], 'Temperature (°C)', 1)
  )
  lohandCharts.at3.temp.render()
}

// Initialize Flow Hourly Chart
function initializeFlowHourlyChart() {
  console.log('[Dashboard] Initializing Flow Hourly Chart...')
  
  const chartEl = document.getElementById('chart-flow-hourly')
  if (!chartEl) {
    console.error('[Dashboard] Flow Hourly chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  
  const options = {
    series: [{
      name: 'Flow Accumulation',
      type: 'bar',
      data: []
    }, {
      name: 'ORP-In',
      type: 'line',
      data: []
    }, {
      name: 'ORP-Out',
      type: 'line',
      data: []
    }, {
      name: 'ORP-Avg',
      type: 'line',
      data: []
    }, {
      name: 'Energy/Flow (kWh/m³)',
      type: 'line',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { 
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0, 1, 2, 3, 4], // แสดงทุกกราฟ (Flow, ORP-In, ORP-Out, ORP-Avg, Energy/Flow)
      formatter: function (val) {
        return val ? val.toFixed(2) : '0.00'
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: [isDark ? '#cbd5e1' : '#0f172a']
      },
      background: {
        enabled: true,
        foreColor: isDark ? '#1e293b' : '#ffffff',
        borderRadius: 2,
        padding: 4,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: isDark ? '#475569' : '#cbd5e1'
      }
    },
    stroke: {
      show: true,
      width: [0, 1, 1, 3, 2],
      colors: ['transparent', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
      curve: 'smooth'
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Hour',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b',
          fontSize: '11px'
        }
      }
    },
    yaxis: [{
      seriesName: 'Flow Accumulation',
      title: {
        text: 'Flow Accumulation (m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(0) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }, {
      seriesName: ['ORP-In', 'ORP-Out', 'ORP-Avg'],
      opposite: true,
      title: {
        text: 'ORP (mV)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(1) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }, {
      seriesName: 'Energy/Flow (kWh/m³)',
      opposite: true,
      min: 0,
      max: function(max) {
        // ปรับ scale ให้เหมาะสมกับค่าน้อยๆ
        return max > 0 ? max * 1.2 : 1
      },
      title: {
        text: 'Energy/Flow (kWh/m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(3) : '0.000'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }],
    fill: {
      opacity: [1, 0.9, 0.9, 0.9],
      colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: [
        {
          formatter: function (val) {
            return val ? val.toFixed(2) + ' m³' : '0 m³'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(1) + ' mV' : '0 mV'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(1) + ' mV' : '0 mV'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(3) + ' kWh/m³' : '0 kWh/m³'
          }
        }
      ]
    },
    title: {
      text: 'Hourly Flow, ORP & Energy Efficiency',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#94a3b8' : '#64748b'
      }
    }
  }
  
  flowHourlyChart = new ApexCharts(chartEl, options)
  flowHourlyChart.render()
  console.log('[Dashboard] Flow Hourly Chart initialized')
}

// Load and Update Flow Hourly Data
async function loadFlowHourlyData(selectedDate = null) {
  console.log('[Dashboard] Loading Flow Hourly data...', selectedDate ? 'for date: ' + selectedDate : '')
  
  // Disable realtime updates while loading from API
  const wasRealtimeMode = realtimeFlowEnergyData.isRealtimeMode
  realtimeFlowEnergyData.isRealtimeMode = false
  
  try {
    let startDate, endDate
    
    if (selectedDate) {
      // Load data for specific date from 6 AM to next day 6 AM
      const date = new Date(selectedDate)
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0)
      const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 6, 0, 0)
      
      startDate = startTime.toISOString()
      endDate = endTime.toISOString()
      
      console.log('[Dashboard] Loading data from', startTime.toLocaleString(), 'to', endTime.toLocaleString())
    } else {
      // Load data for today from 6 AM to next day 6 AM
      const now = new Date()
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0)
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0)
      
      startDate = startTime.toISOString()
      endDate = endTime.toISOString()
      
      console.log('[Dashboard] Loading today data from', startTime.toLocaleString(), 'to', endTime.toLocaleString())
    }
    
    const response = await fetch(`${API_BASE_URL}/wwt01/data-range?startDate=${startDate}&endDate=${endDate}`)
    if (!response.ok) throw new Error('Failed to fetch data')
    
    const rows = await response.json()
    console.log('[loadFlowHourlyData] Loaded', rows.length, 'rows from API')
    console.log('[loadFlowHourlyData] First 3 rows:', rows.slice(0, 3))
    console.log('[loadFlowHourlyData] Date range:', startDate, 'to', endDate)
    
    if (rows.length === 0) {
      console.log('[Dashboard] No flow data available')
      // Re-enable realtime mode if it was on
      if (wasRealtimeMode) {
        realtimeFlowEnergyData.isRealtimeMode = true
      }
      return
    }
    
    // Group data by hour and calculate max - min for flow, average for ORP
    const hourlyData = {}
    let datePrefix = ''
    
    if (selectedDate) {
      try {
        datePrefix = new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' '
      } catch (e) {
        console.error('[loadFlowHourlyData] Error formatting date prefix:', e)
        datePrefix = ''
      }
    }
    
    console.log('[loadFlowHourlyData] Processing', rows.length, 'rows...')
    
    rows.forEach((row, index) => {
      try {
        const date = new Date(row.time)
        const hourKey = `${date.getHours().toString().padStart(2, '0')}:00`
        
        if (index < 3) {
          console.log(`[loadFlowHourlyData] Row ${index}: time=${row.time}, date=${date.toISOString()}, hourKey=${hourKey}, flow=${row.flow_meter_no1_forward}`)
        }
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = {
            max: row.flow_meter_no1_forward || 0,
            min: row.flow_meter_no1_forward || 0,
            orpSensor01Sum: 0,
            orpSensor01Count: 0,
            orpSensor02Sum: 0,
            orpSensor02Count: 0,
            energyMax: row.power_mdb_01_energy || 0,
            energyMin: row.power_mdb_01_energy || 0
          }
        }
      
      // Flow data
      if (row.flow_meter_no1_forward !== null && row.flow_meter_no1_forward !== undefined) {
        hourlyData[hourKey].max = Math.max(hourlyData[hourKey].max, row.flow_meter_no1_forward)
        hourlyData[hourKey].min = Math.min(hourlyData[hourKey].min, row.flow_meter_no1_forward)
      }
      
      // ORP-In data
      if (row.orp_sensor_01 !== null && row.orp_sensor_01 !== undefined) {
        hourlyData[hourKey].orpSensor01Sum += row.orp_sensor_01
        hourlyData[hourKey].orpSensor01Count++
      }
      
      // ORP-Out data
      if (row.orp_sensor_02 !== null && row.orp_sensor_02 !== undefined) {
        hourlyData[hourKey].orpSensor02Sum += row.orp_sensor_02
        hourlyData[hourKey].orpSensor02Count++
      }
      
      // Power Energy data
      if (row.power_mdb_01_energy !== null && row.power_mdb_01_energy !== undefined) {
        hourlyData[hourKey].energyMax = Math.max(hourlyData[hourKey].energyMax, row.power_mdb_01_energy)
        hourlyData[hourKey].energyMin = Math.min(hourlyData[hourKey].energyMin, row.power_mdb_01_energy)
      }
      } catch (rowError) {
        console.error('[loadFlowHourlyData] Error processing row', index, ':', rowError, row)
      }
    })
    
    console.log('[loadFlowHourlyData] Hourly data keys:', Object.keys(hourlyData))
    console.log('[loadFlowHourlyData] Total hours with data:', Object.keys(hourlyData).length)
    if (Object.keys(hourlyData).length > 0) {
      const firstKey = Object.keys(hourlyData)[0]
      console.log('[loadFlowHourlyData] First hour sample:', firstKey, hourlyData[firstKey])
    }
    
    // Prepare chart data - Start from 6 AM
    const allHours = []
    const displayLabels = []
    for (let i = 0; i < 24; i++) {
      const hour = (6 + i) % 24  // Start from 6 AM
      const hourKey = `${hour.toString().padStart(2, '0')}:00`
      allHours.push(hourKey)
      
      // Add date prefix to first hour (06:00) or when crossing midnight
      if (i === 0 || hour === 0) {
        displayLabels.push(datePrefix + hourKey)
     
    
    console.log('[loadFlowHourlyData] All hours array:', allHours) } else {
        displayLabels.push(hourKey)
      }
    }
    
    // Map data to hours starting from 6 AM
    const flowValues = allHours.map(hour => {
      if (hourlyData[hour] && hourlyData[hour].max !== null && hourlyData[hour].min !== null) {
        const diff = hourlyData[hour].max - hourlyData[hour].min
        console.log(`[Flow] ${hour}: max=${hourlyData[hour].max}, min=${hourlyData[hour].min}, diff=${diff}`)
        
        // Filter out abnormal flow differences (likely meter resets/malfunctions)
        // Normal hourly flow should not exceed 10,000 liters per hour
        if (diff > 10000) {
          console.warn(`[Flow] ${hour}: Abnormal flow difference detected: ${diff}, setting to 0`)
          return 0
        }
        
        return diff > 0 ? diff : 0
      }
      console.log(`[Flow] ${hour}: NO DATA`)
      return 0  // No data for this hour
    })
    
    const orpSensor01Values = allHours.map(hour => {
      if (hourlyData[hour] && hourlyData[hour].orpSensor01Count > 0) {
        const avg = hourlyData[hour].orpSensor01Sum / hourlyData[hour].orpSensor01Count
        return isNaN(avg) ? 0 : avg
      }
      return 0  // Return 0 instead of null to prevent chart errors
    })
    
    const orpSensor02Values = allHours.map(hour => {
      if (hourlyData[hour] && hourlyData[hour].orpSensor02Count > 0) {
        const avg = hourlyData[hour].orpSensor02Sum / hourlyData[hour].orpSensor02Count
        return isNaN(avg) ? 0 : avg
      }
      return 0  // Return 0 instead of null to prevent chart errors
    })
    
    // Calculate ORP Average (ORP-Avg)
    const orpAvgValues = allHours.map((hour, index) => {
      const orp01 = orpSensor01Values[index]
      const orp02 = orpSensor02Values[index]
      if (orp01 > 0 && orp02 > 0) {
        return (orp01 + orp02) / 2
      } else if (orp01 > 0) {
        return orp01
      } else if (orp02 > 0) {
        return orp02
      }
      return 0
    })
    
    // Calculate Energy per Flow (kWh/m³)
    const energyPerFlowValues = allHours.map(hour => {
      if (hourlyData[hour]) {
        const flowDiff = hourlyData[hour].max - hourlyData[hour].min
        const energyDiff = hourlyData[hour].energyMax - hourlyData[hour].energyMin
        
        // Only calculate if flow is not zero
        if (flowDiff > 0 && energyDiff > 0) {
          const ratio = energyDiff / flowDiff
          return isNaN(ratio) ? 0 : ratio
        }
      }
      return 0  // Return 0 instead of null to prevent chart errors
    })
    
    console.log('[loadFlowHourlyData] Flow values:', flowValues)
    console.log('[loadFlowHourlyData] ORP 01 values:', orpSensor01Values)
    console.log('[loadFlowHourlyData] ORP 02 values:', orpSensor02Values)
    console.log('[loadFlowHourlyData] Energy/Flow values:', energyPerFlowValues)
    
    // Update chart - destroy and recreate to ensure proper rendering
    if (flowHourlyChart) {
      flowHourlyChart.destroy()
    }
    
    const chartEl = document.getElementById('chart-flow-hourly')
    if (chartEl) {
      const isDark = document.documentElement.classList.contains('dark')
      
      const options = {
        series: [{
          name: 'Flow Accumulation',
          type: 'bar',
          data: flowValues
        }, {
          name: 'ORP-In',
          type: 'line',
          data: orpSensor01Values
        }, {
          name: 'ORP-Out',
          type: 'line',
          data: orpSensor02Values
        }, {
          name: 'ORP-Avg',
          type: 'line',
          data: orpAvgValues
        }, {
          name: 'Energy/Flow (kWh/m³)',
          type: 'line',
          data: energyPerFlowValues
        }],
        chart: {
          height: 350,
          type: 'line',
          toolbar: { show: true },
          background: 'transparent',
          animations: { enabled: false }
        },
        stroke: {
          width: [0, 1, 1, 3, 2],
          curve: 'smooth'
        },
        plotOptions: {
          bar: {
            columnWidth: '50%',
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [0, 1, 2, 3, 4],
          offsetY: -5,
          formatter: function(val) {
            return val ? val.toFixed(1) : '0'
          },
          style: {
            fontSize: '10px',
            colors: [isDark ? '#cbd5e1' : '#0f172a']
          },
          background: {
            enabled: true,
            foreColor: isDark ? '#1e293b' : '#ffffff',
            padding: 4,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: isDark ? '#475569' : '#e2e8f0',
            opacity: 0.9
          }
        },
        colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
        xaxis: {
          categories: displayLabels,
          labels: {
            rotate: -45,
            rotateAlways: true,
            style: {
              colors: isDark ? '#94a3b8' : '#64748b',
              fontSize: '10px'
            }
          }
        },
        yaxis: [{
          seriesName: 'Flow Accumulation',
          title: {
            text: 'Flow Accumulation (m³)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(2) : '0'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }, {
          seriesName: ['ORP-In', 'ORP-Out', 'ORP-Avg'],
          opposite: true,
          title: {
            text: 'ORP (mV)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(1) : '0'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }, {
          seriesName: 'Energy/Flow (kWh/m³)',
          opposite: true,
          min: 0,
          max: function(max) {
            return max > 0 ? max * 1.2 : 1
          },
          title: {
            text: 'Energy/Flow (kWh/m³)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(3) : '0.000'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }],
        fill: {
          opacity: [1, 0.9, 0.9, 0.9],
          colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          shared: true,
          intersect: false,
          y: [
            {
              formatter: function (val) {
                return val ? val.toFixed(1) + ' m³' : '0 m³'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(0) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(0) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(0) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(2) + ' kWh/m³' : '0 kWh/m³'
              }
            }
          ]
        },
        title: {
          text: 'Hourly Flow, ORP & Energy Efficiency',
          align: 'left',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: isDark ? '#cbd5e1' : '#0f172a'
          }
        },
        grid: {
          borderColor: isDark ? '#334155' : '#e2e8f0'
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: {
            colors: isDark ? '#94a3b8' : '#64748b'
          }
        }
      }
      
      flowHourlyChart = new ApexCharts(chartEl, options)
      flowHourlyChart.render()
      
      const dateInfo = selectedDate ? ` for ${new Date(selectedDate).toLocaleDateString()}` : ''
      console.log('[Dashboard] Flow Hourly chart recreated with', allHours.length, 'hours (starting from 6 AM)' + dateInfo)
    } else {
      console.error('[loadFlowHourlyData] Chart element #chart-flow-hourly not found!')
    }
    
    // Keep realtime mode disabled
    // const today = new Date().toISOString().split('T')[0]
    // if (!selectedDate || selectedDate === today) {
    //   realtimeFlowEnergyData.isRealtimeMode = true
    // }
    
  } catch (error) {
    console.error('[Dashboard] Error loading flow hourly data:', error)
    // Keep realtime mode disabled
    // if (wasRealtimeMode) {
    //   realtimeFlowEnergyData.isRealtimeMode = wasRealtimeMode
    // }
  }
}

// Initialize Flow Daily Chart
function initializeFlowDailyChart() {
  console.log('[Dashboard] Initializing Flow Daily Chart...')
  
  const chartEl = document.getElementById('chart-flow-daily')
  if (!chartEl) {
    console.error('[Dashboard] Flow Daily chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  
  const options = {
    series: [{
      name: 'Flow Accumulation',
      type: 'bar',
      data: []
    }, {
      name: 'ORP-In',
      type: 'line',
      data: []
    }, {
      name: 'ORP-Out',
      type: 'line',
      data: []
    }, {
      name: 'ORP-Avg',
      type: 'line',
      data: []
    }, {
      name: 'Energy/Flow (kWh/m³)',
      type: 'bar',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: { 
        show: true,
        tools: {
          download: true,
          zoom: true,
          pan: true
        }
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0, 1, 2, 3, 4],
      formatter: function (val, opts) {
        return val ? val.toFixed(2) : '0.00'
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        fontWeight: 'bold',
        colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#f59e0b']
      },
      background: {
        enabled: true,
        foreColor: '#ffffff',
        borderRadius: 3,
        padding: 4,
        opacity: 0.95,
        borderWidth: 0
      }
    },
    stroke: {
      show: true,
      width: [0, 3, 3, 3, 0],
      colors: ['transparent', '#f59e0b', '#10b981', '#ef4444', 'transparent'],
      curve: 'smooth'
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Day',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b',
          fontSize: '10px'
        }
      }
    },
    yaxis: [{
      seriesName: 'Flow Accumulation',
      title: {
        text: 'Flow Accumulation (m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(0) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }, {
      seriesName: ['ORP-In', 'ORP-Out', 'ORP-Avg'],
      opposite: true,
      title: {
        text: 'ORP (mV)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(0) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }, {
      seriesName: 'Energy/Flow (kWh/m³)',
      opposite: true,
      min: 0,
      max: function(max) {
        return max > 0 ? max * 1.2 : 1
      },
      title: {
        text: 'Energy/Flow (kWh/m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(3) : '0.000'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    }],
    fill: {
      opacity: [1, 0.9, 0.9, 0.9, 0.9],
      colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#f59e0b']
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: [
        {
          formatter: function (val) {
            return val ? val.toFixed(2) + ' m³' : '0 m³'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(1) + ' mV' : '0 mV'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(1) + ' mV' : '0 mV'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(1) + ' mV' : '0 mV'
          }
        },
        {
          formatter: function (val) {
            return val ? val.toFixed(3) + ' kWh/m³' : '0 kWh/m³'
          }
        }
      ]
    },
    title: {
      text: 'Daily Flow, ORP & Energy Efficiency (6am-6am)',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#94a3b8' : '#64748b'
      }
    }
  }
  
  flowDailyChart = new ApexCharts(chartEl, options)
  flowDailyChart.render()
  console.log('[Dashboard] Flow Daily Chart initialized')
}

// Initialize AT-02 Inlet Volume Chart
let at02InletChart = null
let at02HourlyChart = null
let at02ORPChart = null
let at02LevelChart = null
let at02LevelData = []

// Initialize AT-02 Level Chart
function initializeAT02LevelChart() {
  console.log('[Dashboard] Initializing AT-02 Level Chart...')
  
  const chartEl = document.getElementById('chart-at02-level')
  if (!chartEl) {
    console.error('[Dashboard] AT-02 Level chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  
  // Calculate time range: 06:00 today to 06:00 tomorrow (Thailand time)
  const now = new Date()
  const thailandNow = new Date(now.getTime() + (7 * 60 * 60 * 1000))
  
  // Set to 06:00 tomorrow
  const endTime = new Date(thailandNow.getFullYear(), thailandNow.getMonth(), thailandNow.getDate() + 1, 6, 0, 0)
  // If current time is before 06:00, use yesterday 06:00 to today 06:00
  if (thailandNow.getHours() < 6) {
    endTime.setDate(endTime.getDate() - 1)
  }
  const startTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000))
  
  const options = {
    series: [{
      name: 'AT-02 Level',
      type: 'area',
      data: []
    }, {
      name: 'Moving Average (60min)',
      type: 'line',
      data: []
    }],
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      zoom: {
        enabled: false
      },
      selection: {
        enabled: false
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff',
      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 1000
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: [2, 3],
      dashArray: [0, 5]
    },
    fill: {
      type: ['gradient', 'solid'],
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      },
      opacity: [0.4, 0]
    },
    colors: ['#3b82f6', '#f59e0b'],
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        format: 'HH:mm',
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      },
      title: {
        text: 'Time (Last 24 hours)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Water Level (m)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(2) : '0.00'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: function(val) {
          return val ? val.toFixed(3) + ' m' : 'No data'
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#94a3b8' : '#64748b'
      }
    },
    title: {
      text: 'AT-02 Water Level - Real-time',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    }
  }
  
  at02LevelChart = new ApexCharts(chartEl, options)
  at02LevelChart.render()
  console.log('[Dashboard] AT-02 Level Chart initialized')
}

// Load AT-02 Level Historical Data
// Store AT-02 level threshold
let at02LevelThreshold = -0.0005

async function loadAT02LevelData() {
  console.log('[Dashboard] Loading AT-02 Level historical data...')
  
  try {
    // Load last 24 hours of data
    const response = await fetch(`${API_BASE_URL}/wwt01/history?minutes=1440&limit=10000`)
    if (!response.ok) throw new Error('Failed to fetch AT-02 level data')
    
    const rows = await response.json()
    console.log('[loadAT02LevelData] Loaded', rows.length, 'records')
    
    // Prepare timeseries data
    const levelData = []
    rows.forEach(row => {
      if (row.at_02_level !== null && row.at_02_level !== undefined) {
        const timestamp = new Date(row.time).getTime()
        const levelValue = parseFloat(row.at_02_level)
        
        levelData.push({
          x: timestamp,
          y: levelValue
        })
      }
    })
    
    console.log('[loadAT02LevelData] Prepared', levelData.length, 'data points')
    
    // Remove outliers before calculating moving average
    // ตัด outlier โดยเปรียบเทียบกับค่าข้างเคียง - ถ้าต่างกันมากเกินไปให้ใช้ค่าเฉลี่ย
    const cleanedData = []
    const outlierThreshold = 0.15 // ถ้าต่างจากค่าข้างเคียงเกิน 0.15 m ถือว่าเป็น outlier
    
    for (let i = 0; i < levelData.length; i++) {
      if (i === 0 || i === levelData.length - 1) {
        // จุดแรกและจุดสุดท้ายเก็บไว้
        cleanedData.push(levelData[i])
      } else {
        const prev = levelData[i - 1].y
        const current = levelData[i].y
        const next = levelData[i + 1].y
        
        const diffPrev = Math.abs(current - prev)
        const diffNext = Math.abs(current - next)
        
        // ถ้าต่างจากทั้งก่อนหน้าและถัดไปมาก = outlier
        if (diffPrev > outlierThreshold && diffNext > outlierThreshold) {
          // ใช้ค่าเฉลี่ยของจุดข้างเคียงแทน
          cleanedData.push({
            x: levelData[i].x,
            y: (prev + next) / 2
          })
          console.log('[loadAT02LevelData] Outlier removed at', new Date(levelData[i].x).toLocaleTimeString(), 
                      'Original:', current.toFixed(3), 'Replaced with:', ((prev + next) / 2).toFixed(3))
        } else {
          cleanedData.push(levelData[i])
        }
      }
    }
    
    console.log('[loadAT02LevelData] Cleaned data:', cleanedData.length, 'points (outliers removed)')
    
    // Calculate moving average (60-minute window for very smooth trend - reduces noise)
    const trendData = []
    const windowSize = 120 // ~60 minutes at 30-second intervals - smooth line, no sudden changes
    
    for (let i = 0; i < cleanedData.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(cleanedData.length, i + Math.ceil(windowSize / 2))
      const windowPoints = cleanedData.slice(start, end)
      
      if (windowPoints.length > 0) {
        const avgLevel = windowPoints.reduce((sum, p) => sum + p.y, 0) / windowPoints.length
        trendData.push({
          x: cleanedData[i].x,
          y: avgLevel
        })
      }
    }
    
    console.log('[loadAT02LevelData] Trend data prepared:', trendData.length, 'points')
    
    // Enhanced trend detection using Moving Average (60min) with window-based slope
    // ตรวจจับ downtrend จาก Moving Average โดยใช้ความชันจากช่วงเวลา (window)
    // เพื่อหาแนวโน้มที่มีนัยสำคัญ ไม่ใช่แค่จุดติดกัน
    const annotations = []
    const volumeLabels = []
    const config = {
      slopeThreshold: at02LevelThreshold,  // ใช้ค่าจาก UI threshold input (default -0.0005)
      slopeWindowSize: 10,                  // คำนวณความชันจาก 10 จุด (~5 นาที)
      minConsecutivePoints: 6,              // ต้องลดต่อเนื่อง 6 จุดขึ้นไป
      minVolumeChange: 100,                 // ต้องลดอย่างน้อย 100 m³
      recoveryThreshold: 0.0008,            // ต้องกลับตัวชัดเจน (slope >= 0.0008)
      volumeConversionFactor: 3500          // ค่าคงที่สำหรับคำนวณปริมาตร (m³ ต่อเมตร)
    }
    
    let consecutiveDownPoints = 0
    let downtrendStart = null
    let downtrendPeak = null
    
    console.log('[AT-02 Detection] Starting detection with config:', config)
    console.log('[AT-02 Detection] Trend data points:', trendData.length)
    console.log('[AT-02 Detection] Timestamp:', new Date().toISOString(), '- v22')
    
    for (let i = config.slopeWindowSize; i < trendData.length; i++) {
      // คำนวณความชันจากการเปลี่ยนแปลงในช่วง slopeWindowSize จุด
      // เพื่อดูแนวโน้มที่ชัดเจนขึ้น ไม่ใช่แค่จุดติดกัน
      const windowStart = i - config.slopeWindowSize
      const levelChange = trendData[i].y - trendData[windowStart].y
      
      // ความชันเฉลี่ยต่อจุด (เพื่อเทียบกับ threshold)
      const avgSlopePerPoint = levelChange / config.slopeWindowSize
      
      // นับจุดที่ลดติดกัน (ใช้ Moving Average สำหรับความแม่นยำ)
      if (avgSlopePerPoint < config.slopeThreshold) {
        consecutiveDownPoints++
        
        // เริ่ม downtrend เมื่อลดติดกัน >= minConsecutivePoints
        if (consecutiveDownPoints === config.minConsecutivePoints && !downtrendStart) {
          // บันทึกจุดที่ downtrend ยืนยันแล้ว (หลังจาก minConsecutivePoints)
          downtrendStart = {
            index: i - consecutiveDownPoints,
            time: trendData[i - consecutiveDownPoints].x,
            level: trendData[i - consecutiveDownPoints].y
          }
          
          console.log('[AT-02] ✓ Downtrend START detected at', 
                      new Date(downtrendStart.time).toLocaleString(),
                      'Level:', downtrendStart.level.toFixed(3))
        }
      } else if (avgSlopePerPoint >= config.recoveryThreshold) {
        // หยุดลดลง
        if (downtrendStart && consecutiveDownPoints >= config.minConsecutivePoints) {
          const endIndex = i - 1
          const currentLevel = trendData[endIndex].y
          const levelDrop = downtrendStart.level - currentLevel
          const volumeChange = levelDrop * config.volumeConversionFactor  // ได้ผลเป็น m³
          const durationMinutes = (trendData[endIndex].x - downtrendStart.time) / (1000 * 60)
          
          // เช็คว่าปริมาณลดลงมากพอหรือไม่
          if (volumeChange >= config.minVolumeChange) {
            console.log('[AT-02 Detection] ✓ ANNOTATION ADDED!')
            console.log('[AT-02 Detection] Downtrend ended at', 
                        new Date(trendData[endIndex].x).toLocaleTimeString(),
                        'End level:', currentLevel.toFixed(3),
                        'Level drop:', levelDrop.toFixed(3), 'm',
                        'Volume:', volumeChange.toFixed(0), 'm³',
                        'Duration:', durationMinutes.toFixed(1), 'min')
            
            // Add START line (green)
            annotations.push({
              x: downtrendStart.time,
              borderColor: '#10b981',
              borderWidth: 2,
              strokeDashArray: 4,
              label: {
                text: 'Start Outflow',
                style: {
                  color: '#fff',
                  background: '#10b981',
                  fontSize: '10px',
                  fontWeight: 'bold'
                },
                orientation: 'horizontal',
                offsetY: 0
              }
            })
            
            // Add END line (red)
            annotations.push({
              x: trendData[endIndex].x,
              borderColor: '#ef4444',
              borderWidth: 2,
              strokeDashArray: 4,
              label: {
                text: 'End Outflow',
                style: {
                  color: '#fff',
                  background: '#ef4444',
                  fontSize: '10px',
                  fontWeight: 'bold'
                },
                orientation: 'horizontal',
                offsetY: 0
              }
            })
            
            // Add volume label between start and end
            const midTime = (downtrendStart.time + trendData[endIndex].x) / 2
            const midLevel = (downtrendStart.level + currentLevel) / 2
            
            volumeLabels.push({
              x: midTime,
              y: midLevel,
              marker: {
                size: 0
              },
              label: {
                borderColor: '#ef4444',
                borderWidth: 0,
                style: {
                  color: '#ef4444',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  padding: {
                    left: 8,
                    right: 8,
                    top: 4,
                    bottom: 4
                  }
                },
                text: `${volumeChange.toFixed(0)} m³`
              }
            })
          }
        }
        
        // Reset state
        consecutiveDownPoints = 0
        downtrendStart = null
        downtrendPeak = null
      }
    }
    
    console.log('\n[AT-02] ========== DETECTION SUMMARY ==========')
    console.log('[AT-02] Total annotations:', annotations.length)
    console.log('[AT-02] Total downtrends:', annotations.length / 2)
    console.log('[AT-02] =========================================\n')
    
    // Update chart with both series and annotations
    if (at02LevelChart) {
      at02LevelChart.updateSeries([{
        name: 'AT-02 Level',
        data: levelData
      }, {
        name: 'Moving Average (60min)',
        data: trendData
      }])
      
      // Update annotations
      at02LevelChart.updateOptions({
        annotations: {
          xaxis: annotations,
          points: volumeLabels
        }
      })
      
      console.log('[loadAT02LevelData] Found', annotations.length / 2, 'outflow periods (', annotations.length, 'annotations)')
      console.log('[loadAT02LevelData] Chart updated with', volumeLabels.length, 'volume labels')
    }
    
  } catch (error) {
    console.error('[Dashboard] Error loading AT-02 level data:', error)
  }
}

function initializeAT02InletChart() {
  console.log('[Dashboard] Initializing AT-02 Inlet Chart...')
  
  const chartEl = document.getElementById('chart-at02-inlet')
  if (!chartEl) {
    console.error('[Dashboard] AT-02 Inlet chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1
  
  const options = {
    series: [{
      name: currentYear.toString(),
      data: new Array(12).fill(0)
    }, {
      name: lastYear.toString(),
      data: new Array(12).fill(0)
    }],
    chart: {
      type: 'line',
      height: 400,
      toolbar: { 
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      width: [3, 2],
      curve: 'smooth',
      dashArray: [0, 5]
    },
    colors: ['#3b82f6', '#9ca3af'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDark ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        opacityFrom: 0.4,
        opacityTo: 0.1
      }
    },
    markers: {
      size: [4, 4],
      strokeWidth: 2,
      hover: {
        size: 6
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      title: {
        text: 'Month',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Total Outlet Volume (m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' m³' : '0 m³'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: function(val) {
          return val ? val.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' m³' : '0 m³'
        }
      }
    },
    title: {
      text: 'AT-02 Outlet Volume - 12 Month Comparison',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#94a3b8' : '#64748b'
      }
    }
  }
  
  at02InletChart = new ApexCharts(chartEl, options)
  at02InletChart.render()
  console.log('[Dashboard] AT-02 Inlet Chart initialized')
}

// Load AT-02 Inlet Volume Data
async function loadAT02InletData() {
  console.log('[Dashboard] Loading AT-02 Inlet data...')
  
  try {
    const response = await fetch(`${API_BASE_URL}/wwt01/at02-inlet-monthly`)
    if (!response.ok) throw new Error('Failed to fetch AT-02 inlet data')
    
    const result = await response.json()
    console.log('[Dashboard] AT-02 Inlet data loaded:', result)
    
    if (result.success && result.data) {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() // 0-11
      
      // Update chart
      if (at02InletChart) {
        at02InletChart.updateSeries([
          {
            name: currentYear.toString(),
            data: result.data.currentYear || new Array(12).fill(0)
          },
          {
            name: (currentYear - 1).toString(),
            data: result.data.previousYear || new Array(12).fill(0)
          }
        ])
      }
      
      // Update totals
      const currentMonthTotal = result.data.currentYear?.[currentMonth] || 0
      const lastYearTotal = result.data.previousYear?.[currentMonth] || 0
      
      const currentEl = document.getElementById('at02-current-month-total')
      const lastYearEl = document.getElementById('at02-last-year-total')
      
      if (currentEl) {
        currentEl.textContent = currentMonthTotal.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' m³'
      }
      if (lastYearEl) {
        lastYearEl.textContent = lastYearTotal.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' m³'
      }
      
      console.log('[Dashboard] AT-02 Inlet chart updated')
    }
  } catch (error) {
    console.error('[Dashboard] Error loading AT-02 inlet data:', error)
  }
}

// Initialize AT-02 Hourly Accumulation Chart
function initializeAT02HourlyChart() {
  console.log('[Dashboard] Initializing AT-02 Hourly Chart...')
  
  const chartEl = document.getElementById('chart-at02-hourly')
  if (!chartEl) {
    console.error('[Dashboard] AT-02 Hourly chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  
  // Create 24-hour categories starting from 6 AM
  const hourCategories = []
  for (let i = 0; i < 24; i++) {
    const hour = (6 + i) % 24
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    hourCategories.push(hourKey)
  }
  
  const options = {
    series: [{
      name: 'AT-02 Outlet Volume',
      data: new Array(24).fill(0)
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        },
        colors: {
          ranges: [{
            from: 0,
            to: 999999,
            color: '#10b981'
          }]
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: [isDark ? '#94a3b8' : '#64748b']
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: hourCategories,
      title: {
        text: 'Hour of Day (6 AM - 6 AM next day)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a'
        }
      },
      labels: {
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Outlet Volume (m³)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a'
        }
      },
      min: 0,
      forceNiceScale: true,
      labels: {
        formatter: function(val) {
          return val ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: function(val) {
          return val ? val.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' m³' : '0 m³'
        }
      }
    },
    title: {
      text: 'AT-02 Outlet Volume - Hourly Accumulation (Level Decreases × 3500)',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    }
  }
  
  at02HourlyChart = new ApexCharts(chartEl, options)
  at02HourlyChart.render()
  console.log('[Dashboard] AT-02 Hourly Chart initialized')
}

// Initialize AT-02 ORP Sensors Chart
function initializeAT02ORPChart() {
  console.log('[Dashboard] Initializing AT-02 ORP Chart...')
  
  const chartEl = document.getElementById('chart-at02-orp-sensors')
  if (!chartEl) {
    console.error('[Dashboard] AT-02 ORP chart container not found')
    return
  }
  
  const isDark = document.documentElement.classList.contains('dark')
  
  const options = {
    series: [{
      name: 'ORP-03',
      data: []
    }, {
      name: 'ORP-04',
      data: []
    }],
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    colors: ['#10b981', '#f59e0b'],
    markers: {
      size: 0,
      hover: {
        size: 6
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    yaxis: {
      title: {
        text: 'ORP (mV)',
        style: {
          color: isDark ? '#cbd5e1' : '#0f172a',
          fontSize: '12px'
        }
      },
      labels: {
        formatter: function(val) {
          return val ? val.toFixed(0) : '0'
        },
        style: {
          colors: isDark ? '#94a3b8' : '#64748b'
        }
      }
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      shared: true,
      intersect: false,
      x: {
        format: 'dd MMM HH:mm'
      },
      y: {
        formatter: function(val) {
          return val ? val.toFixed(0) + ' mV' : '0 mV'
        }
      }
    },
    title: {
      text: 'AT-02 ORP Sensors (ORP-03, ORP-04)',
      align: 'left',
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: isDark ? '#cbd5e1' : '#0f172a'
      }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: isDark ? '#94a3b8' : '#64748b'
      }
    }
  }
  
  at02ORPChart = new ApexCharts(chartEl, options)
  at02ORPChart.render()
  console.log('[Dashboard] AT-02 ORP Chart initialized')
}

// Load AT-02 Hourly Accumulation Data
async function loadAT02HourlyData(selectedDate = null) {
  console.log('[Dashboard] Loading AT-02 Hourly data...', selectedDate ? 'for date: ' + selectedDate : '')
  
  try {
    let startDate, endDate
    
    if (selectedDate) {
      // Use local date (no timezone conversion needed - Date constructor uses local time)
      const localDate = new Date(selectedDate + 'T00:00:00')
      const startTime = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 6, 0, 0)
      const endTime = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate() + 1, 6, 0, 0)
      
      // Convert local time to UTC for API query
      startDate = new Date(startTime.getTime() - (7 * 60 * 60 * 1000)).toISOString()
      endDate = new Date(endTime.getTime() - (7 * 60 * 60 * 1000)).toISOString()
      
      console.log('[loadAT02HourlyData] Loading from', startTime.toLocaleString(), 'to', endTime.toLocaleString())
      console.log('[loadAT02HourlyData] UTC Query:', startDate, 'to', endDate)
    } else {
      // Get current time in Thailand
      const now = new Date()
      const thailandTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)) // UTC + 7
      const startTime = new Date(thailandTime.getFullYear(), thailandTime.getMonth(), thailandTime.getDate(), 6, 0, 0)
      const endTime = new Date(thailandTime.getFullYear(), thailandTime.getMonth(), thailandTime.getDate() + 1, 6, 0, 0)
      
      // Convert to UTC
      startDate = new Date(startTime.getTime() - (7 * 60 * 60 * 1000)).toISOString()
      endDate = new Date(endTime.getTime() - (7 * 60 * 60 * 1000)).toISOString()
      
      console.log('[loadAT02HourlyData] Loading today from', startTime.toLocaleString(), 'to', endTime.toLocaleString())
      console.log('[loadAT02HourlyData] UTC Query:', startDate, 'to', endDate)
    }
    
    const response = await fetch(`${API_BASE_URL}/wwt01/at02-inlet-hourly?startDate=${startDate}&endDate=${endDate}`)
    if (!response.ok) throw new Error('Failed to fetch AT-02 hourly data')
    
    const rows = await response.json()
    console.log('[loadAT02HourlyData] Loaded', rows.length, 'hours from API')
    console.log('[loadAT02HourlyData] Raw data:', rows)
    
    // Prepare chart data - Start from 6 AM
    const allHours = []
    const displayLabels = []
    const hourlyVolumes = {}
    
    // Group data by hour and store details
    rows.forEach(row => {
      const date = new Date(row.hour)
      // Convert UTC to Thailand time (UTC+7)
      const thailandHour = (date.getUTCHours() + 7) % 24
      const hourKey = thailandHour.toString().padStart(2, '0')
      hourlyVolumes[hourKey] = parseFloat(row.volume_outlet) || 0
    })
    
    let datePrefix = ''
    if (selectedDate) {
      try {
        datePrefix = new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) + ' '
      } catch (e) {
        console.error('[loadAT02HourlyData] Error formatting date prefix:', e)
      }
    }
    
    // Create 24-hour array starting from 6 AM
    for (let i = 0; i < 24; i++) {
      const hour = (6 + i) % 24
      const hourKey = hour.toString().padStart(2, '0')
      allHours.push(hourKey)
      
      // Add date prefix to first hour (06:00) or when crossing midnight
      if (i === 0 || hour === 0) {
        displayLabels.push(datePrefix + hourKey + ':00')
      } else {
        displayLabels.push(hourKey + ':00')
      }
    }
    
    // Map volumes to hours
    const volumeValues = allHours.map(hourKey => hourlyVolumes[hourKey] || 0)
    
    console.log('[loadAT02HourlyData] Volume values:', volumeValues)
    
    // Update chart
    if (at02HourlyChart) {
      at02HourlyChart.updateOptions({
        xaxis: {
          categories: displayLabels
        }
      })
      
      at02HourlyChart.updateSeries([{
        name: 'AT-02 Outlet Volume',
        data: volumeValues
      }])
      
      console.log('[loadAT02HourlyData] Chart updated with', volumeValues.length, 'values')
    } else {
      console.error('[loadAT02HourlyData] Chart not initialized')
    }
    
  } catch (error) {
    console.error('[Dashboard] Error loading AT-02 hourly data:', error)
  }
}

// Load and Update Flow Daily Data (Monthly View)
async function loadFlowDailyData(selectedMonth = null) {
  console.log('[Dashboard] Loading Flow Daily data...', selectedMonth ? 'for month: ' + selectedMonth : '')
  
  try {
    let startDate, endDate
    
    if (selectedMonth) {
      // Parse YYYY-MM format
      const [year, month] = selectedMonth.split('-').map(Number)
      
      // Start from first day of month at 6 AM
      const firstDay = new Date(year, month - 1, 1, 6, 0, 0)
      
      // End at first day of next month at 6 AM
      const lastDay = new Date(year, month, 1, 6, 0, 0)
      
      startDate = firstDay.toISOString()
      endDate = lastDay.toISOString()
      
      console.log('[loadFlowDailyData] Loading from', firstDay.toLocaleString(), 'to', lastDay.toLocaleString())
    } else {
      // Load current month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      
      const firstDay = new Date(year, month, 1, 6, 0, 0)
      const lastDay = new Date(year, month + 1, 1, 6, 0, 0)
      
      startDate = firstDay.toISOString()
      endDate = lastDay.toISOString()
      
      console.log('[loadFlowDailyData] Loading current month from', firstDay.toLocaleString(), 'to', lastDay.toLocaleString())
    }
    
    const response = await fetch(`${API_BASE_URL}/wwt01/data-range?startDate=${startDate}&endDate=${endDate}`)
    if (!response.ok) throw new Error('Failed to fetch data')
    
    const rows = await response.json()
    console.log('[loadFlowDailyData] Loaded', rows.length, 'rows from API')
    
    // Determine month range
    let year, month
    if (selectedMonth) {
      [year, month] = selectedMonth.split('-').map(Number)
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }
    
    // Get number of days in the selected month
    const daysInMonth = new Date(year, month, 0).getDate()
    
    // Initialize all days in month
    const dailyData = {}
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dailyData[dayKey] = {
        flow: { min: Infinity, max: -Infinity },
        orp01: { sum: 0, count: 0 },
        orp02: { sum: 0, count: 0 },
        energy: { sum: 0, count: 0 }
      }
    }
    
    if (rows.length === 0) {
      console.log('[loadFlowDailyData] No flow data available - showing empty month')
    } else {
      // Group data by day (6am to 6am)
      rows.forEach((row, index) => {
        try {
          const timestamp = new Date(row.time)
          
          // Adjust to 6am-based day
          let dayTimestamp = new Date(timestamp)
          if (timestamp.getHours() < 6) {
            // Before 6am, belongs to previous day
            dayTimestamp.setDate(dayTimestamp.getDate() - 1)
          }
          
          // Create day key (YYYY-MM-DD) for the 6am start
          const dayKey = `${dayTimestamp.getFullYear()}-${String(dayTimestamp.getMonth() + 1).padStart(2, '0')}-${String(dayTimestamp.getDate()).padStart(2, '0')}`
          
          // Only process if day is within our month
          if (!dailyData[dayKey]) {
            return
          }
          
          // Track flow min/max
          const flow = parseFloat(row.flow_meter_no1_forward) || 0
          if (flow > 0) {
            dailyData[dayKey].flow.min = Math.min(dailyData[dayKey].flow.min, flow)
            dailyData[dayKey].flow.max = Math.max(dailyData[dayKey].flow.max, flow)
          }
          
          // Sum ORP for averaging
          const orp01 = parseFloat(row.orp_sensor_01) || 0
          const orp02 = parseFloat(row.orp_sensor_02) || 0
          if (orp01 !== 0) {
            dailyData[dayKey].orp01.sum += orp01
            dailyData[dayKey].orp01.count++
          }
          if (orp02 !== 0) {
            dailyData[dayKey].orp02.sum += orp02
            dailyData[dayKey].orp02.count++
          }
          
          // Sum Energy for averaging
          const energy = parseFloat(row.energy_meter_mdb1) || 0
          if (energy > 0 && flow > 0) {
            const energyPerFlow = energy / flow
            dailyData[dayKey].energy.sum += energyPerFlow
            dailyData[dayKey].energy.count++
          }
          
        } catch (rowError) {
          console.error('[loadFlowDailyData] Error processing row', index, ':', rowError)
        }
      })
    }
    
    console.log('[loadFlowDailyData] Daily data keys:', Object.keys(dailyData))
    
    // Sort days and create arrays for chart
    const allDays = Object.keys(dailyData).sort()
    console.log('[loadFlowDailyData] Days:', allDays)
    
    const categories = []
    const flowValues = []
    const orpSensor01Values = []
    const orpSensor02Values = []
    const orpAvgValues = []
    const energyPerFlowValues = []
    
    allDays.forEach(dayKey => {
      const data = dailyData[dayKey]
      
      // Format day label (DD/MM)
      const [year, month, day] = dayKey.split('-')
      const dayLabel = `${day}/${month}`
      categories.push(dayLabel)
      
      // Calculate flow accumulation (max - min)
      const flowAccum = data.flow.max !== -Infinity && data.flow.min !== Infinity
        ? data.flow.max - data.flow.min
        : 0
      
      // Filter out abnormal daily flow differences (likely meter resets/malfunctions)
      // Normal daily flow should not exceed 50,000 liters per day
      if (flowAccum > 50000) {
        console.warn(`[Daily Flow] ${dayKey}: Abnormal flow difference detected: ${flowAccum}, setting to 0`)
        flowValues.push(0)
      } else {
        flowValues.push(flowAccum)
      }
      
      // Calculate average ORP
      const avgOrp01 = data.orp01.count > 0 ? data.orp01.sum / data.orp01.count : 0
      const avgOrp02 = data.orp02.count > 0 ? data.orp02.sum / data.orp02.count : 0
      orpSensor01Values.push(avgOrp01)
      orpSensor02Values.push(avgOrp02)
      
      // Calculate ORP Average (ORP-Avg)
      const orpAvg = (avgOrp01 > 0 && avgOrp02 > 0) ? (avgOrp01 + avgOrp02) / 2 
                   : (avgOrp01 > 0) ? avgOrp01
                   : (avgOrp02 > 0) ? avgOrp02
                   : 0
      orpAvgValues.push(orpAvg)
      
      // Calculate average energy/flow
      const avgEnergyPerFlow = data.energy.count > 0 ? data.energy.sum / data.energy.count : 0
      energyPerFlowValues.push(avgEnergyPerFlow)
    })
    
    console.log('[loadFlowDailyData] Categories:', categories)
    console.log('[loadFlowDailyData] Flow values:', flowValues)
    
    // Update or recreate chart
    const chartEl = document.getElementById('chart-flow-daily')
    if (chartEl && flowDailyChart) {
      flowDailyChart.destroy()
      
      const isDark = document.documentElement.classList.contains('dark')
      
      const options = {
        series: [{
          name: 'Flow Accumulation',
          type: 'bar',
          data: flowValues
        }, {
          name: 'ORP-In',
          type: 'line',
          data: orpSensor01Values
        }, {
          name: 'ORP-Out',
          type: 'line',
          data: orpSensor02Values
        }, {
          name: 'ORP-Avg',
          type: 'line',
          data: orpAvgValues
        }, {
          name: 'Energy/Flow (kWh/m³)',
          type: 'bar',
          data: energyPerFlowValues
        }],
        chart: {
          type: 'bar',
          height: 400,
          toolbar: { 
            show: true,
            tools: {
              download: true,
              zoom: true,
              pan: true
            }
          },
          foreColor: isDark ? '#94a3b8' : '#64748b',
          background: isDark ? '#1e293b' : '#ffffff'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '70%',
            dataLabels: {
              position: 'top'
            }
          }
        },
        dataLabels: {
          enabled: true,
          enabledOnSeries: [0, 1, 2, 3, 4],
          formatter: function (val) {
            return val ? val.toFixed(2) : '0.00'
          },
          offsetY: -20,
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
            colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#f59e0b']
          },
          background: {
            enabled: true,
            foreColor: '#ffffff',
            borderRadius: 3,
            padding: 4,
            opacity: 0.95,
            borderWidth: 0
          }
        },
        stroke: {
          show: true,
          width: [0, 3, 3, 3, 0],
          colors: ['transparent', '#f59e0b', '#10b981', '#ef4444', 'transparent'],
          curve: 'smooth'
        },
        xaxis: {
          categories: categories,
          title: {
            text: 'Day (6am-6am)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            style: {
              colors: isDark ? '#94a3b8' : '#64748b',
              fontSize: '10px'
            },
            rotate: -45
          }
        },
        yaxis: [{
          seriesName: 'Flow Accumulation',
          title: {
            text: 'Flow Accumulation (m³)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(0) : '0'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }, {
          seriesName: ['ORP-In', 'ORP-Out', 'ORP-Avg'],
          opposite: true,
          title: {
            text: 'ORP (mV)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(0) : '0'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }, {
          seriesName: 'Energy/Flow (kWh/m³)',
          opposite: true,
          min: 0,
          max: function(max) {
            return max > 0 ? max * 1.2 : 1
          },
          title: {
            text: 'Energy/Flow (kWh/m³)',
            style: {
              color: isDark ? '#cbd5e1' : '#0f172a',
              fontSize: '12px'
            }
          },
          labels: {
            formatter: function(val) {
              return val ? val.toFixed(3) : '0.000'
            },
            style: {
              colors: isDark ? '#94a3b8' : '#64748b'
            }
          }
        }],
        fill: {
          opacity: [1, 0.9, 0.9, 0.9, 0.9],
          colors: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#f59e0b']
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
          shared: true,
          intersect: false,
          y: [
            {
              formatter: function (val) {
                return val ? val.toFixed(2) + ' m³' : '0 m³'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(1) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(1) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(1) + ' mV' : '0 mV'
              }
            },
            {
              formatter: function (val) {
                return val ? val.toFixed(3) + ' kWh/m³' : '0 kWh/m³'
              }
            }
          ]
        },
        title: {
          text: 'Daily Flow, ORP & Energy Efficiency (6am-6am)',
          align: 'left',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            color: isDark ? '#cbd5e1' : '#0f172a'
          }
        },
        grid: {
          borderColor: isDark ? '#334155' : '#e2e8f0'
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          labels: {
            colors: isDark ? '#94a3b8' : '#64748b'
          }
        }
      }
      
      flowDailyChart = new ApexCharts(chartEl, options)
      flowDailyChart.render()
      
      console.log('[loadFlowDailyData] Chart recreated with', allDays.length, 'days')
    } else {
      console.error('[loadFlowDailyData] Chart element not found!')
    }
    
  } catch (error) {
    console.error('[loadFlowDailyData] Error loading data:', error)
  }
}

// Load Historical Data from Database (Dashboard)
async function loadDashboardHistoricalData() {
  console.log('[Dashboard] Loading historical data...')
  const statusEl = document.getElementById('dashboard-status')
  const timeRange = document.getElementById('dashboard-time-range')?.value || 30
  
  if (statusEl) statusEl.textContent = 'Loading historical data...'
  
  try {
    const apiUrl = `${API_BASE_URL}/wwt01/history?minutes=${timeRange}&limit=1000`
    console.log('[Dashboard] Fetching from:', apiUrl)
    const response = await fetch(apiUrl)
    const data = await response.json()
    console.log('[Dashboard] Received data:', data.length, 'records')
    
    if (data.length === 0) {
      if (statusEl) statusEl.textContent = 'No historical data available'
      return
    }
    
    // Clear existing data
    clearAllChartData()
    
    // Process historical data in reverse order (oldest to newest)
    data.reverse().forEach(row => {
      const timestamp = new Date(row.time).getTime()
      
      // AT-1 Data
      if (row.ph_sensor_01 !== null) {
        lohandData.at1.ph.ph01.push({ x: timestamp, y: row.ph_sensor_01 })
        lohandData.at1.ph.ph02.push({ x: timestamp, y: row.ph_sensor_02 })
        lohandData.at1.orp.orp01.push({ x: timestamp, y: row.orp_sensor_01 || 0 })
        lohandData.at1.orp.orp02.push({ x: timestamp, y: row.orp_sensor_02 || 0 })
        lohandData.at1.temp.temp01.push({ x: timestamp, y: row.temp_01 })
        lohandData.at1.temp.temp02.push({ x: timestamp, y: row.temp_02 })
      }
      
      // AT-2 Data
      if (row.ph_sensor_03 !== null) {
        lohandData.at2.ph.ph03.push({ x: timestamp, y: row.ph_sensor_03 })
        lohandData.at2.ph.ph04.push({ x: timestamp, y: row.ph_sensor_04 })
        lohandData.at2.orp.orp03.push({ x: timestamp, y: row.orp_sensor_03 || 0 })
        lohandData.at2.orp.orp04.push({ x: timestamp, y: row.orp_sensor_04 || 0 })
        lohandData.at2.temp.temp03.push({ x: timestamp, y: row.temp_03 })
        lohandData.at2.temp.temp04.push({ x: timestamp, y: row.temp_04 })
      }
      
      // AT-3 Data
      if (row.ph_sensor_05 !== null) {
        lohandData.at3.ph.ph05.push({ x: timestamp, y: row.ph_sensor_05 })
        lohandData.at3.ph.ph06.push({ x: timestamp, y: row.ph_sensor_06 })
        lohandData.at3.orp.orp05.push({ x: timestamp, y: row.orp_sensor_05 || 0 })
        lohandData.at3.orp.orp06.push({ x: timestamp, y: row.orp_sensor_06 || 0 })
        lohandData.at3.temp.temp05.push({ x: timestamp, y: row.temp_05 })
        lohandData.at3.temp.temp06.push({ x: timestamp, y: row.temp_06 })
      }
    })
    
    // Keep only last MAX_CHART_POINTS for each series
    trimChartData()
    
    // Update all charts
    updateAllCharts()
    
    if (statusEl) statusEl.textContent = `Loaded ${data.length} records | Live updating...`
    hasReceivedData = true
    
  } catch (error) {
    console.error('Error loading historical data:', error)
    if (statusEl) statusEl.textContent = 'Error loading data'
  }
}

// Clear all chart data
function clearAllChartData() {
  // AT-1
  lohandData.at1.ph.ph01 = []
  lohandData.at1.ph.ph02 = []
  lohandData.at1.orp.orp01 = []
  lohandData.at1.orp.orp02 = []
  lohandData.at1.temp.temp01 = []
  lohandData.at1.temp.temp02 = []
  
  // AT-2
  lohandData.at2.ph.ph03 = []
  lohandData.at2.ph.ph04 = []
  lohandData.at2.orp.orp03 = []
  lohandData.at2.orp.orp04 = []
  lohandData.at2.temp.temp03 = []
  lohandData.at2.temp.temp04 = []
  
  // AT-3
  lohandData.at3.ph.ph05 = []
  lohandData.at3.ph.ph06 = []
  lohandData.at3.orp.orp05 = []
  lohandData.at3.orp.orp06 = []
  lohandData.at3.temp.temp05 = []
  lohandData.at3.temp.temp06 = []
}

// Trim chart data to MAX_CHART_POINTS
function trimChartData() {
  const trimArray = (arr) => {
    if (arr.length > MAX_CHART_POINTS) {
      return arr.slice(-MAX_CHART_POINTS)
    }
    return arr
  }
  
  // AT-1
  lohandData.at1.ph.ph01 = trimArray(lohandData.at1.ph.ph01)
  lohandData.at1.ph.ph02 = trimArray(lohandData.at1.ph.ph02)
  lohandData.at1.orp.orp01 = trimArray(lohandData.at1.orp.orp01)
  lohandData.at1.orp.orp02 = trimArray(lohandData.at1.orp.orp02)
  lohandData.at1.temp.temp01 = trimArray(lohandData.at1.temp.temp01)
  lohandData.at1.temp.temp02 = trimArray(lohandData.at1.temp.temp02)
  
  // AT-2
  lohandData.at2.ph.ph03 = trimArray(lohandData.at2.ph.ph03)
  lohandData.at2.ph.ph04 = trimArray(lohandData.at2.ph.ph04)
  lohandData.at2.orp.orp03 = trimArray(lohandData.at2.orp.orp03)
  lohandData.at2.orp.orp04 = trimArray(lohandData.at2.orp.orp04)
  lohandData.at2.temp.temp03 = trimArray(lohandData.at2.temp.temp03)
  lohandData.at2.temp.temp04 = trimArray(lohandData.at2.temp.temp04)
  
  // AT-3
  lohandData.at3.ph.ph05 = trimArray(lohandData.at3.ph.ph05)
  lohandData.at3.ph.ph06 = trimArray(lohandData.at3.ph.ph06)
  lohandData.at3.orp.orp05 = trimArray(lohandData.at3.orp.orp05)
  lohandData.at3.orp.orp06 = trimArray(lohandData.at3.orp.orp06)
  lohandData.at3.temp.temp05 = trimArray(lohandData.at3.temp.temp05)
  lohandData.at3.temp.temp06 = trimArray(lohandData.at3.temp.temp06)
}

// Update all charts with current data
function updateAllCharts() {
  // AT-1
  if (lohandCharts.at1.ph) {
    lohandCharts.at1.ph.updateSeries([
      { data: lohandData.at1.ph.ph01 },
      { data: lohandData.at1.ph.ph02 }
    ])
  }
  if (lohandCharts.at1.orp) {
    lohandCharts.at1.orp.updateSeries([
      { data: lohandData.at1.orp.orp01 },
      { data: lohandData.at1.orp.orp02 }
    ])
  }
  if (lohandCharts.at1.temp) {
    lohandCharts.at1.temp.updateSeries([
      { data: lohandData.at1.temp.temp01 },
      { data: lohandData.at1.temp.temp02 }
    ])
  }
  
  // AT-2
  if (lohandCharts.at2.ph) {
    lohandCharts.at2.ph.updateSeries([
      { data: lohandData.at2.ph.ph03 },
      { data: lohandData.at2.ph.ph04 }
    ])
  }
  if (lohandCharts.at2.orp) {
    lohandCharts.at2.orp.updateSeries([
      { data: lohandData.at2.orp.orp03 },
      { data: lohandData.at2.orp.orp04 }
    ])
  }
  
  // Update AT-02 ORP Chart (separate chart for AT-02 section)
  if (at02ORPChart) {
    at02ORPChart.updateSeries([
      { name: 'ORP-03', data: lohandData.at2.orp.orp03 },
      { name: 'ORP-04', data: lohandData.at2.orp.orp04 }
    ])
  }
  
  if (lohandCharts.at2.temp) {
    lohandCharts.at2.temp.updateSeries([
      { data: lohandData.at2.temp.temp03 },
      { data: lohandData.at2.temp.temp04 }
    ])
  }
  
  // AT-3
  if (lohandCharts.at3.ph) {
    lohandCharts.at3.ph.updateSeries([
      { data: lohandData.at3.ph.ph05 },
      { data: lohandData.at3.ph.ph06 }
    ])
  }
  if (lohandCharts.at3.orp) {
    lohandCharts.at3.orp.updateSeries([
      { data: lohandData.at3.orp.orp05 },
      { data: lohandData.at3.orp.orp06 }
    ])
  }
  if (lohandCharts.at3.temp) {
    lohandCharts.at3.temp.updateSeries([
      { data: lohandData.at3.temp.temp05 },
      { data: lohandData.at3.temp.temp06 }
    ])
  }
}

// Update Lohand Charts with new real-time data
function updateLohandCharts(data) {
  const timestamp = new Date().getTime() + (7 * 60 * 60 * 1000)
  
  // AT-1 Data
  if (data.PH_Sensor_01 !== undefined && data.PH_Sensor_01 !== null) {
    lohandData.at1.ph.ph01.push({ x: timestamp, y: data.PH_Sensor_01 })
    lohandData.at1.ph.ph02.push({ x: timestamp, y: data.PH_Sensor_02 })
    lohandData.at1.orp.orp01.push({ x: timestamp, y: data.ORP_Sensor_01 || 0 })
    lohandData.at1.orp.orp02.push({ x: timestamp, y: data.ORP_Sensor_02 || 0 })
    lohandData.at1.temp.temp01.push({ x: timestamp, y: data.Temp_01 })
    lohandData.at1.temp.temp02.push({ x: timestamp, y: data.Temp_02 })
  }

  // AT-2 Data
  if (data.PH_Sensor_03 !== undefined && data.PH_Sensor_03 !== null) {
    lohandData.at2.ph.ph03.push({ x: timestamp, y: data.PH_Sensor_03 })
    lohandData.at2.ph.ph04.push({ x: timestamp, y: data.PH_Sensor_04 })
    lohandData.at2.orp.orp03.push({ x: timestamp, y: data.ORP_Sensor_03 || 0 })
    lohandData.at2.orp.orp04.push({ x: timestamp, y: data.ORP_Sensor_04 || 0 })
    lohandData.at2.temp.temp03.push({ x: timestamp, y: data.Temp_03 })
    lohandData.at2.temp.temp04.push({ x: timestamp, y: data.Temp_04 })
  }

  // AT-3 Data
  if (data.PH_Sensor_05 !== undefined && data.PH_Sensor_05 !== null) {
    lohandData.at3.ph.ph05.push({ x: timestamp, y: data.PH_Sensor_05 })
    lohandData.at3.ph.ph06.push({ x: timestamp, y: data.PH_Sensor_06 })
    lohandData.at3.orp.orp05.push({ x: timestamp, y: data.ORP_Sensor_05 || 0 })
    lohandData.at3.orp.orp06.push({ x: timestamp, y: data.ORP_Sensor_06 || 0 })
    lohandData.at3.temp.temp05.push({ x: timestamp, y: data.Temp_05 })
    lohandData.at3.temp.temp06.push({ x: timestamp, y: data.Temp_06 })
  }
  
  // Trim old data
  trimChartData()
  
  // Update charts
  updateAllCharts()
  
  // Update status
  const statusEl = document.getElementById('dashboard-status')
  if (statusEl && hasReceivedData) {
    statusEl.textContent = `Live | Last update: ${new Date().toLocaleTimeString()}`
  }
}

// Store level data for real-time updates
let at02RealtimeLevelData = []

// Update AT-02 Level Chart with real-time MQTT data
function updateAT02LevelChartRealtime(data) {
  if (!at02LevelChart) return
  
  // Check if at_02_level exists in data
  if (data.at_02_level !== null && data.at_02_level !== undefined) {
    const timestamp = new Date().getTime()
    const levelValue = parseFloat(data.at_02_level)
    
    // Add new data point
    at02RealtimeLevelData.push({
      x: timestamp,
      y: levelValue
    })
    
    // Keep only last 2000 points (approximately 2-3 hours)
    if (at02RealtimeLevelData.length > 2000) {
      at02RealtimeLevelData.shift()
    }
    
    // Update chart
    at02LevelChart.updateSeries([{
      name: 'AT-02 Level',
      data: at02RealtimeLevelData
    }], false, true)
    
    console.log('[AT-02 Level] Updated:', levelValue.toFixed(3), 'm at', new Date(timestamp).toLocaleTimeString())
  }
}

// Store realtime flow and energy data for hourly accumulation
let realtimeFlowEnergyData = {
  lastFlowValue: null,
  lastEnergyValue: null,
  lastUpdateHour: null,
  hourlyAccumulation: {}, // { '06:00': { flow: 100, orp01: 150, orp02: 160, energy: 50 }, ... }
  isRealtimeMode: false // DISABLED: Flag to control realtime updates
}

// Update Flow and Energy charts with realtime MQTT data
function updateFlowEnergyChartsRealtime(data) {
  // Skip realtime updates if not in realtime mode (user selected a specific date)
  if (!realtimeFlowEnergyData.isRealtimeMode) {
    console.log('[Dashboard] Skipping realtime update - date picker mode active')
    return
  }
  
  if (!flowHourlyChart) return
  
  const now = new Date()
  const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`
  
  // Initialize hour data if not exists
  if (!realtimeFlowEnergyData.hourlyAccumulation[currentHour]) {
    realtimeFlowEnergyData.hourlyAccumulation[currentHour] = {
      flowDiff: 0,
      orp01Sum: 0,
      orp01Count: 0,
      orp02Sum: 0,
      orp02Count: 0,
      energyDiff: 0,
      energyPerFlow: null
    }
  }
  
  const hourData = realtimeFlowEnergyData.hourlyAccumulation[currentHour]
  
  // Calculate flow accumulation difference for current hour
  if (data.Flow_Meter_No1_Forward !== null && data.Flow_Meter_No1_Forward !== undefined) {
    if (realtimeFlowEnergyData.lastFlowValue !== null && realtimeFlowEnergyData.lastUpdateHour === currentHour) {
      const flowDiff = data.Flow_Meter_No1_Forward - realtimeFlowEnergyData.lastFlowValue
      if (flowDiff > 0) {
        hourData.flowDiff += flowDiff
      }
    }
    realtimeFlowEnergyData.lastFlowValue = data.Flow_Meter_No1_Forward
    realtimeFlowEnergyData.lastUpdateHour = currentHour
  }
  
  // Update ORP averages
  if (data.ORP_Sensor_01 !== null && data.ORP_Sensor_01 !== undefined) {
    hourData.orp01Sum += data.ORP_Sensor_01
    hourData.orp01Count++
  }
  
  if (data.ORP_Sensor_02 !== null && data.ORP_Sensor_02 !== undefined) {
    hourData.orp02Sum += data.ORP_Sensor_02
    hourData.orp02Count++
  }
  
  // Calculate energy accumulation difference for current hour
  if (data.Power_MDB_01_Energy !== null && data.Power_MDB_01_Energy !== undefined) {
    if (realtimeFlowEnergyData.lastEnergyValue !== null && realtimeFlowEnergyData.lastUpdateHour === currentHour) {
      const energyDiff = data.Power_MDB_01_Energy - realtimeFlowEnergyData.lastEnergyValue
      if (energyDiff > 0) {
        hourData.energyDiff += energyDiff
      }
    }
    realtimeFlowEnergyData.lastEnergyValue = data.Power_MDB_01_Energy
  }
  
  // Calculate Energy per Flow
  if (hourData.flowDiff > 0) {
    hourData.energyPerFlow = hourData.energyDiff / hourData.flowDiff
  }
  
  // Prepare chart data - Start from 6 AM
  const allHours = []
  for (let i = 0; i < 24; i++) {
    const hour = (6 + i) % 24
    allHours.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  
  // Map accumulated data to chart
  const flowValues = allHours.map(hour => realtimeFlowEnergyData.hourlyAccumulation[hour]?.flowDiff || 0)
  const orp01Values = allHours.map(hour => {
    const h = realtimeFlowEnergyData.hourlyAccumulation[hour]
    return (h && h.orp01Count > 0) ? (h.orp01Sum / h.orp01Count) : null
  })
  const orp02Values = allHours.map(hour => {
    const h = realtimeFlowEnergyData.hourlyAccumulation[hour]
    return (h && h.orp02Count > 0) ? (h.orp02Sum / h.orp02Count) : null
  })
  const energyPerFlowValues = allHours.map(hour => realtimeFlowEnergyData.hourlyAccumulation[hour]?.energyPerFlow || null)
  
  // Update chart only if it exists and is rendered
  if (flowHourlyChart && flowHourlyChart.w) {
    // Calculate ORP Average for realtime
    const orpAvgValues = allHours.map((hour, index) => {
      const orp01 = orp01Values[index]
      const orp02 = orp02Values[index]
      if (orp01 && orp02) {
        return (orp01 + orp02) / 2
      } else if (orp01) {
        return orp01
      } else if (orp02) {
        return orp02
      }
      return null
    })

    flowHourlyChart.updateSeries([{
      name: 'Flow Accumulation',
      type: 'bar',
      data: flowValues
    }, {
      name: 'ORP-In',
      type: 'line',
      data: orp01Values
    }, {
      name: 'ORP-Out',
      type: 'line',
      data: orp02Values
    }, {
      name: 'ORP-Avg',
      type: 'line',
      data: orpAvgValues
    }, {
      name: 'Energy/Flow (kWh/m³)',
      type: 'line',
      data: energyPerFlowValues
    }], false, true)
    
    console.log('[Dashboard] Flow/Energy charts updated with realtime data for hour:', currentHour)
  }
}

// Setup Dashboard Handlers
function setupDashboardHandlers() {
  const reloadBtn = document.getElementById('dashboard-reload-btn')
  const timeRangeSelect = document.getElementById('dashboard-time-range')
  const flowChartDateInput = document.getElementById('flow-chart-date')
  const flowChartTodayBtn = document.getElementById('flow-chart-today-btn')
  const flowChartLoadBtn = document.getElementById('flow-chart-load-btn')
  
  // Daily chart elements
  const flowDailyChartMonthInput = document.getElementById('flow-daily-chart-month')
  const flowDailyChartCurrentBtn = document.getElementById('flow-daily-chart-current-btn')
  const flowDailyChartLoadBtn = document.getElementById('flow-daily-chart-load-btn')
  
  // AT-02 chart elements
  const at02ChartDateInput = document.getElementById('at02-chart-date')
  const at02ChartTodayBtn = document.getElementById('at02-chart-today-btn')
  const at02ChartLoadBtn = document.getElementById('at02-chart-load-btn')
  
  // AT-02 threshold control elements
  const at02ThresholdInput = document.getElementById('at02-threshold-input')
  const at02ThresholdApplyBtn = document.getElementById('at02-threshold-apply')
  
  // Handle threshold apply button
  if (at02ThresholdApplyBtn && at02ThresholdInput) {
    at02ThresholdApplyBtn.addEventListener('click', () => {
      const newThreshold = parseFloat(at02ThresholdInput.value)
      if (!isNaN(newThreshold) && newThreshold <= 0) {
        at02LevelThreshold = newThreshold
        console.log('[Dashboard] Threshold updated to:', at02LevelThreshold)
        loadAT02LevelData() // Reload chart with new threshold
      } else {
        alert('Please enter a valid negative number for threshold')
      }
    })
    
    // Allow Enter key to apply threshold
    at02ThresholdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        at02ThresholdApplyBtn.click()
      }
    })
  }
  
  // Set default date to today
  if (flowChartDateInput) {
    const today = new Date()
    flowChartDateInput.value = today.toISOString().split('T')[0]
  }
  
  // Set default date to today for AT-02
  if (at02ChartDateInput) {
    const today = new Date()
    at02ChartDateInput.value = today.toISOString().split('T')[0]
  }
  
  // Set default month to current month
  if (flowDailyChartMonthInput) {
    const today = new Date()
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    flowDailyChartMonthInput.value = yearMonth
  }
  
  // Today button handler
  if (flowChartTodayBtn) {
    flowChartTodayBtn.addEventListener('click', () => {
      const today = new Date()
      if (flowChartDateInput) {
        flowChartDateInput.value = today.toISOString().split('T')[0]
      }
      // Clear realtime accumulation data (realtime mode disabled)
      // realtimeFlowEnergyData.isRealtimeMode = true
      realtimeFlowEnergyData.hourlyAccumulation = {}
      realtimeFlowEnergyData.lastFlowValue = null
      realtimeFlowEnergyData.lastEnergyValue = null
      realtimeFlowEnergyData.lastUpdateHour = null
      loadFlowHourlyData(null) // Load today's data
    })
  }
  
  // Load button handler for date selection
  if (flowChartLoadBtn) {
    flowChartLoadBtn.addEventListener('click', () => {
      if (flowChartDateInput && flowChartDateInput.value) {
        const today = new Date().toISOString().split('T')[0]
        // Keep realtime mode disabled
        // realtimeFlowEnergyData.isRealtimeMode = (flowChartDateInput.value === today)
        if (flowChartDateInput.value !== today) {
          // Clear realtime data when viewing past dates
          realtimeFlowEnergyData.hourlyAccumulation = {}
          realtimeFlowEnergyData.lastFlowValue = null
          realtimeFlowEnergyData.lastEnergyValue = null
          realtimeFlowEnergyData.lastUpdateHour = null
        }
        loadFlowHourlyData(flowChartDateInput.value)
      }
    })
  }
  
  // Current Month button handler
  if (flowDailyChartCurrentBtn) {
    flowDailyChartCurrentBtn.addEventListener('click', () => {
      const today = new Date()
      const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      if (flowDailyChartMonthInput) {
        flowDailyChartMonthInput.value = yearMonth
      }
      loadFlowDailyData(null) // Load current month
    })
  }
  
  // Load button handler for daily/monthly chart
  if (flowDailyChartLoadBtn) {
    flowDailyChartLoadBtn.addEventListener('click', () => {
      if (flowDailyChartMonthInput && flowDailyChartMonthInput.value) {
        loadFlowDailyData(flowDailyChartMonthInput.value)
      }
    })
  }
  
  // AT-02 Today button handler
  if (at02ChartTodayBtn) {
    at02ChartTodayBtn.addEventListener('click', () => {
      const today = new Date()
      if (at02ChartDateInput) {
        at02ChartDateInput.value = today.toISOString().split('T')[0]
      }
      loadAT02HourlyData(null) // Load today's data
    })
  }
  
  // AT-02 Load button handler
  if (at02ChartLoadBtn) {
    at02ChartLoadBtn.addEventListener('click', () => {
      if (at02ChartDateInput && at02ChartDateInput.value) {
        loadAT02HourlyData(at02ChartDateInput.value)
      }
    })
  }
  
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      // Reload with current selected date if any
      const selectedDate = flowChartDateInput?.value
      loadFlowHourlyData(selectedDate || null)
      loadDashboardHistoricalData()
      
      // Reload daily chart
      const selectedMonth = flowDailyChartMonthInput?.value
      loadFlowDailyData(selectedMonth || null)
      
      // Reload AT-02 hourly chart
      const at02SelectedDate = at02ChartDateInput?.value
      loadAT02HourlyData(at02SelectedDate || null)
    })
  }
  
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', () => {
      const selectedDate = flowChartDateInput?.value
      loadFlowHourlyData(selectedDate || null)
      loadDashboardHistoricalData()
    })
  }
}

// Setup Data History Handlers
function setupDataHistoryHandlers() {
  const loadBtn = document.getElementById('load-data-btn')
  const refreshBtn = document.getElementById('refresh-data-btn')
  const exportBtn = document.getElementById('export-csv-btn')
  
  if (loadBtn) {
    loadBtn.addEventListener('click', loadWWT01Data)
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadWWT01Data)
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportToCSV)
  }
}

// Load WWT01 Data from API
async function loadWWT01Data() {
  const timeRange = document.getElementById('time-range').value
  const limit = document.getElementById('data-limit').value
  const tbody = document.getElementById('table-body')
  const apiUrl = `${API_BASE_URL}/wwt01/history?minutes=${timeRange}&limit=${limit}`
  
  tbody.innerHTML = '<tr><td colspan="37" style="text-align: center; padding: 20px;">Loading data...</td></tr>'
  
  try {
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="37" style="text-align: center; padding: 20px;">No data available</td></tr>'
      return
    }
    
    // Remove duplicates by time
    const uniqueData = []
    const seenTimes = new Set()
    data.forEach(row => {
      const timeKey = new Date(row.time).getTime()
      if (!seenTimes.has(timeKey)) {
        seenTimes.add(timeKey)
        uniqueData.push(row)
      }
    })
    
    // Update stats
    document.getElementById('total-records').textContent = uniqueData.length
    document.getElementById('latest-update').textContent = new Date(uniqueData[0].time).toLocaleString()
    document.getElementById('time-range-display').textContent = `Last ${timeRange} minutes`
    
    // Render table with all columns
    tbody.innerHTML = ''
    uniqueData.forEach(row => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td style="white-space: nowrap;">${new Date(row.time).toLocaleString()}</td>
        <td>${row.ph_sensor_01?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_01?.toFixed(0) || '--'}</td>
        <td>${row.temp_01?.toFixed(1) || '--'}</td>
        <td>${row.ph_sensor_02?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_02?.toFixed(0) || '--'}</td>
        <td>${row.temp_02?.toFixed(1) || '--'}</td>
        <td>${row.at_01_level ? (row.at_01_level * 3500).toFixed(2) : '--'}</td>
        <td>${row.ph_sensor_03?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_03?.toFixed(0) || '--'}</td>
        <td>${row.temp_03?.toFixed(1) || '--'}</td>
        <td>${row.ph_sensor_04?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_04?.toFixed(0) || '--'}</td>
        <td>${row.temp_04?.toFixed(1) || '--'}</td>
        <td>${row.sump_pump_water_level ? (row.sump_pump_water_level * 3500).toFixed(2) : '--'}</td>
        <td>${row.at_02_level ? (row.at_02_level * 3500).toFixed(2) : '--'}</td>
        <td>${row.ph_sensor_05?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_05?.toFixed(0) || '--'}</td>
        <td>${row.temp_05?.toFixed(1) || '--'}</td>
        <td>${row.ph_sensor_06?.toFixed(2) || '--'}</td>
        <td>${row.orp_sensor_06?.toFixed(0) || '--'}</td>
        <td>${row.temp_06?.toFixed(1) || '--'}</td>
        <td>${row.flow_meter_no1_realtime?.toFixed(2) || '--'}</td>
        <td>${row.flow_meter_no1_forward || '--'}</td>
        <td>${row.flow_meter_no2_realtime?.toFixed(2) || '--'}</td>
        <td>${row.flow_meter_no2_forward || '--'}</td>
        <td>${row.flow_meter_no3_realtime?.toFixed(2) || '--'}</td>
        <td>${row.flow_meter_no3_forward || '--'}</td>
        <td>${row.power_mdb_01_current?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_01_active_power?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_01_energy || '--'}</td>
        <td>${row.power_mdb_02_current?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_02_active_power?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_02_energy || '--'}</td>
        <td>${row.power_mdb_03_current?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_03_active_power?.toFixed(2) || '--'}</td>
        <td>${row.power_mdb_03_energy || '--'}</td>
      `
      tbody.appendChild(tr)
    })
  } catch (error) {
    console.error('Error loading data:', error)
    tbody.innerHTML = '<tr><td colspan="37" style="text-align: center; padding: 20px; color: red;">Error loading data</td></tr>'
  }
}

// Export to CSV
function exportToCSV() {
  const table = document.getElementById('data-table')
  let csv = []
  const rows = table.querySelectorAll('tr')
  
  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th')
    const csvRow = []
    cols.forEach(col => {
      csvRow.push(col.textContent)
    })
    csv.push(csvRow.join(','))
  })
  
  const csvContent = csv.join('\\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `wwt01_data_${new Date().toISOString()}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ============================================
// ORP ANALYSIS FUNCTIONS
// ============================================

let orpAnalysisData = {
  ph: [],
  orp: [],
  phRate: [],
  timestamps: []
}

let orpCharts = {
  combined: null,
  phRate: null
}

let currentLohand = 'at1'
let phHistory = []
const PH_HISTORY_SIZE = 10 // Keep last 10 readings for rate calculation

// Initialize ORP Analysis
function initializeORPAnalysis() {
  console.log('[ORP Analysis] Initializing charts...')
  
  const isDark = document.documentElement.classList.contains('dark')
  
  // Combined ORP/pH Chart with Dual Y-Axis
  const combinedOptions = {
    series: [
      { name: 'pH-01', data: [], type: 'line' },
      { name: 'pH-02', data: [], type: 'line' },
      { name: 'ORP-01', data: [], type: 'line' },
      { name: 'ORP-02', data: [], type: 'line' }
    ],
    chart: {
      height: 350,
      type: 'line',
      animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } },
      toolbar: { 
        show: true,
        tools: {
          download: true,
          zoom: true,
          pan: true,
          reset: true
        }
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff'
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    stroke: { width: [2, 2, 2, 2], curve: 'smooth' },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    xaxis: {
      type: 'datetime',
      labels: { 
        datetimeFormatter: { hour: 'HH:mm', minute: 'HH:mm' },
        style: { colors: isDark ? '#94a3b8' : '#64748b' }
      }
    },
    yaxis: [
      {
        title: { text: 'pH Level', style: { color: isDark ? '#cbd5e1' : '#0f172a' } },
        decimalsInFloat: 2,
        min: 6,
        max: 9,
        labels: { 
          formatter: (val) => val ? val.toFixed(2) : '--',
          style: { colors: isDark ? '#94a3b8' : '#64748b' }
        }
      },
      {
        opposite: true,
        title: { text: 'ORP (mV)', style: { color: isDark ? '#cbd5e1' : '#0f172a' } },
        decimalsInFloat: 0,
        labels: { 
          formatter: (val) => val ? val.toFixed(0) : '--',
          style: { colors: isDark ? '#94a3b8' : '#64748b' }
        }
      }
    ],
    legend: { position: 'top', labels: { colors: isDark ? '#cbd5e1' : '#0f172a' } },
    tooltip: { 
      theme: isDark ? 'dark' : 'light',
      shared: true,
      x: { format: 'HH:mm:ss' }
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  }
  
  orpCharts.combined = new ApexCharts(
    document.getElementById('chart-orp-ph-combined'),
    combinedOptions
  )
  orpCharts.combined.render()
  
  // pH Rate Chart
  const phRateOptions = {
    series: [{ name: 'ΔpH/Δt', data: [] }],
    chart: {
      height: 350,
      type: 'line',
      animations: { enabled: true, easing: 'linear', dynamicAnimation: { speed: 1000 } },
      toolbar: { 
        show: true,
        tools: {
          download: true,
          zoom: true,
          pan: true,
          reset: true
        }
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      foreColor: isDark ? '#94a3b8' : '#64748b',
      background: isDark ? '#1e293b' : '#ffffff'
    },
    colors: ['#8b5cf6'],
    stroke: { width: 3, curve: 'smooth' },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    xaxis: {
      type: 'datetime',
      labels: { 
        datetimeFormatter: { hour: 'HH:mm', minute: 'HH:mm' },
        style: { colors: isDark ? '#94a3b8' : '#64748b' }
      }
    },
    yaxis: {
      title: { text: 'pH Rate (pH/min)', style: { color: isDark ? '#cbd5e1' : '#0f172a' } },
      decimalsInFloat: 4,
      labels: { 
        formatter: (val) => val ? val.toFixed(4) : '--',
        style: { colors: isDark ? '#94a3b8' : '#64748b' }
      }
    },
    markers: { size: 0 },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: isDark ? '#64748b' : '#999',
          strokeDashArray: 5,
          label: { 
            text: 'ΔpH/Δt = 0', 
            style: { 
              background: isDark ? '#1e293b' : '#fff',
              color: isDark ? '#cbd5e1' : '#0f172a'
            } 
          }
        }
      ]
    },
    grid: {
      borderColor: isDark ? '#334155' : '#e2e8f0'
    },
    theme: { mode: isDark ? 'dark' : 'light' }
  }
  
  orpCharts.phRate = new ApexCharts(
    document.getElementById('chart-ph-rate'),
    phRateOptions
  )
  orpCharts.phRate.render()
  
  // Load initial data
  loadORPHistoricalData()
}

// Load Historical Data for ORP Analysis
async function loadORPHistoricalData() {
  const lohand = document.getElementById('orp-lohand-selector')?.value || 'at1'
  const timeRange = document.getElementById('orp-time-range')?.value || 30
  currentLohand = lohand
  
  console.log('[ORP Analysis] Loading data for', lohand, 'last', timeRange, 'minutes')
  
  try {
    const apiUrl = `${API_BASE_URL}/wwt01/history?minutes=${timeRange}&limit=1000`
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.length === 0) {
      console.log('[ORP Analysis] No data available')
      return
    }
    
    // Clear existing data
    orpAnalysisData = { ph: [], orp: [], phRate: [], timestamps: [] }
    phHistory = []
    
    // Map sensor fields based on selected Lohand
    const sensorMap = {
      at1: { ph1: 'ph_sensor_01', ph2: 'ph_sensor_02', orp1: 'orp_sensor_01', orp2: 'orp_sensor_02' },
      at2: { ph1: 'ph_sensor_03', ph2: 'ph_sensor_04', orp1: 'orp_sensor_03', orp2: 'orp_sensor_04' },
      at3: { ph1: 'ph_sensor_05', ph2: 'ph_sensor_06', orp1: 'orp_sensor_05', orp2: 'orp_sensor_06' }
    }
    
    const sensors = sensorMap[lohand]
    
    // Process data in reverse (oldest first)
    data.reverse().forEach(row => {
      const timestamp = new Date(row.time).getTime() + (7 * 60 * 60 * 1000)
      const ph1 = row[sensors.ph1]
      const ph2 = row[sensors.ph2]
      const orp1 = row[sensors.orp1] || 0
      const orp2 = row[sensors.orp2] || 0
      
      if (ph1 !== null && ph1 !== undefined) {
        orpAnalysisData.ph.push([
          { x: timestamp, y: ph1 },
          { x: timestamp, y: ph2 }
        ])
        orpAnalysisData.orp.push([
          { x: timestamp, y: orp1 },
          { x: timestamp, y: orp2 }
        ])
        orpAnalysisData.timestamps.push(timestamp)
        
        // Calculate pH rate
        phHistory.push({ time: timestamp, ph: ph1 })
        if (phHistory.length > PH_HISTORY_SIZE) phHistory.shift()
        
        const phRate = calculatePHRate()
        orpAnalysisData.phRate.push({ x: timestamp, y: phRate })
      }
    })
    
    // Update charts
    updateORPCharts()
    
    // Update current values
    if (data.length > 0) {
      const latest = data[data.length - 1]
      updateORPCurrentValues(latest, sensors)
      analyzeProcessPhase(latest, sensors)
    }
    
    console.log('[ORP Analysis] Loaded', data.length, 'records')
    
  } catch (error) {
    console.error('[ORP Analysis] Error loading data:', error)
  }
}

// Calculate pH Rate of Change
function calculatePHRate() {
  if (phHistory.length < 2) return 0
  
  const latest = phHistory[phHistory.length - 1]
  const oldest = phHistory[0]
  
  const timeDiffMinutes = (latest.time - oldest.time) / 60000 // Convert ms to minutes
  if (timeDiffMinutes === 0) return 0
  
  const phDiff = latest.ph - oldest.ph
  return phDiff / timeDiffMinutes
}

// Update ORP Charts
function updateORPCharts() {
  if (!orpCharts.combined || !orpCharts.phRate) return
  
  // Prepare data for combined chart
  const ph1Data = orpAnalysisData.ph.map(item => item[0])
  const ph2Data = orpAnalysisData.ph.map(item => item[1])
  const orp1Data = orpAnalysisData.orp.map(item => item[0])
  const orp2Data = orpAnalysisData.orp.map(item => item[1])
  
  orpCharts.combined.updateSeries([
    { name: 'pH-01', data: ph1Data, type: 'line' },
    { name: 'pH-02', data: ph2Data, type: 'line' },
    { name: 'ORP-01', data: orp1Data, type: 'line' },
    { name: 'ORP-02', data: orp2Data, type: 'line' }
  ])
  
  orpCharts.phRate.updateSeries([
    { name: 'ΔpH/Δt', data: orpAnalysisData.phRate }
  ])
}

// Update Current Values Display
function updateORPCurrentValues(data, sensors) {
  const ph01El = document.getElementById('current-ph01')
  const ph02El = document.getElementById('current-ph02')
  const orp01El = document.getElementById('current-orp01')
  const orp02El = document.getElementById('current-orp02')
  const phRateEl = document.getElementById('ph-rate')
  
  if (ph01El) ph01El.textContent = data[sensors.ph1]?.toFixed(2) || '--'
  if (ph02El) ph02El.textContent = data[sensors.ph2]?.toFixed(2) || '--'
  if (orp01El) orp01El.textContent = data[sensors.orp1]?.toFixed(0) || '--'
  if (orp02El) orp02El.textContent = data[sensors.orp2]?.toFixed(0) || '--'
  
  const phRate = calculatePHRate()
  if (phRateEl) phRateEl.textContent = phRate.toFixed(4)
}

// Analyze Process Phase
function analyzeProcessPhase(data, sensors) {
  const phaseEl = document.getElementById('process-phase')
  const blowerEl = document.getElementById('blower-recommendation')
  const reasonEl = document.getElementById('recommendation-reason')
  
  if (!phaseEl || !blowerEl || !reasonEl) return
  
  const orp = data[sensors.orp1] || 0
  const ph = data[sensors.ph1] || 7
  const phRate = calculatePHRate()
  
  // Determine process phase based on ORP trends
  let phase = 'Monitoring'
  let blowerAction = 'Monitor'
  let reason = 'Collecting data...'
  
  // Simple analysis logic
  if (orp > 150 && Math.abs(phRate) < 0.01) {
    phase = 'Nitrification End'
    blowerAction = '⚠️ Consider STOP Blower'
    reason = 'ORP peaked and ΔpH/Δt ≈ 0 (H⁺ generation stopped)'
    phaseEl.style.color = '#3b82f6'
    blowerEl.style.color = '#f59e0b'
  } else if (orp < -50 && Math.abs(phRate) < 0.01) {
    phase = 'Denitrification End'
    blowerAction = '⚠️ Consider START Blower'
    reason = 'ORP at minimum and ΔpH/Δt ≈ 0 (OH⁻ generation stopped)'
    phaseEl.style.color = '#10b981'
    blowerEl.style.color = '#10b981'
  } else if (orp > 100) {
    phase = 'Nitrification Active'
    blowerAction = 'Continue Aeration'
    reason = 'ORP rising, oxidation in progress'
    phaseEl.style.color = '#3b82f6'
    blowerEl.style.color = '#6b7280'
  } else if (orp < 0) {
    phase = 'Denitrification Active'
    blowerAction = 'Maintain Anoxic'
    reason = 'ORP declining, reduction in progress'
    phaseEl.style.color = '#10b981'
    blowerEl.style.color = '#6b7280'
  }
  
  phaseEl.textContent = phase
  blowerEl.textContent = blowerAction
  reasonEl.textContent = reason
}

// Update ORP Analysis with Real-time Data
function updateORPAnalysisRealtime(data) {
  if (!orpCharts.combined) return
  
  const sensorMap = {
    at1: { ph1: 'PH_Sensor_01', ph2: 'PH_Sensor_02', orp1: 'ORP_Sensor_01', orp2: 'ORP_Sensor_02' },
    at2: { ph1: 'PH_Sensor_03', ph2: 'PH_Sensor_04', orp1: 'ORP_Sensor_03', orp2: 'ORP_Sensor_04' },
    at3: { ph1: 'PH_Sensor_05', ph2: 'PH_Sensor_06', orp1: 'ORP_Sensor_05', orp2: 'ORP_Sensor_06' }
  }
  
  const sensors = sensorMap[currentLohand]
  const timestamp = new Date().getTime()
  
  const ph1 = data[sensors.ph1]
  const ph2 = data[sensors.ph2]
  const orp1 = data[sensors.orp1] || 0
  const orp2 = data[sensors.orp2] || 0
  
  if (ph1 !== undefined && ph1 !== null) {
    // Add new data
    orpAnalysisData.ph.push([
      { x: timestamp, y: ph1 },
      { x: timestamp, y: ph2 }
    ])
    orpAnalysisData.orp.push([
      { x: timestamp, y: orp1 },
      { x: timestamp, y: orp2 }
    ])
    orpAnalysisData.timestamps.push(timestamp)
    
    // Calculate pH rate
    phHistory.push({ time: timestamp, ph: ph1 })
    if (phHistory.length > PH_HISTORY_SIZE) phHistory.shift()
    
    const phRate = calculatePHRate()
    orpAnalysisData.phRate.push({ x: timestamp, y: phRate })
    
    // Trim old data (keep last 200 points)
    const MAX_POINTS = 200
    if (orpAnalysisData.timestamps.length > MAX_POINTS) {
      orpAnalysisData.ph.shift()
      orpAnalysisData.orp.shift()
      orpAnalysisData.phRate.shift()
      orpAnalysisData.timestamps.shift()
    }
    
    // Update charts
    updateORPCharts()
    
    // Update current values
    const dbSensors = {
      ph1: sensors.ph1.toLowerCase(),
      ph2: sensors.ph2.toLowerCase(),
      orp1: sensors.orp1.toLowerCase(),
      orp2: sensors.orp2.toLowerCase()
    }
    const dbData = {
      [dbSensors.ph1]: ph1,
      [dbSensors.ph2]: ph2,
      [dbSensors.orp1]: orp1,
      [dbSensors.orp2]: orp2
    }
    updateORPCurrentValues(dbData, dbSensors)
    analyzeProcessPhase(dbData, dbSensors)
  }
}

// ============================================
// PLANT PERFORMANCE FUNCTIONS
// ============================================

const ELECTRICITY_RATE = 4.30 // THB per kWh

// Load Plant Performance Data
async function loadPlantPerformanceData() {
  console.log('[Plant Performance] Loading data...')
  const statusEl = document.getElementById('perf-status')
  const dateEl = document.getElementById('perf-date')
  
  // Set today's date
  const today = new Date()
  const thaiDate = new Date(today.getTime() + (543 * 365.25 * 24 * 60 * 60 * 1000))
  if (dateEl) dateEl.textContent = thaiDate.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  
  // Set default date range (last 7 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)
  
  const startInput = document.getElementById('perf-date-start')
  const endInput = document.getElementById('perf-date-end')
  if (startInput) startInput.valueAsDate = startDate
  if (endInput) endInput.valueAsDate = endDate
  
  if (statusEl) statusEl.textContent = 'Loading data...'
  
  try {
    // Calculate minutes for the date range
    const minutes = Math.floor((endDate - startDate) / 60000)
    const apiUrl = `${API_BASE_URL}/wwt01/history?minutes=${minutes}&limit=10000`
    console.log('[Plant Performance] Fetching from:', apiUrl)
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.length === 0) {
      if (statusEl) statusEl.textContent = 'No data available'
      console.log('[Plant Performance] No data received')
      return
    }
    
    console.log('[Plant Performance] Received', data.length, 'records')
    
    // Calculate KPIs from real data
    calculatePlantKPIs(data)
    
    if (statusEl) statusEl.textContent = `Loaded ${data.length} records`
    
  } catch (error) {
    console.error('[Plant Performance] Error loading data:', error)
    if (statusEl) statusEl.textContent = 'Error loading data'
  }
}

// Calculate Plant KPIs from WWT01 data
function calculatePlantKPIs(data) {
  console.log('[Plant Performance] Calculating KPIs...')
  
  // Initialize accumulators
  let totalFlow = { at1: 0, at2: 0, at3: 0 }
  let totalEnergy = { mdb1: 0, mdb2: 0, mdb3: 0 }
  let dataCount = 0
  
  // Sum up all readings
  data.forEach(row => {
    // Flow meters (using forward/realtime - need to check which represents total)
    // Assuming flow_meter_no1 = AT1, no2 = AT2, no3/no4 = AT3
    if (row.flow_meter_no1_forward !== null) totalFlow.at1 += Math.abs(row.flow_meter_no1_forward || 0)
    if (row.flow_meter_no2_forward !== null) totalFlow.at2 += Math.abs(row.flow_meter_no2_forward || 0)
    if (row.flow_meter_no3_forward !== null) totalFlow.at3 += Math.abs(row.flow_meter_no3_forward || 0)
    if (row.flow_meter_no4_forward !== null) totalFlow.at3 += Math.abs(row.flow_meter_no4_forward || 0)
    
    // Power meters - using energy readings
    if (row.power_mdb_01_energy !== null) totalEnergy.mdb1 += Math.abs(row.power_mdb_01_energy || 0)
    if (row.power_mdb_02_energy !== null) totalEnergy.mdb2 += Math.abs(row.power_mdb_02_energy || 0)
    if (row.power_mdb_03_energy !== null) totalEnergy.mdb3 += Math.abs(row.power_mdb_03_energy || 0)
    
    dataCount++
  })
  
  // Calculate averages (per day)
  const daysInData = data.length / (24 * 60 / 0.5) // Assuming data every 30 seconds
  const avgFlow = {
    at1: totalFlow.at1 / Math.max(daysInData, 1),
    at2: totalFlow.at2 / Math.max(daysInData, 1),
    at3: totalFlow.at3 / Math.max(daysInData, 1)
  }
  
  // Calculate totals
  const totalFlowSum = totalFlow.at1 + totalFlow.at2 + totalFlow.at3
  const totalEnergySum = totalEnergy.mdb1 + totalEnergy.mdb2 + totalEnergy.mdb3
  const avgFlowSum = avgFlow.at1 + avgFlow.at2 + avgFlow.at3
  
  // Calculate costs (Energy * Rate)
  const totalCost = {
    mdb1: totalEnergy.mdb1 * ELECTRICITY_RATE,
    mdb2: totalEnergy.mdb2 * ELECTRICITY_RATE,
    mdb3: totalEnergy.mdb3 * ELECTRICITY_RATE
  }
  const totalCostSum = totalCost.mdb1 + totalCost.mdb2 + totalCost.mdb3
  
  // Calculate plant performance metrics
  const perfKwh = totalFlowSum > 0 ? totalEnergySum / totalFlowSum : 0
  const perfThb = totalFlowSum > 0 ? totalCostSum / totalFlowSum : 0
  
  // Update UI
  updatePlantPerformanceUI({
    totalFlow,
    totalFlowSum,
    avgFlow,
    avgFlowSum,
    totalEnergy,
    totalEnergySum,
    totalCost,
    totalCostSum,
    perfKwh,
    perfThb
  })
}

// Update Plant Performance UI
function updatePlantPerformanceUI(kpis) {
  console.log('[Plant Performance] Updating UI with KPIs:', kpis)
  
  // Format number with commas
  const fmt = (num) => Math.round(num).toLocaleString('en-US')
  const fmtDec = (num, decimals = 2) => num.toFixed(decimals).toLocaleString('en-US')
  
  // Total Flow
  const at1El = document.getElementById('kpi-at1')
  const at2El = document.getElementById('kpi-at2')
  const at3El = document.getElementById('kpi-at3')
  const totalFlowEl = document.getElementById('kpi-total-flow')
  
  if (at1El) at1El.textContent = fmt(kpis.totalFlow.at1)
  if (at2El) at2El.textContent = fmt(kpis.totalFlow.at2)
  if (at3El) at3El.textContent = fmt(kpis.totalFlow.at3)
  if (totalFlowEl) totalFlowEl.textContent = fmt(kpis.totalFlowSum)
  
  // Average Flow
  const avgAt1El = document.getElementById('kpi-avg-at1')
  const avgAt2El = document.getElementById('kpi-avg-at2')
  const avgAt3El = document.getElementById('kpi-avg-at3')
  const avgFlowEl = document.getElementById('kpi-avg-flow')
  
  if (avgAt1El) avgAt1El.textContent = fmt(kpis.avgFlow.at1)
  if (avgAt2El) avgAt2El.textContent = fmt(kpis.avgFlow.at2)
  if (avgAt3El) avgAt3El.textContent = fmt(kpis.avgFlow.at3)
  if (avgFlowEl) avgFlowEl.textContent = fmt(kpis.avgFlowSum)
  
  // Total Energy
  const mdb1El = document.getElementById('kpi-mdb1')
  const mdb2El = document.getElementById('kpi-mdb2')
  const mdb3El = document.getElementById('kpi-mdb3')
  const totalEnergyEl = document.getElementById('kpi-total-energy')
  
  if (mdb1El) mdb1El.textContent = fmt(kpis.totalEnergy.mdb1)
  if (mdb2El) mdb2El.textContent = fmt(kpis.totalEnergy.mdb2)
  if (mdb3El) mdb3El.textContent = fmt(kpis.totalEnergy.mdb3)
  if (totalEnergyEl) totalEnergyEl.textContent = fmt(kpis.totalEnergySum)
  
  // Total Cost
  const costMdb1El = document.getElementById('kpi-cost-mdb1')
  const costMdb2El = document.getElementById('kpi-cost-mdb2')
  const costMdb3El = document.getElementById('kpi-cost-mdb3')
  const totalCostEl = document.getElementById('kpi-total-cost')
  
  if (costMdb1El) costMdb1El.textContent = fmt(kpis.totalCost.mdb1)
  if (costMdb2El) costMdb2El.textContent = fmt(kpis.totalCost.mdb2)
  if (costMdb3El) costMdb3El.textContent = fmt(kpis.totalCost.mdb3)
  if (totalCostEl) totalCostEl.textContent = fmt(kpis.totalCostSum)
  
  // Plant Performance
  const perfKwhEl = document.getElementById('kpi-perf-kwh')
  const perfThbEl = document.getElementById('kpi-perf-thb')
  
  if (perfKwhEl) perfKwhEl.textContent = fmtDec(kpis.perfKwh, 2)
  if (perfThbEl) perfThbEl.textContent = fmtDec(kpis.perfThb, 2)
}

// Setup Plant Performance Handlers
function setupPlantPerformanceHandlers() {
  const reloadBtn = document.getElementById('perf-reload-btn')
  
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      loadPlantPerformanceData()
    })
  }
}

// Setup ORP Analysis Handlers
function setupORPAnalysisHandlers() {
  const reloadBtn = document.getElementById('orp-reload-btn')
  const lohandSelect = document.getElementById('orp-lohand-selector')
  const timeRangeSelect = document.getElementById('orp-time-range')
  
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      loadORPHistoricalData()
    })
  }
  
  if (lohandSelect) {
    lohandSelect.addEventListener('change', () => {
      loadORPHistoricalData()
    })
  }
  
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', () => {
      loadORPHistoricalData()
    })
  }
}

// Initialize MQTT connection
connectMQTT()

// Initialize chat button
try {
  const chatButton = createChatButton()
  console.log('✅ Chat button initialized')
  window.chatButton = chatButton // Make it accessible globally
} catch (error) {
  console.error('❌ Failed to initialize chat button:', error)
}

// Initialize dashboard on page load
console.log('[Init] Page loaded, initializing dashboard...')
setTimeout(() => {
  const currentPage = document.querySelector('.nav-item.active')?.getAttribute('data-page')
  console.log('[Init] Current page:', currentPage)
  if (currentPage === 'dashboard' || !currentPage) {
    console.log('[Init] Loading dashboard page...')
    changePage('dashboard')
  }
}, 300)

