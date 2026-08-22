<template>
  <div :class="{'has-logo':showLogo}">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="themeStyle === 'light' ? variables.menuLightBg : variables.menuBg"
        :text-color="themeStyle === 'light' ? 'rgba(0,0,0,.65)' : '#fff'"
        :active-text-color="theme"
        :unique-opened="true"
        :collapse-transition="true"
        :router="true"
        mode="vertical"
      >
        <sidebar-item
          v-for="(route) in sidebarRouters"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />

      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.module.scss'

export default {
  components: { SidebarItem, Logo },
  computed: {
    ...mapState(usePermissionStore, ['sidebarRouters']),
    ...mapState(useAppStore, ['sidebar']),
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    ...mapState(useSettingsStore, ['theme', 'themeStyle']),
    ...mapState(useSettingsStore, { showLogo: 'sidebarLogo' }),
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  mounted() {

  },
  methods: {

  }
}
</script>
