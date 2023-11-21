<template>
  <a-dropdown position="bl" :style="{ top: '52px' }">
    <a-space class="avatar">
      <a-avatar :size="32" :style="{ backgroundColor: '#3370ff' }">
        <img alt="avatar" :src="userInfo?.avatar" />
      </a-avatar>
      <a-typography-text bold>{{ userInfo?.name }}</a-typography-text>
    </a-space>
    <template #content>
      <a-doption @click="$router.push('/profile')">
        <template #icon>
          <icon-settings />
        </template>
        <template #default>个人设置</template>
      </a-doption>
      <a-doption @click="handleLogout">
        <template #icon>
          <icon-export />
        </template>
        <template #default>退出登录</template>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup>
import { getCurrentInstance } from 'vue';
import { storeToRefs } from 'pinia';
import { IconSettings, IconExport } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/store/userInfo';
import { usePermissionStore } from '@/store/permission'

const store = useUserStore();
const permissionStore = usePermissionStore();

const { userInfo } = storeToRefs(store);

const { proxy } = getCurrentInstance();

const handleLogout = () => {
  proxy.$modal.warning({
    title: '提示',
    content: '确定注销并退出登录系统吗？',
    hideCancel: false,
    onOk: () => {
      window.sessionStorage.clear();
      store.userLogout();
      permissionStore.ClearMenuList();
      proxy.$router.push('/login');
    },
  });
};
</script>

<style lang="scss" scoped>
.avatar {
  // padding: 0px 5px;
  // line-height: 50px;
  // text-align: center;
  // transition: all 0.3s ease-in-out;
  // cursor: pointer;
  // &:hover {
  //   background-color: #e5e5e5;
  // }
}
</style>
