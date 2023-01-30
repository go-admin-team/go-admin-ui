<template>
  <div class="sider-logo">
    <img :src="store.sysConfig.sys_app_logo" />
    <span class="sider-title" v-if="!props.collapsed">{{store.sysConfig.sys_app_name}}</span>
  </div>
  <a-menu
    class="menu"
    @menu-item-click="handleMenuClick"
    :default-open-keys="['/admin']"
    :default-selected-keys="defaultSelectKeys"
    :auto-open-selected="true"
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

onBeforeMount(() => {
  keepDefaultSelect();
});
</script>

<style lang="scss" scoped>
.sider-logo {
  margin: 10px 0;
  display: flex;
  justify-content: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-text-4);
  & img {
    height: 32px;
  }
}

.sider-title {
  margin-left: 10px;
  display: flex;
  align-items: center;
  font-size: 16px;
  color: var(--color-text-4);
}

.left-side {
  height: 50px;
  width: 50px;
  font-size: 18px;
  line-height: 50px;
  text-align: center;
  transition: all 0.3s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: #e5e5e5;
  }
}
</style>

<style lang="scss">
.arco-menu-indent {
  width: 30px;
}
</style>
