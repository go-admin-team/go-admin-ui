<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <a-result
        status="404"
        subtitle="抱歉，页面走丢了~"
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