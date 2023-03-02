<template>
  <a-row :gutter="16" class="dict-wrapper">
    <a-col :span="12">
      <a-card :bordered="false" class="general-card">
        <div style="text-align: center;">
          <a-space direction="vertical" fill>
            <a-avatar :size="120" @click="handleModifyAvatar" class="user-avatar" title="点击修改头像">
                <img alt="avatar" :src="userAvatarURL"/>
            </a-avatar>
            <Cropper
              :visible="CropperOpt.visible"
              title="修改我的头像"
              :width="500"
              :originImageURL="userAvatarURL"
              @confirm="handleModifyAvatarConfirm"
              @cancel="handleModifyAvatarCancel"
            ></Cropper>
            <a-typography-title :heading="6">{{userInfoForm.user.nickName}}</a-typography-title>
          </a-space>
        </div>
        <a-divider />
        <a-card :bordered="false" class="general-card">
          <a-descriptions title="用户详情" :column="1">
            <a-descriptions-item label="用户昵称">{{userInfoForm.user.nickName}}</a-descriptions-item>
            <a-descriptions-item label="登录账号">{{userInfoForm.user.username}}</a-descriptions-item>
            <a-descriptions-item label="用户手机">{{userInfoForm.user.phone}}</a-descriptions-item>
            <a-descriptions-item label="用户邮箱">{{userInfoForm.user.email}}</a-descriptions-item>
            <a-descriptions-item label="用户性别">
              <template v-if="userInfoForm.user.sex == '0' "><a-tag color="arcoblue">男</a-tag></template>
              <template v-else-if="userInfoForm.user.sex == '1' "><a-tag color="pinkpurple">女</a-tag></template>
              <template v-else><a-tag color="gold">中性</a-tag></template>
            </a-descriptions-item>
            <a-descriptions-item label="所属部门" v-for="item of userInfoForm.posts" >
              <a-tag>{{ item.postName }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="用户角色" v-for="item of userInfoForm.roles" >
              <a-tag>{{ item.roleName }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-card>
    </a-col>
    <a-col :span="12">
      <a-card :bordered="false" class="general-card">
        <a-tabs>
          <a-tab-pane key="1">
            <template #title>
              <icon-exclamation-circle /> 基础信息
            </template>
            <a-card hoverable :bordered="false">
              <a-form :model="modalForm" :rules="rules" ref="modalFormRef" label-align="left" auto-label-width>
                <a-form-item field="nickName" label="用户昵称">
                  <a-input v-model="modalForm.nickName" placeholder="请输入用户昵称"  />
                </a-form-item>
                <a-form-item field="phone" label="手机号码">
                  <a-input v-model="modalForm.phone" placeholder="请输入手机号码" />
                </a-form-item>
                <a-form-item field="email" label="用户邮箱">
                  <a-input v-model="modalForm.email" placeholder="请输入邮箱" />
                </a-form-item>
                <a-form-item field="sex" label="用户性别">
                  <a-radio-group v-model="modalForm.sex">
                    <a-radio value="0">男</a-radio>
                    <a-radio value="1">女</a-radio>
                  </a-radio-group>
                </a-form-item>
                <a-form-item>
                  <a-space>
                    <a-button @click="handleSubmit"  type="primary">保存</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>
          </a-tab-pane>
          <a-tab-pane key="2">
            <template #title>
              <icon-user /> 修改密码
            </template>
            <a-card hoverable :bordered="false">
              <a-form :model="userPwdForm"  :rules="rules" ref="userPwdFormRef" label-align="left" auto-label-width>
                <a-form-item field="oldPassword" label="旧密码">
                  <a-input-password v-model="userPwdForm.oldPassword" placeholder="请输入旧密码" ></a-input-password>
                </a-form-item>
                <a-form-item field="newPassword" label="新密码">
                  <a-input-password v-model="userPwdForm.newPassword" placeholder="请输入新密码" ></a-input-password>
                </a-form-item>
                <a-form-item field="confirmPassword" label="确认密码">
                  <a-input-password v-model="userPwdForm.confirmPassword" placeholder="请输入确认密码" ></a-input-password>
                </a-form-item>
                <a-form-item>
                  <a-space>
                    <a-button @click="handleSubmitUserPwd"  type="primary">保存</a-button>
                  </a-space>
                </a-form-item>
              </a-form>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </a-col>
  </a-row>


</template>

<script setup>
import { onMounted, reactive, ref, getCurrentInstance } from 'vue';
import { useUserStore } from '@/store/userInfo';
import { updateUser } from '@/api/admin/sys-user';
import { getUserProfile,putUserPwd } from '@/api/profile/profile';
import { uploadAvatar } from '@/api/admin/sys-user';
import { useGlobalProperties } from '@/hooks/globalVar';
import Cropper from '@/components/Cropper';

// use Store
const store = useUserStore();

const { proxy } = getCurrentInstance();
const globalProperties = useGlobalProperties();

const userInfoForm = ref({
  user: {},
  posts: [],
  roles: []
});

const userAvatarURL = ref('');
const userPwdForm = reactive({});

// 默认表单
const modalForm = reactive({});

// Rules
const rules = {
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  phone: [
    { required: true, message: '手机号码不能为空', trigger: 'blur' },
    { match: /^1[3456789]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur'}
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '请输入正确的邮箱地址', trigger: 'blur'}
  ],
  sex: [
    { required: true, message: '请选择性别' },
  ],
  oldPassword: [
    { required: true, message: '旧密码不能为空', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { minLength: 6, maxLength: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '新密码确认不能为空', trigger: 'blur' },
    { message: '两次输入的密码不一致', validator: (value, cb) => {
        return new Promise(resolve => {
          window.setTimeout(() => {
            if (userPwdForm.newPassword !== value) {
              cb('两次输入的密码不一致')
            }
            resolve()
          }, 1)
        })
      } },
    { minLength: 6, maxLength: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
};

// handleSubmit 新增与修改按钮方法 20220713
const handleSubmit = () => {
  proxy.$refs.modalFormRef.validate(async (valid) => {
    if (!valid) {
      const { code, msg } = await updateUser(modalForm);
      if (code === 200) {
        proxy.$message.success(msg);
        getCurrentUserInfo();
      } else {
        proxy.$message.error(`${msg}`);
      }
    } else {
      proxy.$message.error('表单校验失败');
    }
  });
};

// 修改用户密码 20221025
const handleSubmitUserPwd = () => {
  proxy.$refs.userPwdFormRef.validate(async (valid) => {
    if (!valid) {
      const { code, msg } = await putUserPwd(userPwdForm);
      if (code === 200) {
        proxy.$message.success(msg);
        getCurrentUserInfo();
      } else {
        proxy.$message.error(`${msg}`);
      }
    } else {
      proxy.$message.error('表单校验失败');
    }
  });
};

const getCurrentUserInfo = async () => {
  const res = await getUserProfile();
  userInfoForm.value = res.data;
  Object.assign(modalForm, res.data.user);
  userAvatarURL.value = `${globalProperties.CDNDomain}${userInfoForm.value.user.avatar ? userInfoForm.value.user.avatar : store.userInfo.avatar}`;
};

const CropperOpt = reactive({
  visible: false
});
const handleModifyAvatar = () => {
  CropperOpt.visible = true;
}

const handleModifyAvatarCancel = () => {
  CropperOpt.visible = false;
}

const handleModifyAvatarConfirm = async(blob) => {
  const formData = new FormData();
  formData.append('upload[]', blob);
  const res = await uploadAvatar(formData);
  const { code, msg, data } = res;
  if (code === 200) {
    proxy.$message.success(msg);
    CropperOpt.visible = false;
    userAvatarURL.value = `${globalProperties.CDNDomain}/${data}`;
    store.userInfo.avatar = `${data}`;
  } else {
    proxy.$message.error(`${msg}`);
  }
}
onMounted(() => {
  getCurrentUserInfo();
});
</script>

<style lang="scss" scoped>
.dict-wrapper {
  padding:20px;
}
.user-avatar {
  cursor: pointer;
}
</style>
