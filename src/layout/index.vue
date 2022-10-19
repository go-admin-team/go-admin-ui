<template>
  <a-layout :style="{ height: '100vh' }">
    <a-layout-sider
      class="layout-sider"
      :width="250"
      :collapsed-width="50"
      :collapsed="collapsed"
    >
      <Menu :collapsed="collapsed" />
    </a-layout-sider>
    <a-layout :class="[ collapsed ? 'fold' : 'unfold' ]">
      <a-layout-header :class="[ 'layout-header', collapsed ? 'fold' : 'unfold' ]">
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
import Menu from '../components/Menu/Menu.vue';

const collapsed = ref(false);
const onCollapse = () => {
  collapsed.value = !collapsed.value;
};
</script>

<style lang="scss">
@import '../style/index.scss';
@import '../style/transition.scss';
@import '../style/dark-theme.scss';

.layout-sider {
  width: 250px;
  position: fixed;
  top: 0px;
  left: 0px;
  bottom: 0px;
  z-index: 999;
}

.fold {
  margin-left: 50px;
}

.unfold {
  margin-left: 250px;
}

.layout-content {
  margin-top: 50px;
  padding: 20px;
  background-color: #f2f3f5;
}

.layout-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 998;
  transition: margin .1s ease-in-out;
}
</style>
