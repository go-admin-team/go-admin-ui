<template>
  <div class="app-container">
    <a-result
      status="500"
      subtitle="抱歉，服务器出了点问题～"
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