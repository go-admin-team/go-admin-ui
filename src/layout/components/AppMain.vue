<template>
  <section class="app-main" :style="appMainStyle">
    <router-view-keep-alive transition="fade-transform" />
  </section>
</template>

<script>
import { mapState } from 'pinia'
import RouterViewKeepAlive from './RouterViewKeepAlive'
import { useSettingsStore } from '@/stores/settings'

export default {
  name: 'AppMain',
  components: { RouterViewKeepAlive },
  computed: {
    ...mapState(useSettingsStore, ['fixedHeader', 'tagsView']),
    appMainStyle() {
      if (!this.fixedHeader) return {}
      const headerHeight = 50 + (this.tagsView ? 40 : 0)
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
  background-color: var(--ga-bg-body);
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
