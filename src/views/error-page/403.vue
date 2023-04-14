<template>
  <div class="app-container">
    <a-result
      status="403"
      subtitle="对不起，您没有访问该资源的权限"
    >
      <template #extra>
        <a-space>
          <a-button type="primary">
            返回
          </a-button>
        </a-space>
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