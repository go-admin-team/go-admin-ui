/**
 * The role page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5); the spec asserts on ten of them.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  roleName: '角色名称',
  roleNamePlaceholder: '请输入角色名称',
  roleKey: '权限字符',
  roleKeyPlaceholder: '请输入权限字符',
  status: '状态',
  statusPlaceholder: '角色状态',

  // ── Columns ─────────────────────────────────────────────────────
  roleId: '编码',
  name: '名称',
  sort: '排序',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加角色',
  editTitle: '修改角色',
  roleSort: '角色顺序',
  menuPermission: '菜单权限',
  remark: '备注',
  remarkPlaceholder: '请输入内容',
  /** Empty text of both trees, shown while their request is in flight. */
  treeLoading: '加载中，请稍后',
  /** Empty text of the menu tree when the role edited is the super admin. */
  adminNeedsNoMenus: '系统超级管理员无需此操作',

  // ── Data scope ──────────────────────────────────────────────────
  dataScope: '数据权限',
  dataScopeTitle: '分配数据权限',
  scope: '权限范围',
  scopeOptions: {
    all: '全部数据权限',
    custom: '自定数据权限',
    dept: '本部门数据权限',
    deptAndBelow: '本部门及以下数据权限',
    self: '仅本人数据权限'
  },
  dataScopeSaved: '数据权限已保存',

  // ── The status switch ───────────────────────────────────────────
  enableConfirm: '确认启用角色「{name}」？',
  disableConfirm: '确认停用角色「{name}」？',
  enableOk: '启用成功',
  disableOk: '停用成功',

  // ── Export ──────────────────────────────────────────────────────
  // Its own headings rather than the column labels: the sheet spells out
  // 角色编号 and 显示顺序 where the table, short of width, says 编码 and 排序.
  exportFilename: '角色管理',
  exportHeader: {
    roleId: '角色编号',
    roleName: '角色名称',
    roleKey: '权限字符',
    roleSort: '显示顺序',
    status: '状态',
    createdAt: '创建时间'
  },

  rules: {
    roleName: '角色名称不能为空',
    roleKey: '权限字符不能为空',
    roleSort: '角色顺序不能为空'
  }
}
