<template>
  <Radar :options="chartOptions" :data="chartData" :plugins="chartPlugins" />
</template>

<script lang="ts">
import type { ChartData, Plugin } from 'chart.js'
import { Radar } from 'vue-chartjs'

export default {
  name: 'RadarChart',
  components: {
    Radar
  },
  props: {
    chartData: {
      type: Object as () => ChartData<'radar'>,
      required: true
    },
    chartOptions: {
      type: Object,
      required: true
    },
    chartPlugins: {
      type: Array as () => Plugin<'radar'>[],
      required: false,
      default: () => []
    }
  }
}
</script>
