<template>
  <div :class="{'has-logo':showLogo}">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <!-- No background-color or text-color props: Element Plus turns those
           into inline styles that the stylesheet then has to out-!important,
           which is how the light rail came to render white text on white.
           Colours come from the --rail-* variables instead, resolved by the
           rail class the layout puts on the container. -->
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
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
