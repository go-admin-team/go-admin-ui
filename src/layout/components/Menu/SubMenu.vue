<template>
  <template v-for="menu in props.menuList" :key="menu.menuId">
    <a-sub-menu
      v-if="menu.children && menu.menuType === 'M' && menu.visible === '0'"
      :key="menu.path"
    >
      <template #icon>
        <component :is="menu.icon" />
      </template>
      <template #title>{{ menu.title }}</template>
      <sub-menu :menuList="menu.children" />
    </a-sub-menu>
    <a-menu-item
      v-if="menu.menuType === 'C' && menu.visible && menu.visible === '0'"
      :key="menu.path"
      >{{ menu.title }}</a-menu-item>
  </template>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  menuList: {
    type: Array,
    default: () => [],
  },
});

// 判断是否路由需要带参匹配
const isRouteParams = computed(() => {
  return (path) => {
    if (path.indexOf(':') == -1) return true;
    return false;
  }
})
</script>
