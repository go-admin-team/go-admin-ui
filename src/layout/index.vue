<template>
  <div :class="classObj" class="app-wrapper" :style="{'--current-color': theme}">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />
    <!-- The rail class resolves one set of --rail-* variables for everything
         inside it; see the sidebar rail block in styles/tokens.css. -->
    <sidebar class="sidebar-container" :class="`rail-${themeStyle}`" />
    <div :class="{hasTagsView:needTagsView}" class="main-container">
      <div :class="{'fixed-header':fixedHeader}">
        <navbar @open-settings="settingsOpen = true" />
        <!--
          Not rendered on a phone. Multiple open tabs is a desktop idea: closing
          one needs a pointer, and showing more than two needs horizontal room.
          Hidden with v-if rather than CSS because AppMain computes its own top
          padding from the same condition -- displaying none would leave the
          40px it reserved as a blank strip.
        -->
        <tags-view v-if="needTagsView && device !== 'mobile'" />
      </div>
      <app-main />
      <right-panel v-if="showSettings" v-model="settingsOpen">
        <settings />
      </right-panel>
    </div>
  </div>
</template>

<script>
import RightPanel from '@/components/RightPanel'
import { AppMain, Navbar, Settings, Sidebar, TagsView } from './components'
import ResizeMixin from './mixin/ResizeHandler'
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import variables from '@/styles/variables.module.scss'

export default {
  name: 'MainLayout',
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView
  },
  mixins: [ResizeMixin],
  data() {
    return {
      // Lives here because the navbar raises it and RightPanel renders it,
      // and the two are siblings.
      settingsOpen: false
    }
  },
  computed: {
    ...mapState(useAppStore, ['sidebar', 'device']),
    ...mapState(useSettingsStore, ['showSettings', 'fixedHeader', 'theme', 'themeStyle']),
    ...mapState(useSettingsStore, { needTagsView: 'tagsView' }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    },
    variables() {
      return variables
    }
  },
  methods: {
    handleClickOutside() {
      useAppStore().closeSideBar({ withoutAnimation: false })
    }
  }
}
</script>

<style lang="scss" scoped>
  @use "@/styles/mixin.scss" as *;
  @use "@/styles/variables.scss" as *;

  .app-wrapper {
    @include clearfix;
    position: relative;
    height: 100%;
    width: 100%;

    &.mobile.openSidebar {
      position: fixed;
      top: 0;
    }
  }

  .drawer-bg {
    background: #000;
    opacity: 0.3;
    width: 100%;
    top: 0;
    height: 100%;
    position: absolute;
    z-index: 999;
  }

  .fixed-header {
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9;
    width: calc(100% - #{$sideBarWidth});
    transition: width 0.28s;
  }

  .hideSidebar .fixed-header {
    width: calc(100% - 54px)
  }

  .mobile .fixed-header {
    width: 100%;
  }
</style>
