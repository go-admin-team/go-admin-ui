<template>
  <div class="chart-trend">
    <slot name="term" />
    <span>{{ rate }}%</span>
    <span :class="[flag]">
      <i :class="flag === 'top' ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'" />
    </span>
  </div>
</template>

<script>
export default {
  name: 'TrendIndicator',
  props: {
    rate: {
      type: String,
      default: '',
      required: true
    },
    flag: {
      type: String,
      default: '',
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-trend {
  display: inline-block;
  font-size: 14px;
  line-height: 22px;
  vertical-align: top;
  // The label comes from a slot and the figure follows it directly. Chinese
  // reads fine like that; English ran them together ("Weekly Change12%").
  > :nth-child(2) { margin-left: 4px; }
  .trend-icon {
    font-size: 12px;
  }
}
.top,
.bottom {
  margin-left: 4px;
  position: relative;
  top: 1px;
  width: 15px;
  // Pinned to the line height: left to size itself, the inline-block came out one
  // pixel taller than the text beside it and made the fourth card taller than
  // the other three.
  height: 22px;
  vertical-align: top;
  display: inline-block;
  i {
    font-size: 12px;
    transform: scale(0.83);
  }
}

.top {
      i{
          color: #f5222d!important;
      }
    }
    .bottom {
      top: -1px;
      i{
          color: #52c41a!important;
      }
    }
</style>
