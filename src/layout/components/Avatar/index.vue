<template>
  <a-dropdown position="bl" :style="{ top: '52px' }">
    <div class="avatar-container">
      <a-avatar :size="32" :style="{ backgroundColor: '#fff' }">
        <img alt="avatar" :src="userAvatarURL" />
      </a-avatar>
      <div class="user-info">
        <div class="user-info-name">{{ userInfo.name }}</div>
        <!-- <div class="user-info-desc">{{ userInfo.introduction }}</div> -->
      </div>
    </div>
    <template #content>
      <a-doption @click="$router.push('/profile')">
        <template #icon>
          <icon-settings />
        </template>
        <template #default>用户设置</template>
      </a-doption>
      <a-doption @click="handleLogout()">
        <template #icon>
          <icon-export />
        </template>
        <template #default>退出登陆</template>
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup>
import { getCurrentInstance, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/userInfo';
import { clearLocalStorage } from '@/utils/storage';
import { useGlobalProperties } from '@/hooks/globalVar';

const store = useUserStore();
const { userInfo } = storeToRefs(store);
const { proxy } = getCurrentInstance();
const globalProperties = useGlobalProperties();
const userAvatarURL = computed(() => `${globalProperties.CDNDomain}/${store.userInfo.avatar}`);

const handleLogout = () => {
  proxy.$modal.warning({
    title: '提示',
    content: '确定注销并退出登陆系统吗？',
    hideCancel: false,
    onOk: () => {
      store.userLogout();
      clearLocalStorage();
      proxy.$router.push('/login');
    },
  });
};
</script>

<style lang="scss" scoped>
.avatar-container {
  display: flex;
  cursor: pointer;
  .user-info {
    margin-left: 10px;
    &-name {
      color: var(--color-text-1);
      font-weight: 700;
      padding-top: 8px;
    }
    &-desc {
      color: var(--color-text-1);
      font-size: 12px;
      line-height: 1.4;
    }
  }
}
</style>