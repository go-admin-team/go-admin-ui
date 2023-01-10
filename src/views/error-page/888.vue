<template>
  <div class="app-container">
    <a-result
      subtitle="找不到组件地址，请检查菜单: 菜单管理 > 对应菜单 > 组件管理"
    >
      <template #extra>
      </template>
    </a-result>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: calc(100vh - 122px);
}
</style>