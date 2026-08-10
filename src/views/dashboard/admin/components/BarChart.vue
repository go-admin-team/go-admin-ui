<template>
  <div ref="chartRef" :class="className" :style="{height, width}" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'BarChart',
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
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }},
        grid: { top: 10, left: '2%', right: '2%', bottom: '3%', containLabel: true },
        xAxis: [{ type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisTick: { alignWithLabel: true }}],
        yAxis: [{ type: 'value', axisTick: { show: false }}],
        series: [
          { name: 'pageA', type: 'bar', stack: 'vistors', barWidth: '60%', data: [79, 52, 200, 334, 390, 330, 220] },
          { name: 'pageB', type: 'bar', stack: 'vistors', barWidth: '60%', data: [80, 52, 200, 334, 390, 330, 220] },
          { name: 'pageC', type: 'bar', stack: 'vistors', barWidth: '60%', data: [30, 52, 200, 334, 390, 330, 220] }
        ]
      })
    }
  }
}
</script>
