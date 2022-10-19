<template>
  <div class="navbar">
    <div class="left-side" @click="onCollapse">
      <icon-menu-fold v-if="!props.collapsed" />
      <icon-menu-unfold v-else />
    </div>
    <ul class="right-side">
      <li>
        <a-button shape="circle" @click="handleDarkTheme">
          <template #icon>
            <component
              :is="!darkTheme ? IconSunFill : IconMoonFill"
            ></component>
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
import { ref } from 'vue';
import Avatar from '../../components/Avatar/index.vue';
import {
  IconMenuFold,
  IconMenuUnfold,
  IconSunFill,
  IconMoonFill,
} from '@arco-design/web-vue/es/icon';

const darkTheme = ref(false);

const props = defineProps({
  collapsed: Boolean,
});

const emit = defineEmits(['onCollapse']);

const onCollapse = () => {
  emit('onCollapse');
};

// 切换亮色和暗色
const handleDarkTheme = () => {
  const theme = document.body.getAttribute('arco-theme');
  if (!theme) {
    document.body.setAttribute('arco-theme', 'dark');
    darkTheme.value = true;
  } else {
    document.body.removeAttribute('arco-theme');
    darkTheme.value = false;
  }
};
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  height: 50px;
  border-bottom: 1px solid #e5e6eb;
  box-shadow: 0 2px 5px 0 rgba(0,0,0, .1);

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

  .right-side {
    list-style: none;
    display: flex;
    padding-right: 30px;

    & > li {
      display: flex;
      align-items: center;
      padding: 10px;
    }
  }
}
</style>