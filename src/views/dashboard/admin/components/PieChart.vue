<template>
  <div ref="chartRef" :class="className" :style="{height, width}" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'PieChart',
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
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
        legend: { left: 'center', bottom: '10', data: ['Industries', 'Technology', 'Forex', 'Gold', 'Forecasts'] },
        series: [{
          name: 'WEEKLY WRITE ARTICLES',
          type: 'pie',
          roseType: 'radius',
          radius: [15, 95],
          center: ['50%', '38%'],
          data: [
            { value: 320, name: 'Industries' },
            { value: 240, name: 'Technology' },
            { value: 149, name: 'Forex' },
            { value: 100, name: 'Gold' },
            { value: 59, name: 'Forecasts' }
          ],
          animationEasing: 'cubicInOut',
          animationDuration: 2600
        }]
      })
    }
  }
}
</script>
