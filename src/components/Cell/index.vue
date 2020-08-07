<template>
  <div class="cell">
    <div class="cell-inner" :class=" border ? 'border' : '' ">
      <div class="cell-item">
        <div class="cell-item-label">
          <span v-if="label">
            {{ label }}
          </span>
          <span v-else><slot name="label" />
          </span></div>
        <div class="cell-item-value">
          <span v-if="value">
            {{ value }}
          </span>
          <span v-else>
            <slot name="value" />
          </span>
        </div>
      </div>
      <div class="cell-item mt5">
        <span v-if="extra">{{ extra }}</span>
        <span v-else><slot name="extra" /></span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Cell',
  props: {
    border: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    extra: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.cell-inner{
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  color: #323233;
  font-size: 14px;
  line-height: 24px;
  background-color: #fff;
  padding: 10px 0;

  .cell-item{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .cell-item-label{
    span{
      color: #323233;
      font-size: 14px;
      line-height: 24px;
    }
  }
  .cell-item-value{
    color: #969799;
  }
}

.border{
  position: relative;
  &::after{
    position: absolute;
    box-sizing: border-box;
    content: ' ';
    pointer-events: none;
    right: 0;
    bottom: 0;
    left: 0;
    border-bottom: 1px solid #e6ebf5;
  }
}
</style>
