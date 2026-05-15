<template>
  <div ref="chartRef" :class="className" :style="{height, width}" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'RaddarChart',
  props: {
    className: { type: String, default: 'chart' },
    width: { type: String, default: '100%' },
    height: { type: String, default: '300px' }
  },
  data() {
    return { chart: null }
  },
  mounted() {
    this.$nextTick(() => { this.initChart() })
  },
  beforeUnmount() {
    if (this.chart) { this.chart.dispose(); this.chart = null }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
      this.chart.setOption({
        legend: { bottom: 10, data: ['Allocated Budget', 'Expected Spending', 'Actual Spending'] },
        radar: {
          indicator: [
            { name: 'Sales', max: 6500 },
            { name: 'Administration', max: 16000 },
            { name: 'Information Technology', max: 30000 },
            { name: 'Customer Support', max: 38000 },
            { name: 'Development', max: 52000 },
            { name: 'Marketing', max: 25000 }
          ]
        },
        series: [{
          type: 'radar',
          data: [
            { value: [5000, 7000, 12000, 11000, 15000, 14000], name: 'Allocated Budget' },
            { value: [4000, 9000, 15000, 15000, 13000, 11000], name: 'Expected Spending' },
            { value: [5500, 11000, 12000, 15000, 12000, 12000], name: 'Actual Spending' }
          ]
        }]
      })
    }
  }
}
</script>
