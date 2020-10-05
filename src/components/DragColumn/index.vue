<template>
  <div>
    <div class="layout">
      <div class="layout-left" :style="{ width: leftWidth }">
        <slot name="left" />
      </div>
      <div ref="drag" class="layout-drag" :style="{ left: leftWidth }" @mousedown="handleDown">
        <span class="line" />
        <span class="line" />
        <span class="line" />
        <span class="line" />
        <span class="line" />
        <span class="line" />
      </div>
      <div class="layout-right" :style="{ width: rightWidth }">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DragColumn',
  data() {
    return {
      disX: 0,
      layoutWidth: 0,
      dragWidth: 0,
      leftWidth: 0,
      rightWidth: 0
    }
  },
  mounted() {
    this.layoutWidth = document.querySelector('.layout').clientWidth
    this.dragWidth = document.querySelector('.layout-drag').clientWidth
    this.leftWidth = (0.165 * this.layoutWidth) + 'px'
    this.rightWidth = (0.825 * this.layoutWidth) + 'px'
    window.onresize = () => {
      this.layoutWidth = document.querySelector('.layout').clientWidth
      this.dragWidth = document.querySelector('.layout-drag').clientWidth
      this.leftWidth = (0.165 * this.layoutWidth) + 'px'
      this.rightWidth = (0.825 * this.layoutWidth) + 'px'
    }
  },
  methods: {
    handleDown(e) {
      const ev = e || event
      const pos = this.getPos(ev)
      const drag = this.$refs.drag
      this.disX = pos.x - drag.offsetLeft
      document.onmousemove = moveEvent => {
        const oEvent = moveEvent || event
        const movePos = this.getPos(oEvent)
        const t = movePos.x - this.disX
        const surplusWidth = this.layoutWidth - this.dragWidth - t
        const leftWidth = this.layoutWidth - this.dragWidth - surplusWidth
        if (leftWidth < 260) {
          return false
        } else if (surplusWidth < 260) {
          return false
        }
        this.leftWidth = leftWidth + 'px'
        this.rightWidth = surplusWidth + 'px'
      }
      document.onmouseup = () => {
        document.onmousemove = null
        document.onmouseup = null
      }
      return false
    },
    getPos(ev) {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
      return { x: ev.clientX + scrollLeft, y: ev.clientY + scrollTop }
    }
  }
}
</script>

<style lang="scss" scoped>
.layout {
  height: calc(100vh - 113px);
  position: relative;
  .layout-left {
    width: 25.5%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
  }
  .layout-drag {
    width: 1%;
    position: absolute;
    height: 100%;
    top: 0;
    bottom: 0;
    left: 25.5%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    cursor: col-resize;
    &:active{
      .line{
        transition: all 0.3s ease-in-out;
        background: #0f82ff;
        width: 3.5px;
        height: 3.5px;
        border-radius: 50%;
      }
    }
    .line {
      display: inline-block;
      width: 2px;
      height: 2px;
      background: #898989;
      margin-bottom: 5px;
      border-radius: 50%;
    }
  }
  .layout-right {
    width: 73.5%;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
  }
}
.focus{
  .line{
    color: red;
  }
}
</style>
