<template>
  <!--
    Carries the child routes. It used to be a bare <router-view />, whose leaf
    pages fall outside keep-alive's reach: every visit to 登录日志 or 操作日志
    rebuilt the page, losing its filters and page position.
  -->
  <router-view-keep-alive />
</template>

<script setup lang="ts">
import RouterViewKeepAlive from '@/layout/components/RouterViewKeepAlive.vue'

// keep-alive matches `include` on the component name, and the list it is given
// holds route names from the backend menu
defineOptions({ name: 'Log' })
</script>
