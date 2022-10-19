<template>
  <div class="app-container">
    <a-space>
      <a-avatar :style="{ backgroundColor: '#3370ff' }" :size="100">{{
        userInfoForm.nickName
      }}</a-avatar>
      <div class="userinfo-head">
        <table class="userinfo-table">
          <tbody>
            <tr class="userinfo-row">
              <td class="userinfo-item" colspan="1">
                <div class="userinfo-item-label">用户名：</div>
                <div class="userinfo-item-value">
                  {{ userInfoForm.username }}
                </div>
              </td>
              <td class="userinfo-item" colspan="1">
                <div class="userinfo-item-label">手机号：</div>
                <div class="userinfo-item-value">{{ userInfoForm.phone }}</div>
              </td>
            </tr>
            <tr class="userinfo-row">
              <td class="userinfo-item">
                <div class="userinfo-item-label">用户邮箱：</div>
                <div class="userinfo-item-value">{{ userInfoForm.email }}</div>
              </td>
              <td class="userinfo-item">
                <div class="userinfo-item-label">所属部门：</div>
                <div class="userinfo-item-value">Quark</div>
              </td>
            </tr>
            <tr class="userinfo-row">
              <td class="userinfo-item">
                <div class="userinfo-item-label">所属角色：</div>
                <div class="userinfo-item-value">系统管理员</div>
              </td>
              <td class="userinfo-item">
                <div class="userinfo-item-label">创建时间：</div>
                <div class="userinfo-item-value">
                  {{ parseTime(userInfoForm.createdAt) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </a-space>

    <a-divider />

    <a-tabs default-active-key="1" type="rounded">
      <a-tab-pane key="1" title="基础信息">
        <a-form
          :model="userInfoForm"
          :rules="rules"
          class="userinfo-form"
          ref="userInfoFormRef"
        >
          <a-form-item field="nickName" label="用户昵称">
            <a-input
              v-model="userInfoForm.nickName"
              placeholder="请输入用户昵称"
            ></a-input>
          </a-form-item>
          <a-form-item field="phone" label="手机号码">
            <a-input
              v-model="userInfoForm.phone"
              placeholder="请输入手机号码"
            ></a-input>
          </a-form-item>
          <a-form-item field="email" label="邮箱">
            <a-input
              v-model="userInfoForm.email"
              placeholder="请输入邮箱"
            ></a-input>
          </a-form-item>
          <a-form-item field="sex" label="性别">
            <a-radio-group v-model="userInfoForm.sex">
              <a-radio value="0">男</a-radio>
              <a-radio value="1">女</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary">保存</a-button>
              <a-button @click="$refs.userInfoFormRef.resetFields()"
                >重置</a-button
              >
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>
      <a-tab-pane key="2" title="修改密码">
        <a-form :model="userPwdForm" ref="userPwdFormRef" class="userinfo-form">
          <a-form-item field="oldpwd" label="旧密码">
            <a-input
              v-model="userPwdForm.oldpwd"
              placeholder="请输入旧密码"
            ></a-input>
          </a-form-item>
          <a-form-item field="newpwd" label="新密码">
            <a-input
              v-model="userPwdForm.newpwd"
              placeholder="请输入新密码"
            ></a-input>
          </a-form-item>
          <a-form-item field="repeatpwd" label="确认密码">
            <a-input
              v-model="userPwdForm.repeatpwd"
              placeholder="请输入确认密码"
            ></a-input>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary">保存</a-button>
              <a-button @click="$refs.userPwdFormRef.resetFields()"
                >重置</a-button
              >
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useUserStore } from '@/store/userInfo';
import { getCurrentUser } from '@/api/admin/sys-user';

// use Store
const store = useUserStore();

const userInfoForm = reactive({
  sex: 0,
});
const userPwdForm = reactive({});

// Rules
const rules = {
  nickName: [{ required: true, message: '请输入用户昵称' }],
  phone: [{ required: true, message: '请输入手机号码' }],
  email: [{ required: true, message: '请输入邮箱' }],
};

const getCurrentUserInfo = async () => {
  const res = await getCurrentUser(store.uid);
  Object.assign(userInfoForm, res.data);
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
