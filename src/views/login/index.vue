<template>
  <div class="account">
    <div class="account-container">
      <div class="account-wrap-login">
        <div class="login-pic">
          <div>
            <img
              src="/public/login_left_bg.jpg"
            />
          </div>
        </div>
        <div class="login-form" style="padding: 3rem !important">
          <div class="login-form-container">
            <div class="account-top">
              <div class="account-top-logo">
                <img :src="store.sysConfig.sys_app_logo" />
                <span class="project-title">用户登录</span>
              </div>
              <div class="account-top-desc">横看成峰侧成岭 远近高低各不同</div>
            </div>
            <!-- 登录表单 -->
            <a-form
              :model="loginForm"
              :rules="loginRules"
              ref="loginFormRef"
              layout="vertical"
              @keyup.enter="handleLogin"
            >
              <a-form-item field="userName" hide-asterisk>
                <a-input
                  v-model="loginForm.userName"
                  placeholder="请输入用户名"
                >
                  <template #prefix>
                    <icon-user />
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item field="passWord" hide-asterisk>
                <a-input-password
                  v-model="loginForm.passWord"
                  placeholder="请输入密码"
                >
                  <template #prefix>
                    <icon-lock />
                  </template>
                </a-input-password>
              </a-form-item>
              <div style="display: flex">
                <div style="width: 65%">
                  <a-form-item field="code" hide-asterisk>
                    <a-input
                      v-model="loginForm.code"
                      placeholder="请输入验证码"
                    >
                      <template #prefix>
                        <icon-safe />
                      </template>
                    </a-input>
                  </a-form-item>
                </div>
                <div style="width: 5%"></div>
                <div style="width: 20%">
                  <a-form-item field="code" hide-asterisk>
                    <img
                      :src="captchUrl"
                      class="captcha"
                      @click="loadCaptcha()"
                    />
                  </a-form-item>
                </div>
              </div>
              <a-space direction="vertical" size="medium">
                <a-checkbox>记住密码</a-checkbox>
                <a-button
                  size="large"
                  type="primary"
                  :loading="loading"
                  long
                  @click="handleLogin"
                  >登录</a-button
                >
              </a-space>
            </a-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { IconUser, IconLock, IconSafe } from '@arco-design/web-vue/es/icon';
import { login, getCaptcha } from '@/api/admin/login';
import { useUserStore } from '@/store/userInfo';

const { proxy } = getCurrentInstance();
const store = useUserStore();
// form
const loginForm = reactive({});
// 验证码
const captchUrl = ref(null);
// 按钮loading
const loading = ref(false);

// rules
const loginRules = {
  userName: [{ required: true, message: '请输入用户名' }],
  passWord: [{ required: true, message: '请输入密码' }],
  code: [{ required: true, message: '请输入验证码' }],
};

// 获取验证码
const loadCaptcha = async () => {
  const res = await getCaptcha();
  captchUrl.value = res.data;
  loginForm.uuid = res.id;
};

// 登陆
const handleLogin = () => {
  loading.value = true;
  // 如果 valid 为空则校验成功
  proxy.$refs.loginFormRef.validate(async (valid) => {
    if (!valid) {
      try {
        const { code, token, msg } = await login(loginForm);
        if ( code == 200 ) {
          await store.setToken(token);
          proxy.$message.success({
            content: '登陆成功',
            duration: 2000,
          });
          setTimeout(() => {
            proxy.$router.push('/admin/sys-api');
            loading.value = false;
          }, 500);
        } else {
          proxy.$message.error(`登陆失败：${msg}`);
        }
      } catch (err) {
        // 登录失败 重新获取验证码
        loadCaptcha();
      } finally {
        loading.value = false;
      }
    }
  });
};

onMounted(async () => {
  await loadCaptcha();
});
</script>

<style lang="scss" scoped>
.captcha {
  width: 100px;
  height: 32px;
  cursor: pointer;
}

*,
:before,
:after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e5e7eb;
}

// 输入框重写
.arco-input-wrapper {
  border-radius: 20px;
  height: 40px;
  border: 1px solid #ddd;
  background: #fff;
}
// 输入框 重写框颜色
.arco-input-wrapper:hover {
  background: #fff;
  border: 1px solid #1e6fff;
}

.account {
  width: 100%;
  margin: 0 auto;
}
.account-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background: #9053c7;
  background: linear-gradient(-135deg, #c850c0, #4158d0);
}
.account-wrap-login {
  width: 960px;
  height: 554px;
  // background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  // justify-content:space-between;
  // padding:30px 95px 33px
}
.account-wrap-login .login-pic {
  background-color: #0259e6 !important;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  width: 50%;
}
.account-wrap-login .login-pic img {
  max-width: 100%;
}
.account-wrap-login .login-form {
  width: 50%;
  display: flex;
  flex-direction: column;
  background: #fff;
}
.account-wrap-login .login-form-container {
  margin: auto;
  width: 100%;
}
.account-wrap-login .login-form-title {
  padding-bottom: 15px;
  text-align: center;
}
@media (max-width: 991px) {
  .account-wrap-login .login-pic {
    display: none;
  }
  .account-wrap-login .login-form {
    width: 100%;
    margin: auto;
  }
}
.account-wrap-login .account-top {
  text-align: center;
}
.account-wrap-login .account-top-logo {
  text-align: center;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.account-wrap-login .account-top-logo img {
  width: 45px;
}
.account-wrap-login .account-top-logo .project-title {
  background: linear-gradient(
    92.06deg,
    #33c2ff -17.9%,
    #1e6fff 43.39%,
    #1e6fff 99.4%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 500;
  margin-left: 10px;
}
.account-wrap-login .account-top-desc {
  font-size: 14px;
  color: #808695;
  margin-bottom: 20px;
}
@media (max-width: 640px) {
  .account-wrap-login {
    width: 100%;
    padding: 30px;
    height: auto;
  }
}

// 20230105 自动填充背景色问题
:deep(.arco-input-wrapper .arco-input.arco-input-size-medium) {
  box-shadow: 0 0 0px 1000px #fff inset;
}
</style>
