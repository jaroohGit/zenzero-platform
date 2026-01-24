<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Data Management</h1>
    
    <!-- Filters -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="plant" class="block text-sm font-medium text-gray-700 mb-2">Plant</label>
          <select v-model="selectedPlant" id="plant" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Plants</option>
            <option v-for="plant in plants" :key="plant" :value="plant">{{ plant }}</option>
          </select>
        </div>
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input v-model="startDate" type="date" id="startDate" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input v-model="endDate" type="date" id="endDate" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
      </div>
      <div class="flex justify-between mt-4">
        <button @click="loadData" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Filter Data
        </button>
        <button @click="exportData" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Export CSV
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-medium text-gray-900">Treatment Data ({{ totalRecords }} records)</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BOD Influent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BOD Effluent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SS Influent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SS Effluent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NH3 Influent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NH3 Effluent</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flow Rate</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="record in data" :key="record.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(record.date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.plant }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.bod_influent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.bod_effluent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.ss_influent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.ss_effluent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.nh3_influent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.nh3_effluent }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ record.flow_rate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="bg-white px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalRecords) }} of {{ totalRecords }} results
            </p>
          </div>
          <div class="flex space-x-2">
            <button @click="previousPage" :disabled="currentPage === 1" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button @click="nextPage" :disabled="currentPage * pageSize >= totalRecords" class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'DataManagement',
  setup() {
    const data = ref([])
    const plants = ref([])
    const selectedPlant = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const currentPage = ref(1)
    const pageSize = ref(50)
    const totalRecords = ref(0)

    const loadData = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.value,
          limit: pageSize.value
        })

        if (selectedPlant.value) params.append('plant', selectedPlant.value)
        if (startDate.value) params.append('start_date', startDate.value)
        if (endDate.value) params.append('end_date', endDate.value)

        const response = await fetch(`http://localhost:3002/api/data?${params}`)
        const result = await response.json()
        
        data.value = result.data
        totalRecords.value = result.total
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const loadPlants = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/data/plants')
        const result = await response.json()
        plants.value = result
      } catch (error) {
        console.error('Error loading plants:', error)
      }
    }

    const exportData = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedPlant.value) params.append('plant', selectedPlant.value)
        if (startDate.value) params.append('start_date', startDate.value)
        if (endDate.value) params.append('end_date', endDate.value)

        const response = await fetch(`http://localhost:3002/api/data/export?${params}`)
        const blob = await response.blob()
        
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'wastewater_data.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Error exporting data:', error)
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        loadData()
      }
    }

    const nextPage = () => {
      if (currentPage.value * pageSize.value < totalRecords.value) {
        currentPage.value++
        loadData()
      }
    }

    onMounted(() => {
      loadData()
      loadPlants()
    })

    return {
      data,
      plants,
      selectedPlant,
      startDate,
      endDate,
      currentPage,
      pageSize,
      totalRecords,
      loadData,
      exportData,
      formatDate,
      previousPage,
      nextPage
    }
  }
}
</script>
