<template>
  <div class="chart-trend">
    <slot name="term" />
    <span>{{ rate }}%</span>
    <span :class="[flag]">
      <i :class="'el-icon-caret-' + flag" />
    </span>
  </div>
</template>

<script>
export default {
  name: 'Trend',
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
