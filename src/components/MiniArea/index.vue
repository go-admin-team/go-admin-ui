<template>
  <div class="antv-chart-mini">
    <div ref="chartRef" style="height: 50px;" />
  </div>
</template>

<script>
import * as echarts from 'echarts'
import moment from 'moment'

const generateData = () => {
  const data = []
  const beginDay = new Date().getTime()
  for (let i = 0; i < 10; i++) {
    data.push({
      x: moment(new Date(beginDay + 1000 * 60 * 60 * 24 * i)).format('MM-DD'),
      y: Math.round(Math.random() * 10)
    })
  }
  return data
}

export default {
  name: 'MiniArea',
  data() {
    return { chart: null, rawData: generateData() }
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
        grid: { top: 2, bottom: 2, left: 2, right: 2 },
        xAxis: { type: 'category', data: this.rawData.map(d => d.x), show: false, boundaryGap: false },
        yAxis: { show: false },
        series: [{
          type: 'line',
          data: this.rawData.map(d => d.y),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#1677ff', width: 2 },
          areaStyle: { color: 'rgba(22,119,255,0.15)' }
        }]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.antv-chart-mini {
  position: relative;
  width: 100%;
}
</style>
