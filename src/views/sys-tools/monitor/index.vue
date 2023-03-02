<template>
  <div class="card-wrapper">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-card title="服务器信息" :bordered="false" class="general-card">
          <div class="card-item card-item-server">
            <span class="card-item-title">主机名称</span>
            <span class="card-item-desc">{{ SystemInfo?.os?.hostName}}</span>
          </div>
          <div class="card-item card-item-server">
            <span class="card-item-title">操作系统</span>
            <span class="card-item-desc">{{ SystemInfo?.os?.goOs }}</span>
          </div>
          <div class="card-item card-item-server">
            <span class="card-item-title">服务器IP</span>
            <span class="card-item-desc">{{ SystemInfo?.os?.ip }}</span>
          </div>
          <div class="card-item card-item-server">
            <span class="card-item-title">系统架构</span>
            <span class="card-item-desc">{{ SystemInfo?.os?.arch }}</span>
          </div>
          <div class="card-item card-item-server">
            <span class="card-item-title">CPU</span>
            <span class="card-item-desc">{{ SystemInfo?.cpu?.cpuInfo[0]?.modelName }}</span>
          </div>
          <div class="card-item card-item-server">
            <span class="card-item-title">当前时间</span>
            <span class="card-item-desc">{{ SystemInfo?.os?.time }}</span>
          </div>
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card :title="SystemInfo.location" :bordered="false" class="general-card">
          <a-row :gutter="12">
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">系统</span>
                <span class="card-item-desc">Linux</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">时间</span>
                <span class="card-item-desc">2022-05-06 15:32:22</span>
              </div>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">内存</span>
                <span class="card-item-desc">129MB/2349MB</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">在线时间</span>
                <span class="card-item-desc">{{ SystemInfo.bootTime }}分钟</span>
              </div>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">交换</span>
                <span class="card-item-desc">0/0</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">硬盘</span>
                <span class="card-item-desc">{{ SystemInfo?.disk?.used }}GB/{{ SystemInfo?.disk?.total }}GB</span>
              </div>
            </a-col>
          </a-row>
          <a-row :gutter="12">
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">下载</span>
                <span class="card-item-desc">{{ SystemInfo?.net?.in }}KB</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div class="card-item">
                <span class="card-item-title">上传</span>
                <span class="card-item-desc">{{ SystemInfo?.net?.out }}KB</span>
              </div>
            </a-col>
          </a-row>

          <!-- progress -->
          <div class="progress-wrapper">
            <span class="progress-title">CPU</span>
            <a-progress status="success" :percent="SystemInfo?.cpu?.percent / 100" />
          </div>
          <div class="progress-wrapper">
            <span class="progress-title">RAM</span>
            <a-progress status="warning" :percent="SystemInfo?.mem?.percent / 100" />
          </div>
          <div class="progress-wrapper">
            <span class="progress-title">硬盘</span>
            <a-progress :percent="SystemInfo?.disk?.percent / 100" />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { getServerMonitor } from '@/api/sys-tools/monitor';


const SystemInfo = reactive({});

const getServerMonitorInfo = async () => {
  const res = await getServerMonitor();

  Object.assign(SystemInfo, res)
}

onMounted(() => {
  getServerMonitorInfo();
});
</script>

<style lang="scss" scoped>
.card-wrapper {
  width: 100%;
  padding: 20px;
}

.card-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid rgb(229, 230, 235);
  &-title {
    color: $primary-font-color;
  }
  &-desc {
    color: $secondary-font-color;
  }
}

.card-item-server:last-child {
  border-bottom: none;
}

.progress-wrapper {
  margin-top: 15px;
  display: flex;
  .progress-title {
    font-weight: bold;
    margin-right: 10px;
    width: 50px;
  }
}
</style>
