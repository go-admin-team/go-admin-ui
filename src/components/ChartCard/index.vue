<template>
  <div class="chart-card-wrap" :style="{ '--kpi-color': color }">
    <el-card :loading="loading" :body-style="{ padding: '20px 24px 8px' }" :bordered="false">
      <div v-if="$slots.icon" class="kpi-icon-bg">
        <slot name="icon" />
      </div>
      <div class="chart-card-header">
        <div class="meta">
          <span class="chart-card-title">
            <slot name="title">{{ title }}</slot>
          </span>
          <span class="chart-card-action">
            <slot name="action" />
          </span>
        </div>
        <div class="total">
          <slot name="total">
            <span>{{ typeof total === 'function' && total() || total }}</span>
          </slot>
        </div>
      </div>
      <div class="chart-card-content">
        <div class="content-fix">
          <slot />
        </div>
      </div>
      <div class="chart-card-footer">
        <div class="field">
          <slot name="footer" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ChartCard',
  props: {
    title: { type: String, default: '' },
    total: { type: [Function, Number, String], required: false, default: null },
    loading: { type: Boolean, default: false },
    color: { type: String, default: '#1677ff' }
  }
}
</script>

<style lang="scss" scoped>
.chart-card-wrap {
  position: relative;
  border-radius: 8px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: var(--kpi-color, #1677ff);
    z-index: 1;
    border-radius: 4px 0 0 4px;
  }

  :deep(.el-card) {
    border-left: none !important;
    border-radius: 0 8px 8px 0;
  }
}

.kpi-icon-bg {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 56px;
  opacity: 0.1;
  color: var(--kpi-color, #1677ff);
  line-height: 1;
  pointer-events: none;
  z-index: 0;
}

.chart-card-header {
  position: relative;
  overflow: hidden;
  width: 100%;

  .meta {
    position: relative;
    overflow: hidden;
    width: 100%;
    color: rgba(0, 0, 0, .45);
    font-size: 14px;
    line-height: 22px;
  }
}

.chart-card-action {
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
}

.chart-card-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 9px;
  margin-top: 8px;

  > * { position: relative; }

  .field {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    color: rgba(0, 0, 0, .65);
    font-size: 14px;
  }
}

.chart-card-content {
  margin-bottom: 12px;
  position: relative;
  height: 46px;
  width: 100%;

  .content-fix {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
  }
}

.total {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.85);
  margin-top: 4px;
  margin-bottom: 0;
  font-size: 28px;
  line-height: 38px;
  height: 38px;
  font-weight: 600;
}
</style>
