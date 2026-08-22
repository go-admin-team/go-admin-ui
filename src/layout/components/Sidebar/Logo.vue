<template>
  <div class="sidebar-logo-container" :class="{'collapse':collapse}" :style="{ backgroundColor: themeStyle === 'dark' ? variables.menuBg : variables.menuLightBg }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="showLogo" :src="appInfo.sys_app_logo" class="sidebar-logo" @error="showLogo = false">
        <!-- 折叠后仅 54px，完整应用名会被裁成半截文字，改用首字母作标记 -->
        <h1 v-else class="sidebar-title sidebar-title--mark" :title="appName" :style="{ color: titleColor }">{{ monogram }}</h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="showLogo" :src="appInfo.sys_app_logo" class="sidebar-logo" @error="showLogo = false">
        <h1 class="sidebar-title" :style="{ color: titleColor }">{{ appName }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script>

import variables from '@/styles/variables.module.scss'
import { mapState } from 'pinia'
import { useSystemStore } from '@/stores/system'
import { useSettingsStore } from '@/stores/settings'

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
    ...mapState(useSystemStore, { appInfo: 'info' }),
    ...mapState(useSettingsStore, ['themeStyle']),
    variables() {
      return variables
    },
    appName() {
      return (this.appInfo && this.appInfo.sys_app_name) || 'Go Admin'
    },
    titleColor() {
      return this.themeStyle === 'dark'
        ? variables.sidebarTitle
        : variables.sidebarLightTitle
    },
    monogram() {
      return this.appName.trim().charAt(0).toUpperCase()
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
.sidebarLogoFade-enter-active,
.sidebarLogoFade-leave-active {
  transition: opacity 0.28s ease;
}

.sidebarLogoFade-enter-from,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 64px;
  line-height: 64px;
  background: linear-gradient(135deg,
    color-mix(in oklab, var(--ga-brand), #000 45%) 0%,
    var(--ga-brand) 60%,
    var(--el-color-primary-light-3) 100%);
  text-align: center;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);

  & .sidebar-logo-link {
    // 绝对定位使折叠/展开两个链接在过渡期重叠而非互相挤压，
    // 否则同时存在时后者会被推出容器，造成 logo 错位、被裁切
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    padding: 0 12px;
    box-sizing: border-box;

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

    // 折叠态的单字标记：放大字号补偿信息量的缺失
    & .sidebar-title--mark {
      font-size: 22px;
      letter-spacing: 0;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0;
    }
  }
}
</style>
