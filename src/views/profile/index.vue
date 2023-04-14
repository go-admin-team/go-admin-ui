<template>
  <a-row :gutter="8" class="dict-wrapper">
    <a-col :span="8">
      <a-card hoverable>
        <div style="text-align: center;">
          <a-space direction="vertical" fill>
            <a-avatar :size="120">
              <template v-if="userInfoForm.user.avatar == '' ">
                <img alt="avatar" :src="store.sysConfig.sys_user_avatar" />
              </template>
              <template v-else>
                <img alt="avatar" :src="userInfoForm.user.avatar"/>
              </template>
            </a-avatar>
            <a-typography-title :heading="6">{{userInfoForm.user.nickName}}</a-typography-title>
          </a-space>
        </div>
        <a-divider />
        <a-card :bordered="false">
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
    <a-col :span="16">
      <a-card hoverable>
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
                  <a-input v-model="userPwdForm.oldPassword" placeholder="请输入旧密码" />
                </a-form-item>
                <a-form-item field="newPassword" label="新密码">
                  <a-input v-model="userPwdForm.newPassword" placeholder="请输入新密码" />
                </a-form-item>
                <a-form-item field="confirmPassword" label="确认密码">
                  <a-input v-model="userPwdForm.confirmPassword" placeholder="请输入确认密码" />
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

// use Store
const store = useUserStore();

// 获取当前实例
const { proxy } = getCurrentInstance();

const userInfoForm = ref({
  user: {},
  posts: [],
  roles: []
});

const userPwdForm = reactive({});

// 默认表单
const modalForm = reactive({});

// Rules
const rules = {
  nickName: [{ required: true, message: '请输入用户昵称' }],
  phone: [
    { required: true, message: '请输入联系手机' },
    // { match: /^1[3456789]\d{9}$/, message: '校验规则: 13011112222'}
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    // { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '校验规则: aka@aka.com'}
  ],
  sex: [
    { required: true, message: '请选择性别' },
    // { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '校验规则: aka@aka.com'}
  ],
  oldPassword: [
    { required: true, message: '输入旧密码' },
    // { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '校验规则: aka@aka.com'}
  ],
  newPassword: [
    { required: true, message: '输入新密码' },
    // { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '校验规则: aka@aka.com'}
  ],
  confirmPassword: [
    { required: true, message: '确认新密码', validator: (value, cb) => {
        return new Promise(resolve => {
          window.setTimeout(() => {
            if (userPwdForm.newPassword !== value) {
              cb('两次输入的密码不一致')
            }
            resolve()
          }, 1)
        })
      } }
    // { match: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/, message: '校验规则: aka@aka.com'}
  ],
};

const equalToPassword = (value, callback) => {
  if (modalForm.newPassword !== value) {
    cb('两次输入的密码不一致')
    console.log("aaa")
  } else {
    cb('密码输入正确')
    console.log("bbb")
  }
}

// handleSubmit 新增与修改按钮方法 20220713
const handleSubmit = () => {
  proxy.$refs.modalFormRef.validate(async (valid) => {
    if (!valid) {
      const { success } = await updateUser(modalForm);
      if (success) proxy.$message.success('信息修改成功');
      getCurrentUserInfo();
    } else {
      proxy.$message.error('表单校验失败');
    }
  });
};

// 修改用户密码 20221025
const handleSubmitUserPwd = () => {
  proxy.$refs.userPwdFormRef.validate(async (valid) => {
    if (!valid) {
      const { res } = await putUserPwd(userPwdForm);
      console.loh("success",res)
      if (success) proxy.$message.success('密码修改成功');
      getCurrentUserInfo();
    } else {
      proxy.$message.error('表单校验失败');
    }
  });
};

const getCurrentUserInfo = async () => {
  const res = await getUserProfile()
  userInfoForm.value = res.data
  Object.assign(modalForm, res.data.user);
};

onMounted(() => {
  getCurrentUserInfo();
});
</script>

<style lang="scss">
.userinfo-row {
  font-size: 14px;
  line-height: 1.5;
  .userinfo-item {
    &-label {
      width: 140px;
      color: #4e5969;
      text-align: right;
    }
    &-value {
      width: 140px;
      color: $primary-font-color;
    }
    div {
      display: inline-block;
    }
  }
}

.userinfo-form {
  width: 520px;
  margin: 0 auto;
}
</style>
