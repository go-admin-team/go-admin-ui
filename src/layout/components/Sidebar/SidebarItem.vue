<template>
  <div v-if="!item.hidden" class="menu-wrapper">
    <template v-if="hasOneShowingChild(item.children,item) && (!onlyOneChild.children||onlyOneChild.noShowingChildren)&&!item.alwaysShow">
      <!-- 图标放默认插槽、标题放 title 插槽，这是 Element Plus 折叠菜单的契约：
           折叠时它据此隐藏文字并改用 tooltip 呈现；两者若同处一个插槽，文字不会
           被隐藏，只会被 54px 的侧边栏裁掉半截 -->
      <!-- el-menu 开启了 :router，index 会被直接交给 router.push；外链地址不在
           路由表中，导航必然失败，因此外链改由 a 标签承载，不参与路由 -->
      <a
        v-if="onlyOneChild.meta && isExternalLink(resolvePath(onlyOneChild.path))"
        :href="resolvePath(onlyOneChild.path)"
        target="_blank"
        rel="noopener noreferrer"
        class="sidebar-external-link"
      >
        <el-menu-item :index="resolvePath(onlyOneChild.path)" :class="{'submenu-title-noDropdown':!isNest}">
          <svg-icon v-if="menuIcon(onlyOneChild)" :icon-class="menuIcon(onlyOneChild)" />
          <template #title>{{ onlyOneChild.meta.title }}</template>
        </el-menu-item>
      </a>
      <el-menu-item v-else-if="onlyOneChild.meta" :index="resolvePath(onlyOneChild.path)" :class="{'submenu-title-noDropdown':!isNest}">
        <svg-icon v-if="menuIcon(onlyOneChild)" :icon-class="menuIcon(onlyOneChild)" />
        <template #title>{{ onlyOneChild.meta.title }}</template>
      </el-menu-item>
    </template>

    <el-sub-menu v-else ref="subMenu" :index="resolvePath(item.path)" :style="{ backgroundColor: '#000c17' }">
      <template #title>
        <!-- 官方折叠样式选择器为 .el-menu--collapse > .el-sub-menu > .el-sub-menu__title > span，
             span 必须是直接子元素，中间不能再包一层容器 -->
        <template v-if="item.meta">
          <svg-icon v-if="item.meta.icon" :icon-class="item.meta.icon" />
          <span>{{ item.meta.title }}</span>
        </template>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script>
import path from 'path'
import { isExternal } from '@/utils/validate'
import FixiOSBug from './FixiOSBug'

export default {
  name: 'SidebarItem',
  mixins: [FixiOSBug],
  props: {
    // route object
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    }
  },
  data() {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    this.onlyOneChild = null
    return {}
  },
  methods: {
    // 子路由未单独配图标时回退到父级，与原 Item 组件的取值一致
    menuIcon(child) {
      return (child.meta && child.meta.icon) || (this.item.meta && this.item.meta.icon)
    },
    isExternalLink(path) {
      return isExternal(path)
    },
    hasOneShowingChild(children = [], parent) {
      const showingChildren = children.filter(item => {
        if (item.hidden) {
          return false
        } else {
          // Temp set(will be used if only has one showing child)
          this.onlyOneChild = item
          return true
        }
      })

      // When there is only one child router, the child router is displayed by default
      if (showingChildren.length === 1) {
        return true
      }

      // Show parent if there are no child router to display
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ... parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    },
    resolvePath(routePath) {
      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }
      return path.resolve(this.basePath, routePath)
    }
  }
}
</script>
