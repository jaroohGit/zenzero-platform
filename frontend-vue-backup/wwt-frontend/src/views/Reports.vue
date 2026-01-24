<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
    
    <!-- Report Generation -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Generate Reports</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label for="reportType" class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select v-model="reportType" id="reportType" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="daily">Daily Report</option>
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="annual">Annual Report</option>
          </select>
        </div>
        <div>
          <label for="reportPlant" class="block text-sm font-medium text-gray-700 mb-2">Plant</label>
          <select v-model="selectedPlant" id="reportPlant" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Plants</option>
            <option v-for="plant in plants" :key="plant" :value="plant">{{ plant }}</option>
          </select>
        </div>
        <div>
          <label for="reportStartDate" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input v-model="startDate" type="date" id="reportStartDate" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
        <div>
          <label for="reportEndDate" class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input v-model="endDate" type="date" id="reportEndDate" class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        </div>
      </div>
      <div class="flex space-x-4">
        <button @click="generateReport" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Generate Report
        </button>
        <button @click="downloadReport" :disabled="!reportGenerated" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
          Download PDF
        </button>
      </div>
    </div>

    <!-- Report Preview -->
    <div v-if="reportGenerated" class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-6">Report Preview</h2>
      
      <!-- Report Header -->
      <div class="border-b pb-4 mb-6">
        <h3 class="text-lg font-medium text-gray-900">{{ reportTitle }}</h3>
        <p class="text-sm text-gray-600">Generated on {{ new Date().toLocaleDateString() }}</p>
        <p class="text-sm text-gray-600">Period: {{ startDate }} to {{ endDate }}</p>
      </div>

      <!-- Summary Statistics -->
      <div class="mb-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Summary Statistics</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded">
            <p class="text-sm text-gray-600">Total Records</p>
            <p class="text-2xl font-semibold text-gray-900">{{ reportData.totalRecords }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded">
            <p class="text-sm text-gray-600">Average BOD Efficiency</p>
            <p class="text-2xl font-semibold text-green-600">{{ reportData.avgBodEfficiency }}%</p>
          </div>
          <div class="bg-gray-50 p-4 rounded">
            <p class="text-sm text-gray-600">Average Flow Rate</p>
            <p class="text-2xl font-semibold text-blue-600">{{ reportData.avgFlowRate }} m³/d</p>
          </div>
        </div>
      </div>

      <!-- Treatment Performance -->
      <div class="mb-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Treatment Performance</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Influent</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Effluent</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">BOD (mg/L)</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgBodIn }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgBodOut }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ reportData.bodEfficiency }}%</td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SS (mg/L)</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgSsIn }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgSsOut }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ reportData.ssEfficiency }}%</td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">NH3 (mg/L)</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgNh3In }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ reportData.avgNh3Out }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ reportData.nh3Efficiency }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Plant Performance -->
      <div v-if="reportData.plantPerformance && reportData.plantPerformance.length > 0">
        <h4 class="text-md font-medium text-gray-900 mb-4">Plant Performance Comparison</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BOD Efficiency</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SS Efficiency</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NH3 Efficiency</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="plant in reportData.plantPerformance" :key="plant.plant">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ plant.plant }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ plant.record_count }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ plant.bod_efficiency }}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ plant.ss_efficiency }}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ plant.nh3_efficiency }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'Reports',
  setup() {
    const reportType = ref('monthly')
    const selectedPlant = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const plants = ref([])
    const reportGenerated = ref(false)
    const reportData = ref({})

    const reportTitle = computed(() => {
      const type = reportType.value.charAt(0).toUpperCase() + reportType.value.slice(1)
      const plant = selectedPlant.value || 'All Plants'
      return `${type} Treatment Report - ${plant}`
    })

    const loadPlants = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/data/plants')
        const result = await response.json()
        plants.value = result
      } catch (error) {
        console.error('Error loading plants:', error)
      }
    }

    const generateReport = async () => {
      try {
        const params = new URLSearchParams()
        if (selectedPlant.value) params.append('plant', selectedPlant.value)
        if (startDate.value) params.append('start_date', startDate.value)
        if (endDate.value) params.append('end_date', endDate.value)

        const response = await fetch(`http://localhost:3002/api/reports/${reportType.value}?${params}`)
        const data = await response.json()
        
        reportData.value = {
          totalRecords: data.summary.total_records,
          avgBodEfficiency: parseFloat(data.efficiency.bod_efficiency).toFixed(1),
          avgFlowRate: parseFloat(data.flow.avg_flow_rate).toFixed(0),
          avgBodIn: parseFloat(data.summary.avg_bod_in).toFixed(1),
          avgBodOut: parseFloat(data.summary.avg_bod_out).toFixed(1),
          avgSsIn: parseFloat(data.summary.avg_ss_in).toFixed(1),
          avgSsOut: parseFloat(data.summary.avg_ss_out).toFixed(1),
          avgNh3In: parseFloat(data.summary.avg_nh3_in).toFixed(1),
          avgNh3Out: parseFloat(data.summary.avg_nh3_out).toFixed(1),
          bodEfficiency: parseFloat(data.efficiency.bod_efficiency).toFixed(1),
          ssEfficiency: parseFloat(data.efficiency.ss_efficiency).toFixed(1),
          nh3Efficiency: parseFloat(data.efficiency.nh3_efficiency).toFixed(1),
          plantPerformance: data.plant_performance || []
        }
        
        reportGenerated.value = true
      } catch (error) {
        console.error('Error generating report:', error)
      }
    }

    const downloadReport = () => {
      // For now, just show a placeholder
      alert('PDF download functionality would be implemented here')
    }

    onMounted(() => {
      loadPlants()
      
      // Set default dates
      const today = new Date()
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      
      startDate.value = lastMonth.toISOString().split('T')[0]
      endDate.value = endOfLastMonth.toISOString().split('T')[0]
    })

    return {
      reportType,
      selectedPlant,
      startDate,
      endDate,
      plants,
      reportGenerated,
      reportData,
      reportTitle,
      generateReport,
      downloadReport
    }
  }
}
</script>
