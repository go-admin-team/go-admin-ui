<template>
  <section class="app-main" :style="appMainStyle">
    <!-- Vue Router 4 起 router-view 不能直接置于 transition / keep-alive 内：
         keep-alive 收到的子节点是 RouterView 组件本身而非页面组件，include
         按组件名匹配因而永不命中，缓存实际处于失效状态。改用 v-slot 取出已
         匹配的组件再交给 keep-alive。 -->
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
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
