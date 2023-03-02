<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <img
          alt="logo"
          :src="store.sysConfig.sys_app_logo"
          class="logo"
        />
        <a-typography-title
          :style="{ margin: 0, fontSize: '18px' }"
          :heading="5"
        >
        {{store.sysConfig.sys_app_name}}
        </a-typography-title>
      </a-space>
    </div>
    <ul class="right-side">
      <li>
        <a-button
          class="nav-btn"
          type="outline"
          :shape="'circle'"
          @click="handleToggleTheme"
        >
          <template #icon>
            <icon-moon-fill v-if="!isDark" />
            <icon-sun-fill v-else />
          </template>
        </a-button>
      </li>
      <li>
        <Avatar />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useUserStore } from '@/store/userInfo';
import Avatar from './Avatar/index.vue';
import {useDark, useToggle } from '@vueuse/core';

const store = useUserStore();
const isDark = useDark({
  selector: 'body',
  attribute: 'arco-theme',
  valueDark: 'dark',
  valueLight: 'light',
  storageKey: 'arco-theme'
});
const toggleTheme = useToggle(isDark);
const handleToggleTheme= () => {
  toggleTheme();
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  height: 100%;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-2);
  .left-side {
    display: flex;
    height:60px;
    align-items: center;
    padding-left: 20px;
    .logo {
      width:40px;
      height:40px;
    }
  }
  .right-side {
    list-style: none;
    display: flex;
    padding-right: 30px;

    & > li {
      display: flex;
      align-items: center;
      padding: 10px;
    }
    .nav-btn {
      border-color: rgb(var(--gray-2));
      color: rgb(var(--gray-8));
      font-size: 16px;
    }
  }
}
</style>