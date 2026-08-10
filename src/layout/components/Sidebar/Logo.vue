<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}" :style="{ backgroundColor: $store.state.settings.themeStyle === 'dark' ? variables.menuBg : variables.menuLightBg }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="showLogo" :src="appInfo.sys_app_logo" class="sidebar-logo" @error="showLogo = false">
        <h1 v-else class="sidebar-title" :style="{ color: $store.state.settings.themeStyle === 'dark' ? variables.sidebarTitle : variables.sidebarLightTitle }">{{ appInfo && appInfo.sys_app_name }} </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="showLogo" :src="appInfo.sys_app_logo" class="sidebar-logo" @error="showLogo = false">
        <h1 class="sidebar-title" :style="{ color: $store.state.settings.themeStyle === 'dark' ? variables.sidebarTitle : variables.sidebarLightTitle }">{{ appInfo && appInfo.sys_app_name }} </h1>
      </router-link>
    </transition>
  </div>
</template>

<script>

import variables from '@/styles/variables.scss'
import { mapGetters } from 'vuex'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return { showLogo: false }
  },
  computed: {
    ...mapGetters([
      'appInfo'
    ]),
    variables() {
      return variables
    }
  },
  watch: {
    appInfo: {
      immediate: true,
      handler(val) {
        this.showLogo = !!(val && val.sys_app_logo)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 64px;
  line-height: 64px;
  background: linear-gradient(135deg, #002c8c 0%, #1677ff 60%, #40a9ff 100%);
  text-align: center;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;

    & .sidebar-logo {
      width: 28px;
      height: 28px;
      vertical-align: middle;
      margin-right: 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      flex-shrink: 0;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0;
    }
  }
}
</style>
