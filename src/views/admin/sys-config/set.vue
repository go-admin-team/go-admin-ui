<template>
  <div class="app-container">
    <a-card :bordered="false" class="general-card">
      <a-tabs default-active-key="1" type="rounded" >
        <a-tab-pane key="1" title="系统内置">
          <a-form :model="setConfForm" :rules="setConfFormRule" ref="queryFormRef" :style="{ width: '50%' }">
            <a-form-item field="sys_app_name" label="系统名称">
              <a-input v-model="setConfForm.sys_app_name" placeholder="请输入系统名称"></a-input>
            </a-form-item>
            <a-form-item field="sys_app_logo" label="系统Logo">
              <a-space>
                <div class="upload-logo-preview" v-if="setConfForm.sys_app_logo">
                  <img :src="setConfForm.sys_app_logo"/>
                </div>
                <a-upload 
                  :action="sysLogoUploadURL" 
                  :show-file-list = "false"
                  @success="handlelogoUploadSuccess"
                  :headers="sysLogoUploadHeaders">
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
              <a-input-password v-model="setConfForm.sys_user_initPassword" placeholder="请输入初始密码"></a-input-password>
            </a-form-item>
            <a-form-item field="sys_index_skinName" label="皮肤样式">
              <a-select v-model="setConfForm.sys_index_skinName" placeholder="请选择皮肤样式">
                <a-option v-for="(item, index) in sysSkinName" :key="index" :label="item.label" :value="item.value"></a-option>
              </a-select>
            </a-form-item>
            <a-form-item field="sys_index_sideTheme" label="侧边栏主题">
              <a-select v-model="setConfForm.sys_index_sideTheme" placeholder="请选择侧边栏主题">
                <a-option v-for="(item, index) in sysThemeName" :key="index" :label="item.label" :value="item.value"></a-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-space>
                <a-button @click="handleSubmitQuery" type="primary">提交</a-button>
                <a-button @click="handleResetQuery"><icon-loop />重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="2" title="其它">暂无内容</a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup>
import { getCurrentInstance, onMounted, reactive } from 'vue';
import { getSetConfig, updateSetConfig } from '@/api/admin/sys-set';
import { useUserStore } from '@/store/userInfo'

const setConfForm = reactive({
  sys_app_logo: '',
  sys_app_name: '',
  sys_index_sideTheme: '',
  sys_index_skinName: '',
  sys_user_initPassword: ''
});

const setConfFormRule = {
  sys_app_name: [{
    required: true,
    message: '请输入系统名称',
    trigger: 'blur'
  }],
  sys_user_initPassword: [{
    required: true,
    message: '请输入初始密码',
    trigger: 'blur'
  }],
  sys_index_skinName: [{
    required: true,
    message: '请选择皮肤样式',
    trigger: 'change'
  }],
  sys_index_sideTheme: [{
    required: true,
    message: '请选择侧栏主题',
    trigger: 'change'
  }]
 };
const sysLogoUploadURL = `${import.meta.env.VITE_APP_BASE_URL}/api/v1/public/uploadFile`;

const store = useUserStore();

const sysLogoUploadHeaders = {
  Authorization: `Bearer ${store.token}`
}

const sysSkinName = [{
  label: '蓝色',
  value: 'skin-blue'
}];

const sysThemeName = [{
  label: '深色主题',
  value: 'theme-dark'
}];

const { proxy } = getCurrentInstance();

const createSubmitData = (data) => {
  const list = [];
  for(let key in data) {
    list.push({
      configKey: key,
      configValue: data[key]
    });
  }
  return list;
}

const handleSubmitQuery = () => {
  proxy.$refs.queryFormRef.validate(async (err) => {
    if (err) {
      proxy.$message.error('表单校验失败');
    } else {
      try {
        await updateSetConf();
      } catch (error) {
        console.error(error);
      }
    }
  });
}

const updateSetConf= async () => {
  const res = await updateSetConfig(createSubmitData(setConfForm));
  const { code, msg } = res;
  if(code === 200) {
    proxy.$message.success(msg);
    store.updateSysConfig({
      sys_app_logo: setConfForm.sys_app_logo,
      sys_app_name: setConfForm.sys_app_name
    });
  } else {
    proxy.$message.error(msg);
  }
}
const handleResetQuery = () => {
  proxy.$refs.queryFormRef.resetFields();
}
const getSetConf = async () => {
  const setConf = await getSetConfig();
  Object.assign(setConfForm, setConf.data);
}

const handlelogoUploadSuccess = (data) => {
  const { response : {
    code,
    msg
  }} = data;
  if(code === 200) {
    proxy.$message.success(msg);
    const { response : {
    data: {
      full_path
    }
  }} = data;
    setConfForm.sys_app_logo = full_path;
  } else {
    proxy.$message.error(msg);
  }
}
onMounted(() => {
  getSetConf();
});
</script>

<style lang="scss" scoped>
.upload-logo-preview {
  width:64px;
  height:64px;
  font-size: 0px;
  border-radius:5px;
  border:1px dashed #c0ccda;
  box-sizing: border-box;
  img {
    width:60px;
    height:60px;
    border-radius: 5px;
  }
}

.upload-logo-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  box-sizing: border-box;
  border: 1px dashed #c0ccda;
  border-radius: 5px;
  color: #4e5969;
  &-text {
    font-size: 24px;
  }
}
</style>
