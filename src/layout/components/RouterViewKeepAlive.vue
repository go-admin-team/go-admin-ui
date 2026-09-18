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
        <component :is="Component" :key="viewKey(Component, route)" />
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
  },
  methods: {
    /**
     * The key for the component THIS router-view renders.
     *
     * A two-level menu (Layout > container > leaf) stacks two of these, and
     * they render different things: the outer one renders the container, the
     * inner one the leaf. Keying both on route.path gave the container a key
     * that changed whenever its children swapped, so moving between two leaves
     * of the same container tore the container down and rebuilt it -- and under
     * `mode="out-in"` that navigation never finished: the old page stayed on
     * screen while the url, the sidebar and the breadcrumb had already moved on,
     * with no error anywhere. The seed menu has exactly one directory nested in
     * another (Log, holding sys-login-log and sys-oper-log), which is why those
     * two pages were the only ones that froze.
     *
     * So a container is keyed on its own record's path, which does not change
     * while its children swap. The leaf keeps the resolved path: two ids of one
     * parameterised route (/admin/dict/data/:dictId) are two pages and must not
     * share a cached instance.
     */
    viewKey(Component, route) {
      const type = Component && Component.type
      const matched = route.matched
      const index = matched.findIndex(record => record.components && record.components.default === type)
      if (index === -1 || index === matched.length - 1) return route.path
      return matched[index].path
    }
  }
}
</script>
