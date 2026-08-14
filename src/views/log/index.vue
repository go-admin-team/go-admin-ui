<template>
  <!--
    承载子路由的容器。此前是裸 <router-view />，其渲染出的叶子页不受任何
    keep-alive 管辖，导致「日志管理」下的登录日志、操作日志每次进入都被重建，
    搜索条件与分页位置全部丢失。
  -->
  <router-view-keep-alive />
</template>

<script>
import RouterViewKeepAlive from '@/layout/components/RouterViewKeepAlive'

export default {
  name: 'Log',
  components: { RouterViewKeepAlive }
}
</script>
