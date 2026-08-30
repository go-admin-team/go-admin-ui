/**
 * The sign-in page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5), down to the punctuation -- the e2e suite asserts on these strings and is
 * not being touched.
 *
 * The ICP filing number in the page footer is deliberately absent: it is a legal
 * registration identifier, not interface copy, so it stays in the template.
 */
export default {
  subtitle: '使用管理员账号登录控制台',
  username: '账号',
  usernamePlaceholder: '请输入账号',
  password: '密码',
  passwordPlaceholder: '请输入密码',
  captcha: '验证码',
  captchaPlaceholder: '请输入验证码',
  captchaRefresh: '点击刷新验证码',
  submit: '登录',
  submitting: '登录中',
  forgotPassword: '忘记密码请联系系统管理员重置',
  /** Alt text for the terminal illustration that carries the left half. */
  terminalAlt: 'go-admin 启动过程示意',
  rules: {
    username: '用户名不能为空',
    password: '密码不能为空',
    captcha: '验证码不能为空'
  }
}
