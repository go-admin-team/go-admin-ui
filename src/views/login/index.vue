<template>
  <div class="login-page">

    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <!-- 几何装饰 -->
      <div class="brand-deco brand-deco--circle1" />
      <div class="brand-deco brand-deco--circle2" />
      <div class="brand-deco brand-deco--circle3" />

      <div class="brand-content">
        <div class="brand-logo-wrap">
          <img
            v-if="sysInfo && sysInfo.sys_app_logo"
            :src="sysInfo.sys_app_logo"
            class="brand-logo-img"
            alt="logo"
          >
          <el-icon v-else class="brand-logo-icon"><Monitor /></el-icon>
        </div>
        <h1 class="brand-title">{{ sysInfo && sysInfo.sys_app_name || 'Go Admin' }}</h1>
        <p class="brand-desc">高效、安全的企业级后台管理平台</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><Lock /></el-icon>
            <span>安全可靠</span>
          </div>
          <div class="feature-item">
            <el-icon><Monitor /></el-icon>
            <span>实时监控</span>
          </div>
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <span>权限管理</span>
          </div>
        </div>
      </div>

      <div class="brand-footer">
        <a href="https://beian.miit.gov.cn" target="_blank" class="icp-link">沪ICP备XXXXXXXXX号-1</a>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="login-form-panel">
      <!-- 装饰光晕 -->
      <div class="panel-blob panel-blob--tr" />
      <div class="panel-blob panel-blob--bl" />

      <div class="form-box">
        <div class="form-header">
          <span class="form-badge">账号登录</span>
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">请输入您的账号和密码继续</p>
        </div>

        <el-form
          ref="loginForm"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          class="login-form"
          autocomplete="on"
          @submit.prevent="handleLogin"
        >
          <el-form-item label="账号" prop="username">
            <el-input
              ref="username"
              v-model="loginForm.username"
              placeholder="请输入账号"
              name="username"
              type="text"
              tabindex="1"
              autocomplete="on"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              :key="passwordType"
              ref="password"
              v-model="loginForm.password"
              :type="passwordType"
              placeholder="请输入密码"
              name="password"
              tabindex="2"
              autocomplete="on"
              size="large"
              :prefix-icon="Lock"
              @keyup="checkCapslock"
              @blur="capsTooltip = false"
              @keyup.enter="handleLogin"
            >
              <template #suffix>
                <el-icon class="pwd-eye" @click="showPwd">
                  <View v-if="passwordType === 'password'" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                name="code"
                type="text"
                tabindex="3"
                maxlength="5"
                autocomplete="off"
                size="large"
                :prefix-icon="Key"
                @keyup.enter="handleLogin"
              />
              <div class="captcha-wrap" title="点击刷新" @click="getCode">
                <img v-if="codeUrl" :src="codeUrl" class="captcha-img" alt="验证码">
                <div v-else class="captcha-placeholder">
                  <el-icon class="is-loading"><Loading /></el-icon>
                </div>
              </div>
            </div>
          </el-form-item>

          <el-button
            :loading="loading"
            type="primary"
            size="large"
            class="submit-btn"
            @click.prevent="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form>
      </div>
    </div>

  </div>
</template>

<script>
import { getCodeImg } from '@/api/login'
import { User, Lock, Key, View, Hide, Monitor, Loading } from '@element-plus/icons-vue'

export default {
  name: 'LoginPage',
  setup() {
    return { User, Lock, Key, View, Hide, Monitor, Loading }
  },
  data() {
    return {
      codeUrl: '',
      loginForm: {
        username: 'admin',
        password: '123456',
        code: '',
        uuid: ''
      },
      loginRules: {
        username: [{ required: true, trigger: 'blur', message: '用户名不能为空' }],
        password: [{ required: true, trigger: 'blur', message: '密码不能为空' }],
        code: [{ required: true, trigger: 'change', message: '验证码不能为空' }]
      },
      passwordType: 'password',
      capsTooltip: false,
      loading: false,
      redirect: undefined,
      otherQuery: {},
      sysInfo: ''
    }
  },
  watch: {
    $route: {
      handler(route) {
        const query = route.query
        if (query) {
          this.redirect = query.redirect
          this.otherQuery = this.getOtherQuery(query)
        }
      },
      immediate: true
    }
  },
  created() {
    this.getCode()
    this.getSystemSetting()
  },
  mounted() {
    if (!this.loginForm.username) {
      this.$refs.username.focus()
    } else if (!this.loginForm.password) {
      this.$refs.password.focus()
    }
  },
  methods: {
    getSystemSetting() {
      this.$store.dispatch('system/settingDetail').then((ret) => {
        this.sysInfo = ret
        document.title = ret.sys_app_name
      })
    },
    getCode() {
      this.codeUrl = ''
      getCodeImg().then((res) => {
        if (res !== undefined) {
          this.codeUrl = res.data
          this.loginForm.uuid = res.id
        }
      })
    },
    checkCapslock({ shiftKey, key } = {}) {
      if (key && key.length === 1) {
        if ((shiftKey && key >= 'a' && key <= 'z') || (!shiftKey && key >= 'A' && key <= 'Z')) {
          this.capsTooltip = true
        } else {
          this.capsTooltip = false
        }
      }
      if (key === 'CapsLock' && this.capsTooltip === true) {
        this.capsTooltip = false
      }
    },
    showPwd() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
      this.$nextTick(() => this.$refs.password.focus())
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true
          this.$store
            .dispatch('user/login', this.loginForm)
            .then(() => {
              this.$router.push({ path: this.redirect || '/', query: this.otherQuery }).catch(() => {})
            })
            .catch(() => {
              this.loading = false
              this.getCode()
            })
        }
      })
    },
    getOtherQuery(query) {
      return Object.keys(query).reduce((acc, cur) => {
        if (cur !== 'redirect') acc[cur] = query[cur]
        return acc
      }, {})
    }
  }
}
</script>

