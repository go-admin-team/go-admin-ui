<template>
  <!--
    带缓存的 router-view。

    keep-alive 的 include 按组件 name 匹配，而 cachedViews 里存的是叶子路由的
    name。若某一层只写裸 <router-view />，该层渲染出的是下一级组件，它自己不受
    keep-alive 管辖，叶子页每次进入都会重建 —— 二级菜单（Layout > 容器 > 叶子）
    的缓存正是这样失效的。

    因此凡是承载子路由的位置都应使用本组件，而非裸 router-view。
  -->
  <router-view v-slot="{ Component, route }">
    <transition :name="transition" mode="out-in">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </transition>
  </router-view>
</template>

<script>
import { mapState } from 'pinia'
import { useTagsViewStore } from '@/stores/tagsView'

export default {
  name: 'RouterViewKeepAlive',
  props: {
    // 容器层不需要再播一次过渡，否则同一次导航会叠加两段动画
    transition: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState(useTagsViewStore, ['cachedViews'])
  }
}
</script>
