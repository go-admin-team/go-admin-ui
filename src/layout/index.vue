<template>
  <a-layout :style="{ height: '100vh' }">
    <a-layout-header class="layout-header">
      <Navbar />
    </a-layout-header>
    <a-layout>
      <a-layout-sider breakpoint="lg" :hide-trigger="true" :width="220" collapsible :collapsed="collapsed"  class="layout-sider">
        <Menu @collapse="onCollapse"/>
      </a-layout-sider>
      <a-layout-content class="layout-content" :style="layoutContentStyle">
        <AppMain />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { watch, reactive, ref } from 'vue';
import { AppMain, Navbar } from './components';
import Menu from './components/Menu/Menu.vue';

const collapsed = ref(false);
const layoutContentStyle = reactive({
  'padding-left': '220px'
});
const onCollapse = () => {
  collapsed.value = !collapsed.value;
};
watch(collapsed, (value) => {
  layoutContentStyle['padding-left'] = value ? '48px' : '220px';
});
</script>

<style lang="scss">
@import '../style/index.scss';
@import '../style/transition.scss';
.layout-header {
  position: fixed;
  width:100%;
  top:0;
  left:0;
  z-index: 100;
  height: 60px;
}
.layout-sider {
  position: fixed;
  top:0;
  left:0;
  z-index: 90;
  padding-top: 60px;
  height:100vh;
  &:after {
    position: absolute;
    top: 0;
    right: -1px;
    display: block;
    width: 1px;
    height: 100%;
    background-color: var(--color-border);
    content: ""
  }
}
.layout-content {
  min-height: calc(100vh - 60px);
  overflow-y: auto;
  padding-top:60px;
  background-color: var(--color-fill-2);
  transition: padding-left 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
}
</style>