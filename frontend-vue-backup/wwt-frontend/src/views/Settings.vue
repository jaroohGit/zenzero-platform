<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
    
    <!-- API Configuration -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">API Configuration</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="apiUrl" class="block text-sm font-medium text-gray-700 mb-2">API Base URL</label>
          <input v-model="settings.apiUrl" type="text" id="apiUrl" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div>
          <label for="refreshInterval" class="block text-sm font-medium text-gray-700 mb-2">Data Refresh Interval (seconds)</label>
          <input v-model="settings.refreshInterval" type="number" id="refreshInterval" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
      </div>
      <div class="mt-4">
        <button @click="testConnection" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Test Connection
        </button>
        <span v-if="connectionStatus" :class="connectionStatus.success ? 'text-green-600' : 'text-red-600'" class="text-sm">
          {{ connectionStatus.message }}
        </span>
      </div>
    </div>

    <!-- Display Settings -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Display Settings</h2>
      <div class="space-y-4">
        <div class="flex items-center">
          <input v-model="settings.showCharts" type="checkbox" id="showCharts" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          <label for="showCharts" class="ml-2 text-sm text-gray-700">Show charts in analytics</label>
        </div>
        <div class="flex items-center">
          <input v-model="settings.autoRefresh" type="checkbox" id="autoRefresh" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          <label for="autoRefresh" class="ml-2 text-sm text-gray-700">Auto-refresh dashboard data</label>
        </div>
        <div class="flex items-center">
          <input v-model="settings.showNotifications" type="checkbox" id="showNotifications" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
          <label for="showNotifications" class="ml-2 text-sm text-gray-700">Show notifications</label>
        </div>
      </div>
    </div>

    <!-- Data Export Settings -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Export Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="exportFormat" class="block text-sm font-medium text-gray-700 mb-2">Default Export Format</label>
          <select v-model="settings.exportFormat" id="exportFormat" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div>
          <label for="maxRecords" class="block text-sm font-medium text-gray-700 mb-2">Max Records per Export</label>
          <input v-model="settings.maxRecords" type="number" id="maxRecords" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
      </div>
    </div>

    <!-- Database Settings -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Database Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gray-50 p-4 rounded">
          <p class="text-sm text-gray-600">Database Status</p>
          <p class="text-lg font-semibold" :class="dbInfo.connected ? 'text-green-600' : 'text-red-600'">
            {{ dbInfo.connected ? 'Connected' : 'Disconnected' }}
          </p>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <p class="text-sm text-gray-600">Total Records</p>
          <p class="text-lg font-semibold text-gray-900">{{ dbInfo.totalRecords }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <p class="text-sm text-gray-600">Database Size</p>
          <p class="text-lg font-semibold text-gray-900">{{ dbInfo.size }}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <p class="text-sm text-gray-600">Last Update</p>
          <p class="text-lg font-semibold text-gray-900">{{ dbInfo.lastUpdate }}</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
      <div class="flex space-x-4">
        <button @click="saveSettings" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Save Settings
        </button>
        <button @click="resetSettings" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Reset to Defaults
        </button>
        <button @click="exportSettings" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Export Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Settings',
  setup() {
    const settings = ref({
      apiUrl: 'http://localhost:3002',
      refreshInterval: 30,
      showCharts: true,
      autoRefresh: true,
      showNotifications: true,
      exportFormat: 'csv',
      maxRecords: 10000
    })

    const connectionStatus = ref(null)
    const dbInfo = ref({
      connected: false,
      totalRecords: 0,
      size: 'Unknown',
      lastUpdate: 'Unknown'
    })

    const testConnection = async () => {
      try {
        const response = await fetch(`${settings.value.apiUrl}/api/health`)
        if (response.ok) {
          connectionStatus.value = {
            success: true,
            message: 'Connection successful'
          }
        } else {
          connectionStatus.value = {
            success: false,
            message: 'Connection failed'
          }
        }
      } catch (error) {
        connectionStatus.value = {
          success: false,
          message: 'Connection error: ' + error.message
        }
      }
    }

    const loadDbInfo = async () => {
      try {
        const response = await fetch(`${settings.value.apiUrl}/api/database/info`)
        const info = await response.json()
        
        dbInfo.value = {
          connected: info.connected,
          totalRecords: info.total_records,
          size: info.database_size,
          lastUpdate: new Date(info.last_update).toLocaleDateString()
        }
      } catch (error) {
        console.error('Error loading database info:', error)
      }
    }

    const saveSettings = () => {
      localStorage.setItem('wwt-settings', JSON.stringify(settings.value))
      alert('Settings saved successfully!')
    }

    const resetSettings = () => {
      settings.value = {
        apiUrl: 'http://localhost:3002',
        refreshInterval: 30,
        showCharts: true,
        autoRefresh: true,
        showNotifications: true,
        exportFormat: 'csv',
        maxRecords: 10000
      }
    }

    const exportSettings = () => {
      const dataStr = JSON.stringify(settings.value, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      
      const exportFileDefaultName = 'wwt-settings.json'
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }

    onMounted(() => {
      // Load settings from localStorage
      const savedSettings = localStorage.getItem('wwt-settings')
      if (savedSettings) {
        settings.value = JSON.parse(savedSettings)
      }
      
      loadDbInfo()
    })

    return {
      settings,
      connectionStatus,
      dbInfo,
      testConnection,
      saveSettings,
      resetSettings,
      exportSettings
    }
  }
}
</script>
