<template>
  <section class="app-main" :style="appMainStyle">
    <router-view-keep-alive transition="fade-transform" />
  </section>
</template>

<script>
import RouterViewKeepAlive from './RouterViewKeepAlive'

export default {
  name: 'AppMain',
  components: { RouterViewKeepAlive },
  computed: {
    appMainStyle() {
      if (!this.$store.state.settings.fixedHeader) return {}
      const headerHeight = 50 + (this.$store.state.settings.tagsView ? 40 : 0)
      return { paddingTop: headerHeight + 'px' }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f0f2f5;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
