<template>
  <template v-for="menu in props.menuList" :key="menu.menuId">
    <a-menu-item
        v-if="menu.menuType == 'C' && !menu.children && menu.visible === '0' && isRouteParams(menu.path)"
        :key="menu.path"
        >
        <template #icon v-if="menu.parentId === 0"><svg-raw :name="menu.icon"/></template>{{ menu.title }}
    </a-menu-item>
    <template v-else>
      <a-sub-menu
      v-if="menu.menuType == 'M' && menu.visible == 0"
      :key="menu.path"
    >
      <template #icon v-if="menu.parentId === 0"><svg-raw :name="menu.icon"/></template>
      <template #title>{{ menu.title }}</template>
      <sub-menu :menuList="menu.children" />
    </a-sub-menu>
    </template>
  </template>
</template>

<script setup>
import { computed } from 'vue';

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

<style lang="scss" scoped>
  svg {
    width: 16px;
    height: 16px;
    fill: var(--color-text-3);
  }
</style>
