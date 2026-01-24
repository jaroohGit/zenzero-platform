<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>
    
    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Treatment Efficiency</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">BOD Removal:</span>
            <span class="text-sm font-medium text-green-600">{{ bodEfficiency }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">SS Removal:</span>
            <span class="text-sm font-medium text-green-600">{{ ssEfficiency }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">NH3 Removal:</span>
            <span class="text-sm font-medium text-green-600">{{ nh3Efficiency }}%</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Plant Performance</h3>
        <div class="space-y-2">
          <div v-for="plant in plantPerformance" :key="plant.name" class="flex justify-between">
            <span class="text-sm text-gray-600">{{ plant.name }}:</span>
            <span class="text-sm font-medium" :class="getPerformanceColor(plant.efficiency)">{{ plant.efficiency }}%</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Flow Analysis</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Avg Flow Rate:</span>
            <span class="text-sm font-medium text-blue-600">{{ avgFlowRate }} m³/d</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Peak Flow:</span>
            <span class="text-sm font-medium text-red-600">{{ maxFlowRate }} m³/d</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Min Flow:</span>
            <span class="text-sm font-medium text-green-600">{{ minFlowRate }} m³/d</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">BOD Trends</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">SS Trends</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">NH3 Trends</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Flow Rate Trends</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Analytics',
  setup() {
    const bodEfficiency = ref(0)
    const ssEfficiency = ref(0)
    const nh3Efficiency = ref(0)
    const avgFlowRate = ref(0)
    const maxFlowRate = ref(0)
    const minFlowRate = ref(0)
    const plantPerformance = ref([])

    const loadAnalytics = async () => {
      try {
        // Load efficiency data
        const efficiencyResponse = await fetch('http://localhost:3002/api/analytics/efficiency')
        const efficiency = await efficiencyResponse.json()
        
        bodEfficiency.value = parseFloat(efficiency.bod_efficiency).toFixed(1)
        ssEfficiency.value = parseFloat(efficiency.ss_efficiency).toFixed(1)
        nh3Efficiency.value = parseFloat(efficiency.nh3_efficiency).toFixed(1)

        // Load flow rate data
        const flowResponse = await fetch('http://localhost:3002/api/analytics/flow-rates')
        const flow = await flowResponse.json()
        
        avgFlowRate.value = parseFloat(flow.avg_flow_rate).toFixed(0)
        maxFlowRate.value = parseFloat(flow.max_flow_rate).toFixed(0)
        minFlowRate.value = parseFloat(flow.min_flow_rate).toFixed(0)

        // Load plant performance
        const plantResponse = await fetch('http://localhost:3002/api/analytics/plant-performance')
        const plants = await plantResponse.json()
        plantPerformance.value = plants.map(plant => ({
          name: plant.plant,
          efficiency: parseFloat(plant.efficiency).toFixed(1)
        }))

      } catch (error) {
        console.error('Error loading analytics:', error)
      }
    }

    const getPerformanceColor = (efficiency) => {
      const eff = parseFloat(efficiency)
      if (eff >= 90) return 'text-green-600'
      if (eff >= 75) return 'text-yellow-600'
      return 'text-red-600'
    }

    onMounted(() => {
      loadAnalytics()
    })

    return {
      bodEfficiency,
      ssEfficiency,
      nh3Efficiency,
      avgFlowRate,
      maxFlowRate,
      minFlowRate,
      plantPerformance,
      getPerformanceColor
    }
  }
}
</script>
