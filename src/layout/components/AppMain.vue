<template>
  <section class="app-main" :style="appMainStyle">
    <router-view-keep-alive transition="fade-transform" />
  </section>
</template>

<script>
import { mapState } from 'pinia'
import RouterViewKeepAlive from './RouterViewKeepAlive'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'

export default {
  name: 'AppMain',
  components: { RouterViewKeepAlive },
  computed: {
    ...mapState(useSettingsStore, ['fixedHeader', 'tagsView']),
    ...mapState(useAppStore, ['device']),
    appMainStyle() {
      if (!this.fixedHeader) return {}
      // Must agree with layout/index.vue on when the tab strip exists; the two
      // reading different conditions is what leaves a blank strip under the
      // navbar.
      const showsTags = this.tagsView && this.device !== 'mobile'
      const headerHeight = 50 + (showsTags ? 40 : 0)
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
