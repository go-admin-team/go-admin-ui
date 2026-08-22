<template>
  <div class="login-page">

    <!-- 左侧：以启动 go-admin 的真实终端序列作为主视觉 -->
    <div class="stage">
      <div class="stage-glow" />

      <header class="stage-head">
        <span class="wordmark">go<span class="wordmark-dash">-</span>admin</span>
        <span class="stage-ver">v{{ version }}</span>
      </header>

      <div class="stage-main">
        <div class="term" role="img" aria-label="go-admin 启动过程示意">
          <div class="term-bar">
            <i class="dot dot--r" /><i class="dot dot--y" /><i class="dot dot--g" />
            <span class="term-path">~/go-admin</span>
          </div>
          <pre class="term-body"><code><span class="l l1"><span class="p">$</span> ./go-admin <span class="cmd">migrate</span> <span class="arg">-c config/settings.yml</span></span>
<span class="l l2"><span class="ok">✓</span> database initialized</span>
<span class="l l3"><span class="p">$</span> ./go-admin <span class="cmd">server</span> <span class="arg">-c config/settings.yml</span></span>
<span class="l l4"><span class="ok">Server run at:</span></span>
<span class="l l5">-  Local:   <span class="url">http://localhost:<span class="port">8000</span>/</span></span>
<span class="l l6"><span class="ok">Swagger run at:</span></span>
<span class="l l7">-  Local:   <span class="url">http://localhost:<span class="port">8000</span>/swagger/admin/index.html</span></span>
<span class="l l8"><span class="p">$</span> <b class="caret" /></span></code></pre>
        </div>

        <!-- 吉祥物站在终端窗体的基线上，视线朝向左侧的输出 -->
        <Gopher class="mascot" />
      </div>

      <footer class="stage-foot">
        <ul class="stack">
          <li>Gin</li><li>GORM</li><li>Casbin</li><li>Vue 3</li><li>Element Plus</li>
        </ul>
        <a href="https://beian.miit.gov.cn" target="_blank" class="icp">沪ICP备XXXXXXXXX号-1</a>
      </footer>
    </div>

    <!-- 右侧：登录表单 -->
    <div class="panel">
      <div class="form-box">
        <h1 class="panel-title">{{ sysInfo && sysInfo.sys_app_name || 'go-admin' }}</h1>
        <p class="panel-sub">使用管理员账号登录控制台</p>

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
              <button type="button" class="captcha-wrap" title="点击刷新验证码" @click="getCode">
                <img v-if="codeUrl" :src="codeUrl" class="captcha-img" alt="验证码">
                <el-icon v-else class="is-loading"><Loading /></el-icon>
              </button>
            </div>
          </el-form-item>

          <el-button
            :loading="loading"
            size="large"
            class="submit-btn"
            @click.prevent="handleLogin"
          >
            {{ loading ? '登录中' : '登录' }}
          </el-button>
        </el-form>

        <p class="panel-tip">忘记密码请联系系统管理员重置</p>
      </div>
    </div>

  </div>
</template>

<script>
import { getCodeImg } from '@/api/login'
import { useSystemStore } from '@/stores/system'
import { useUserStore } from '@/stores/user'
import { User, Lock, Key, View, Hide, Loading } from '@element-plus/icons-vue'
import Gopher from '@/components/Gopher'
import { version } from '../../../package.json'

