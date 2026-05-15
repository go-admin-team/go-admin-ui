<template>
  <div ref="chartRef" :class="className" :style="{height, width}" />
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'LineChart',
  props: {
    className: { type: String, default: 'chart' },
    width: { type: String, default: '100%' },
    height: { type: String, default: '350px' },
    autoResize: { type: Boolean, default: true },
    chartData: { type: Object, required: true }
  },
  data() {
    return { chart: null }
  },
  watch: {
    chartData: { deep: true, handler(val) { this.setOptions(val) } }
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
      this.setOptions(this.chartData)
    },
    setOptions({ expectedData, actualData } = {}) {
      this.chart.setOption({
        xAxis: {
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          boundaryGap: false,
          axisTick: { show: false }
        },
        grid: { left: 10, right: 10, bottom: 20, top: 30, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, padding: [5, 10] },
        yAxis: { axisTick: { show: false }},
        legend: { data: ['expected', 'actual'] },
        series: [
          {
            name: 'expected',
            itemStyle: { color: '#FF005A', lineStyle: { color: '#FF005A', width: 2 }},
            smooth: true, type: 'line', data: expectedData,
            animationDuration: 2800, animationEasing: 'cubicInOut'
          },
          {
            name: 'actual', smooth: true, type: 'line',
            itemStyle: { color: '#3888fa', lineStyle: { color: '#3888fa', width: 2 }, areaStyle: { color: '#f3f8ff' }},
            data: actualData, animationDuration: 2800, animationEasing: 'quadraticOut'
          }
        ]
      })
    }
  }
}
</script>
