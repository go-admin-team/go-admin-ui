<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
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
    </a-card>
  </div>
</template>