<template>
  <a-layout :style="{ height: '100vh' }">
    <a-layout-sider theme="dark" breakpoint="lg" :width="220" collapsible :collapsed="collapsed" @collapse="onCollapse">
      <Menu :collapsed="collapsed" />
    </a-layout-sider>
    <a-layout>
      <a-layout-header>
        <Navbar :collapsed="collapsed" @on-collapse="onCollapse" />
      </a-layout-header>
      <a-layout-content class="layout-content">
        <AppMain />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue';
import { AppMain, Navbar } from './components';
import Menu from './components/Menu/Menu.vue';

const collapsed = ref(false);
const onCollapse = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style lang="scss">
@import '../style/index.scss';
@import '../style/transition.scss';
@import '../style/dark-theme.scss';

.layout-content {
  padding: 16px;
  background-color: #f2f3f5;
}
</style>