export default {
  name: 'LoginPage',
  components: { Gopher },
  setup() {
    return { User, Lock, Key, View, Hide, Loading }
  },
  data() {
    return {
      version,
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
      useSystemStore().settingDetail().then((ret) => {
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
          useUserStore()
            .login(this.loginForm)
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
/* ══════════════════════════════════════════════════
   设计说明
   主视觉取自开发者启动本项目时的真实终端输出，而非通用的
   企业插画；强调色采用 Go 官方品牌色 #00ADD8，使配色属于
   这个项目本身。左侧承担全部表现力，右侧保持绝对安静。
   ══════════════════════════════════════════════════ */
// 取自终端语法高亮：品牌青为主，绿/琥珀作为语义色，
// 底色带靛蓝倾向而非中性灰，整体比纯深灰更有生气
$ink:      #12233f;   // 左侧底：深靛蓝
$ink-2:    #16305a;   // 渐变亮端
$line:     #2a4574;   // 分隔
$go:       #00c8ff;   // 品牌青（较官方色提亮，暗底上更醒目）
$go-deep:  #00add8;   // Go 官方色，用于实底按钮
$ok:       #5ce68b;   // 成功绿
$amber:    #ffc44d;   // 数字/端口
$dim:      #8ba0bd;

// 右侧面板的中性色走 design token，跟随明暗切换。
// 左侧 hero 刻意维持深色单主题（见上方设计说明），故仍用字面色值；
// 品牌青按钮同理 —— 它是整页唯一的强调实色，两个主题下都该是它。
$field:    var(--ga-bg-container); // 输入框底（抬升面）
$edge:     var(--ga-border-light);

.login-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* ── 左：终端主视觉 ─────────────────────────── */
.stage {
  position: relative;
  width: 72%;
  display: flex;
  flex-direction: column;
  padding: 44px 56px 40px;
  background: linear-gradient(160deg, #0f1f3a 0%, #16305a 55%, #112544 100%);
  overflow: hidden;
}

// 单一光源，替代多个装饰圆
// 铺满整个区域，让渐变自然衰减至透明；
// 若给元素本身加 border-radius，渐变会在未完全透明处被裁出硬边
.stage-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(50% 46% at 84% 62%, rgba(0, 200, 255, 0.24) 0%, transparent 70%),
    radial-gradient(48% 44% at 16% 24%, rgba(124, 92, 255, 0.14) 0%, transparent 68%);
  pointer-events: none;
}

.stage-head {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.wordmark {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: #fff;
}

.wordmark-dash { color: $go; }

.stage-ver {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  color: $dim;
}

/* 主区：终端 + 吉祥物。两端对齐舞台边缘，与上方 wordmark、
   下方备案号共用同一组左右基准线；底部对齐让吉祥物站在终端基线上 */
.stage-main {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  // 上下 auto：在页眉与页脚之间居中，避免主体压在顶部、下方留出大片空白
  margin: auto 0;
}

.mascot {
  flex: 0 0 clamp(130px, 14vw, 194px);
  margin-bottom: -6px;
  filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.32));
}

/* 终端窗体 */
.term {
  position: relative;
  flex: 0 1 620px;
  min-width: 0;
  border: 1px solid $line;
  border-radius: 10px;
  background: rgba(8, 20, 40, 0.62);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.term-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 14px;
  border-bottom: 1px solid $line;
  background: rgba(255, 255, 255, 0.02);
}

.dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
.dot--r { background: #ff5f57; }
.dot--y { background: #febc2e; }
.dot--g { background: #28c840; }

.term-path {
  margin-left: 8px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  color: $dim;
}

.term-body {
  margin: 0;
  padding: 20px 22px 24px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.85;
  color: #c9d1d9;
  white-space: pre-wrap;
  word-break: break-all;

  .p    { color: $go; margin-right: 6px; }
  .ok   { color: $ok; }
  .cmd  { color: #fff; font-weight: 600; }        // 子命令
  .arg  { color: $dim; }                           // 参数
  .url  { color: $go; text-decoration-color: rgba(0, 200, 255, 0.35); }
  .port { color: $amber; }                         // 端口

  // 逐行浮现，模拟输出节奏；只播一次，不循环
  .l {
    display: block;
    opacity: 0;
    animation: line-in 0.32s ease forwards;
  }
  .l1 { animation-delay: 0.15s; }
  .l2 { animation-delay: 0.50s; }
  .l3 { animation-delay: 0.80s; }
  .l4 { animation-delay: 1.10s; }
  .l5 { animation-delay: 1.28s; }
  .l6 { animation-delay: 1.46s; }
  .l7 { animation-delay: 1.64s; }
  .l8 { animation-delay: 1.86s; }
}

.caret {
  display: inline-block;
  width: 8px;
  height: 15px;
  vertical-align: -2px;
  background: $go;
  animation: blink 1.1s step-end infinite;
}

@keyframes line-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: none; }
}

@keyframes blink {
  50% { opacity: 0; }
}

.stage-foot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
    font-size: 12px;
    color: $dim;
  }
}

.icp {
  font-size: 12px;
  color: #4d5866;
  text-decoration: none;

  &:hover { color: $dim; }
}

/* ── 右：表单 ─────────────────────────────── */
.panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 40px;
  background: var(--ga-bg-body);
}

.form-box {
  width: 100%;
  max-width: 300px;
}

.panel-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: -0.2px;
  color: var(--ga-text-1);
}

.panel-sub {
  margin: 0 0 30px;
  font-size: 13px;
  color: var(--ga-text-2);
}

.panel-tip {
  margin: 22px 0 0;
  font-size: 12px;
  color: var(--ga-text-3);
}

.login-form {
  :deep(.el-form-item) { margin-bottom: 18px; }

  :deep(.el-form-item__label) {
    padding-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    color: var(--ga-text-2);
  }

  // 描边式输入框：白底 + 细边框，聚焦时用 Go 品牌色标识
  :deep(.el-input__wrapper) {
    padding: 1px 12px;
    border-radius: 8px;
    background: $field;
    box-shadow: 0 0 0 1px $edge inset;
    transition: box-shadow 0.16s ease;

    &:hover { box-shadow: 0 0 0 1px var(--ga-border) inset; }

    &.is-focus {
      box-shadow: 0 0 0 1px $go-deep inset, 0 0 0 3px rgba(0, 173, 216, 0.16);
    }
  }

  :deep(.el-input__inner) { height: 40px; font-size: 14px; }
  :deep(.el-input__prefix) { color: var(--ga-text-3); }
}

.pwd-eye {
  cursor: pointer;
  color: var(--ga-text-3);

  &:hover { color: $go-deep; }
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-input { flex: 1; }
}

.captcha-wrap {
  flex-shrink: 0;
  width: 104px;
  height: 42px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $edge;
  border-radius: 8px;
  background: $field;
  cursor: pointer;
  overflow: hidden;

  &:hover { border-color: $go-deep; }
  &:focus-visible { outline: 2px solid $go-deep; outline-offset: 2px; }
}

.captcha-img { width: 100%; height: 100%; object-fit: cover; }

// 品牌青实底按钮：页面唯一的高饱和实色块，作为主操作的落点。
// 刻意不使用 type="primary"，全局 .el-button--primary 以 !important
// 锁定了品牌蓝，无法覆盖
.login-form :deep(.submit-btn) {
  width: 100%;
  height: 42px;
  margin-top: 4px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #04121f;
  background: linear-gradient(135deg, #00c8ff 0%, #00add8 100%);
  box-shadow: 0 4px 14px rgba(0, 173, 216, 0.28);
  transition: filter 0.16s ease, box-shadow 0.16s ease;

  &:hover, &:focus {
    color: #04121f;
    filter: brightness(1.06);
    box-shadow: 0 6px 18px rgba(0, 173, 216, 0.36);
  }
  &:active { filter: brightness(0.96); box-shadow: 0 2px 8px rgba(0, 173, 216, 0.3); }
  &.is-loading { color: rgba(4, 18, 31, 0.7); }
}

/* ── 响应式 ───────────────────────────────── */
// 再窄下去终端会被挤到需要频繁折行，此时宁可让出吉祥物
@media (max-width: 1120px) {
  .mascot { display: none; }
  .term { flex: 1 1 auto; }
}

@media (max-width: 1100px) {
  .stage { width: 60%; padding: 32px 36px; }
}

@media (max-width: 860px) {
  .login-page { flex-direction: column; }
  .stage { width: 100%; height: auto; padding: 24px; }
  .stage-main { margin: 20px 0; }
  .term-body { font-size: 12px; line-height: 1.9; }
  .stage-foot { display: none; }
  .panel { flex: 1; padding: 32px 24px; }
  .form-box { max-width: 340px; }
}

/* 尊重系统的减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .term-body .l { animation: none; opacity: 1; }
  .caret { animation: none; }
}
</style>
