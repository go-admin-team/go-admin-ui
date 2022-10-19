<template>
  <div class="app-container">
    <a-tabs default-active-key="1" position="left" :style="{ textAlign: 'right' }">
      <a-tab-pane key="1" title="系统内置">
        <a-form :model="form" :style="{ width: '50%' }">
          <a-form-item field="sys_app_name" label="系统名称">
            <a-input v-model="form.sys_app_name"></a-input>
          </a-form-item>
          <a-form-item field="sys_app_logo" label="系统Logo">
            <a-space>
              <div class="upload-logo-preview">
                <img width="150" height="150" />
              </div>
              <a-upload action="/">
                <template #upload-button>
                  <div class="upload-logo-card">
                    <div class="upload-logo-card-text">
                      <IconPlus />
                    </div>
                  </div>
                </template>
              </a-upload>
            </a-space>
          </a-form-item>
          <a-form-item field="sys_user_initPassword" label="初始密码">
            <a-input-password v-model="form.sys_user_initPassword"></a-input-password>
          </a-form-item>
          <a-form-item field="sys_index_skinName" label="皮肤样式">
            <a-select v-model="form.sys_index_skinName">
              <a-option>蓝色</a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="sys_index_sideTheme" label="侧边栏主题">
            <a-select v-model="form.sys_index_sideTheme">
              <a-option>深色主题</a-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary">提交</a-button>
              <a-button>重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="2" title="其它">暂无内容</a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { IconPlus } from '@arco-design/web-vue/es/icon'

const form = reactive({});
</script>

<style lang="scss">
.upload-logo-preview {
  font-size: 0px;
}

.upload-logo-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  box-sizing: border-box;
  border: 1px dashed #c0ccda;
  border-radius: 5px;
  color: #4e5969;
  &-text {
    font-size: 24px;
  }
}
</style>
