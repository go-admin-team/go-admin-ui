<template>
  <div class="app-not-installed">
    <el-empty :image-size="80" :description="$t('common.appNotInstalled')" />
  </div>
</template>

<script setup lang="ts">
/**
 * Stand-in for a menu's page when this build has no component for it.
 *
 * Returned by loadView in stores/permission.ts instead of throwing: an app
 * whose backend half is installed (so the menu row exists) but whose frontend
 * half was never synced in, or a menu row left behind after an uninstall.
 * loadView logs the path it could not resolve; this carries the on-screen half
 * of the same message, because a visitor cannot read the console.
 */
defineOptions({ name: 'AppNotInstalled' })
</script>

<style scoped>
.app-not-installed {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
</style>
