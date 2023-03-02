<template>
  <a-menu
    class="menu"
    @menu-item-click="handleMenuClick"
    @collapse="handleMenuCollapse"
    :default-open-keys="['/admin']"
    :default-selected-keys="defaultSelectKeys"
    :auto-open-selected="true"
    show-collapse-button
  >
    <sub-menu :menu-list="permissionStore.menuList" />
  </a-menu>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/userInfo';
import { usePermissionStore } from '@/store/permission';

import SubMenu from './SubMenu.vue';

const store = useUserStore();
const permissionStore = usePermissionStore();
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();

// 默认菜单选中
const defaultSelectKeys = ref([]);

// 刷新保持菜单选中
const keepDefaultSelect = () => {
  defaultSelectKeys.value = [];
  defaultSelectKeys.value.push(route.fullPath);
};

const handleMenuClick = (key) => {
  router.push(key);
};
const emit = defineEmits(['collapse']);
const handleMenuCollapse = () => {
  emit('collapse');
}
onBeforeMount(() => {
  keepDefaultSelect();
});
</script>

<style lang="scss">
.arco-menu {
  height: calc(100vh - 60px);
      ::-webkit-scrollbar {
        width: 12px;
        height: 4px;
      }
      ::-webkit-scrollbar-thumb {
        border: 4px solid transparent;
        background-clip: padding-box;
        border-radius: 7px;
        background-color: var(--color-text-4);
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: var(--color-text-3);
      }
}
.arco-menu-indent {
  width: 30px;
}
</style>
