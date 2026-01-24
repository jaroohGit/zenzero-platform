<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">WWT</span>
              </div>
            </div>
            <div class="ml-3">
              <h1 class="text-xl font-semibold text-gray-900">Wastewater Treatment Database</h1>
              <p class="text-sm text-gray-500">TimescaleDB Management System</p>
            </div>
          </div>
          
          <!-- Header Actions -->
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">
              <span class="font-medium">{{ totalRecords }}</span> Records
            </div>
            <div class="text-sm text-gray-600">
              <span :class="connectionStatus ? 'text-green-600' : 'text-red-600'">
                {{ connectionStatus ? '● Connected' : '● Disconnected' }}
              </span>
            </div>
            <button
              @click="refreshData"
              :disabled="isLoading"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {{ isLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar -->
      <nav class="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
        <div class="p-4">
          <div class="space-y-2">
            <!-- Dashboard -->
            <router-link
              to="/dashboard"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="$route?.path === '/dashboard' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              📊 Dashboard
            </router-link>

            <!-- CSV Data -->
            <router-link
              to="/csv-data"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
              :class="$route?.path === '/csv-data' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              📋 CSV Data ({{ totalRecords }})
            </router-link>

            <!-- Analytics -->
            <div class="pt-2">
              <h3 class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics</h3>
              <div class="mt-2 space-y-1">
                <router-link
                  to="/analytics/summary"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="$route?.path === '/analytics/summary' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  📈 Summary
                </router-link>
                
                <router-link
                  to="/analytics/trends"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="$route?.path === '/analytics/trends' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  📊 Monthly Trends
                </router-link>

                <router-link
                  to="/analytics/efficiency"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="$route?.path === '/analytics/efficiency' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  ⚙️ Efficiency Analysis
                </router-link>
              </div>
            </div>

            <!-- Plant Management -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Plant Management</h3>
              <div class="mt-2 space-y-1">
                <router-link
                  to="/plants"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="$route?.path === '/plants' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  🏭 Plants ({{ plantCount }})
                </router-link>
              </div>
            </div>

            <!-- Database Tools -->
            <div class="pt-4">
              <h3 class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Database</h3>
              <div class="mt-2 space-y-1">
                <router-link
                  to="/database/health"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
                  :class="$route?.path === '/database/health' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                >
                  💓 Health Status
                </router-link>

                <a
                  href="http://localhost:8082"
                  target="_blank"
                  class="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                >
                  🗄️ pgAdmin
                  <span class="text-xs">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <router-view v-if="$route" />
        <div v-else class="text-center py-12">
          <div class="mx-auto max-w-md">
            <div class="h-12 w-12 mx-auto bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <span class="text-white font-bold text-lg">WWT</span>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to WWT Database</h2>
            <p class="text-gray-600 mb-6">
              TimescaleDB-powered wastewater treatment data management system
            </p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="font-semibold text-gray-900">{{ totalRecords }}</div>
                <div class="text-gray-500">Total Records</div>
              </div>
              <div class="bg-white p-4 rounded-lg shadow-sm">
                <div class="font-semibold" :class="connectionStatus ? 'text-green-600' : 'text-red-600'">
                  {{ connectionStatus ? 'Connected' : 'Disconnected' }}
                </div>
                <div class="text-gray-500">Database Status</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'App',
  setup() {
    const totalRecords = ref(0)
    const plantCount = ref(1)
    const connectionStatus = ref(false)
    const isLoading = ref(false)

    const API_BASE = 'http://localhost:3002'

    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/health`)
        connectionStatus.value = response.data.database?.connected || false
      } catch (error) {
        connectionStatus.value = false
      }
    }

    const loadSummary = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/csv/summary`)
        if (response.data.success) {
          totalRecords.value = response.data.data.total_records || 0
          plantCount.value = response.data.data.total_plants || 1
        }
      } catch (error) {
        console.error('Failed to load summary:', error)
      }
    }

    const refreshData = async () => {
      isLoading.value = true
      try {
        await Promise.all([checkHealth(), loadSummary()])
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      refreshData()
      // Refresh every 30 seconds
      setInterval(checkHealth, 30000)
    })

    return {
      totalRecords,
      plantCount,
      connectionStatus,
      isLoading,
      refreshData
    }
  }
}
</script>

<style>
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
