<template>
  <div :style="{ padding: '0 0 32px 32px' }">
    <h4 :style="{ marginBottom: '20px' }">{{ title }}</h4>
    <div ref="chartRef" style="width: 100%; height: 254px;" />
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'AppBar',
  props: {
    title: { type: String, default: '' },
    list: { type: Array, default: () => [] }
  },
  data() {
    return { chart: null }
  },
  watch: {
    list: { handler() { this.updateChart() }, deep: true }
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
      this.updateChart()
    },
    updateChart() {
      if (!this.chart) return
      const data = this.list || []
      this.chart.setOption({
        grid: { top: 20, bottom: 30, left: '3%', right: '3%', containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }},
        xAxis: { type: 'category', data: data.map(d => d.x), axisTick: { alignWithLabel: true }},
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: data.map(d => d.y),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#40a9ff' },
              { offset: 1, color: '#1677ff' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barMaxWidth: 40
        }]
      })
    }
  }
}
</script>