<style lang="scss" scoped>
/* ── 页面容器 ── */
.login-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* ══════════════════════════════
   左侧品牌区
══════════════════════════════ */
.login-brand {
  position: relative;
  width: 45%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 40px;
  overflow: hidden;
  background: linear-gradient(145deg, #002c8c 0%, #1677ff 55%, #40a9ff 100%);

  /* 浮动圆形装饰 */
  .brand-deco {
    position: absolute;
    border-radius: 50%;
    opacity: 0.12;
    background: #fff;
  }

  .brand-deco--circle1 {
    width: 380px;
    height: 380px;
    top: -100px;
    right: -120px;
  }

  .brand-deco--circle2 {
    width: 220px;
    height: 220px;
    bottom: 60px;
    left: -60px;
  }

  .brand-deco--circle3 {
    width: 120px;
    height: 120px;
    bottom: 220px;
    right: 40px;
    opacity: 0.08;
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  margin-top: auto;
  margin-bottom: auto;
}

.brand-logo-wrap {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.brand-logo-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: 8px;
}

.brand-logo-icon {
  font-size: 30px;
  color: #fff;
}

.brand-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  line-height: 1.2;
}

.brand-desc {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.6;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;

  .el-icon {
    font-size: 16px;
    background: rgba(255, 255, 255, 0.15);
    padding: 6px;
    border-radius: 8px;
    color: #fff;
  }
}

.brand-footer {
  position: relative;
  z-index: 1;
}

.icp-link {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }
}

/* ══════════════════════════════
   右侧表单区
══════════════════════════════ */
.login-form-panel {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  overflow: hidden;
  /* 浅渐变底色 + SVG 点阵纹理 */
  background-color: #e8f4ff;
  background-image:
    linear-gradient(135deg, #e8f4ff 0%, #f0f8ff 50%, #f5fbff 100%),
    radial-gradient(circle, rgba(22, 119, 255, 0.07) 1px, transparent 1px);
  background-size: 100% 100%, 28px 28px;
}

/* 柔光晕装饰 */
.panel-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(72px);
}

.panel-blob--tr {
  width: 340px;
  height: 340px;
  top: -80px;
  right: -80px;
  background: rgba(22, 119, 255, 0.15);
}

.panel-blob--bl {
  width: 260px;
  height: 260px;
  bottom: -60px;
  left: -60px;
  background: rgba(64, 169, 255, 0.12);
}

.form-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px 36px;
  box-shadow:
    0 0 0 1px rgba(22, 119, 255, 0.08),
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 16px 40px rgba(22, 119, 255, 0.12);
  animation: form-enter 0.4s cubic-bezier(0.34, 1.06, 0.64, 1) forwards;

  /* 顶部彩色渐变条 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 16px 16px 0 0;
    background: linear-gradient(90deg, #1677ff 0%, #40a9ff 100%);
  }
}

@keyframes form-enter {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.form-header {
  margin-bottom: 28px;
}

.form-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #1677ff;
  background: rgba(22, 119, 255, 0.08);
  border: 1px solid rgba(22, 119, 255, 0.2);
  margin-bottom: 12px;
}

.form-title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #002c8c 0%, #1677ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  margin: 0;
  font-size: 13px;
  color: #9ca3af;
}

/* ── 表单样式 ── */
.login-form {
  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    padding-bottom: 6px;
    line-height: 1;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e5e7eb !important;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px #d1d5db !important;
    }
  }

  :deep(.el-input.is-focus .el-input__wrapper) {
    box-shadow: 0 0 0 2px #3b82f6 !important;
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 2px #ef4444 !important;
  }

  :deep(.el-input__prefix-inner .el-icon) {
    color: #9ca3af;
    font-size: 16px;
  }

  :deep(.el-input__inner) {
    color: #111827;
    font-size: 14px;

    &::placeholder {
      color: #c1c7d0;
    }
  }
}

.pwd-eye {
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #3b82f6;
  }
}

/* ── 验证码 ── */
.captcha-row {
  display: flex;
  gap: 10px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}

.captcha-wrap {
  width: 110px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3b82f6;
  }
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.captcha-placeholder {
  color: #c1c7d0;
  font-size: 18px;
}

/* ── 登录按钮 ── */
.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #1677ff 0%, #40a9ff 100%) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.4);
  transition: all 0.25s ease;

  &:hover {
    background: linear-gradient(135deg, #0958d9 0%, #1677ff 100%) !important;
    box-shadow: 0 8px 24px rgba(22, 119, 255, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
  }

  &.is-loading {
    transform: none;
    opacity: 0.85;
  }
}

/* ── 响应式 ── */
@media (max-width: 900px) {
  .login-brand {
    width: 40%;
    padding: 36px 28px;
  }

  .brand-title {
    font-size: 26px;
  }

  .form-box {
    padding: 36px 28px;
  }
}

@media (max-width: 680px) {
  .login-page {
    flex-direction: column;
  }

  .login-brand {
    width: 100%;
    height: 200px;
    flex-direction: row;
    align-items: center;
    padding: 24px 28px;

    .brand-content {
      flex-direction: row;
      align-items: center;
      gap: 16px;
      margin: 0;
    }

    .brand-desc,
    .brand-features {
      display: none;
    }

    .brand-title {
      font-size: 22px;
    }

    .brand-logo-wrap {
      width: 48px;
      height: 48px;
    }
  }

  .login-form-panel {
    flex: 1;
    padding: 24px 16px;
    overflow-y: auto;
  }

  .form-box {
    padding: 28px 20px;
  }
}
</style>
