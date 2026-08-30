/**
 * The user page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5) -- sys-user carries the densest block of Chinese assertions in the e2e
 * suite, 18 in its own spec alone, and none of them were touched.
 *
 * 新增 / 修改 / 删除 / 创建时间 / 确 定 / 取 消 are read from common.ts rather
 * than repeated here.
 */
export default {
  // ── Department pane and search ──────────────────────────────────
  deptNamePlaceholder: '请输入部门名称',
  dept: '部门',
  deptPlaceholder: '选择部门',
  username: '用户名称',
  usernamePlaceholder: '请输入用户名称',
  phone: '手机号码',
  phonePlaceholder: '请输入手机号码',
  status: '状态',
  statusPlaceholder: '用户状态',

  // ── Columns ─────────────────────────────────────────────────────
  userId: '编号',
  loginName: '登录名',
  nickNameColumn: '昵称',
  // Shorter than the form's 手机号码, because the column is 110px wide
  phoneColumn: '手机号',

  /** Title of the icon-only reset button, so the row it acts on is named. */
  resetPasswordFor: '重置密码：{name}',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加用户',
  editTitle: '修改用户',
  nickName: '用户昵称',
  nickNamePlaceholder: '请输入用户昵称',
  deptId: '归属部门',
  deptIdPlaceholder: '请选择归属部门',
  email: '邮箱',
  emailPlaceholder: '请输入邮箱',
  password: '用户密码',
  passwordPlaceholder: '请输入用户密码',
  sex: '用户性别',
  selectPlaceholder: '请选择',
  post: '岗位',
  role: '角色',
  remark: '备注',
  remarkPlaceholder: '请输入内容',

  // ── Password reset ──────────────────────────────────────────────
  resetPassword: '重置密码',
  user: '用户',
  newPassword: '新密码',
  newPasswordPlaceholder: '请输入新密码',
  resetOk: '密码重置成功',

  // ── Deleting and the status switch ──────────────────────────────
  removeConfirm: '确认删除选中的 {count} 个用户？',
  // Two whole sentences rather than a verb spliced into one: 启用/停用 is the
  // object of the sentence in Chinese but the verb in English, so a shared
  // template would only be grammatical in one of the two languages.
  enableConfirm: '确认启用用户「{name}」？',
  disableConfirm: '确认停用用户「{name}」？',
  enableOk: '启用成功',
  disableOk: '停用成功',

  rules: {
    username: '用户名称不能为空',
    nickName: '用户昵称不能为空',
    deptId: '归属部门不能为空',
    password: '用户密码不能为空',
    email: '邮箱地址不能为空',
    emailFormat: '请输入正确的邮箱地址',
    phone: '手机号码不能为空',
    phoneFormat: '请输入正确的手机号码',
    newPassword: '新密码不能为空',
    passwordLength: '密码长度为 6 到 20 位'
  }
}
