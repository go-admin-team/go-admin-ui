/**
 * The menu page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). The seven FieldLabel tips are the longest prose in the admin section,
 * and they are interface copy rather than comments -- they are what the
 * question mark next to each label reveals.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  menuName: '菜单名称',
  menuNamePlaceholder: '请输入菜单名称',
  status: '状态',
  statusPlaceholder: '菜单状态',

  // ── Columns ─────────────────────────────────────────────────────
  icon: '图标',
  sort: '排序',
  permission: '权限标识',
  componentPath: '组件路径',
  visible: '可见',
  /** Columns of the popover listing the routes a permission grants. */
  api: '接口',
  apiUntitled: '暂无',
  path: '路径',
  /** Title of the icon-only add button, so the row it acts under is named. */
  addUnder: '在「{title}」下新增',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加菜单',
  editTitle: '修改菜单',
  /** Synthetic root of the parent picker, i.e. "no parent". */
  rootCategory: '主类目',
  parent: '上级菜单',
  parentPlaceholder: '选择上级菜单',
  menuType: '菜单类型',
  typeDirectory: '目录',
  typeMenu: '菜单',
  typeButton: '按钮',
  title: '菜单标题',
  titlePlaceholder: '请输入菜单标题',
  displaySort: '显示排序',
  menuIcon: '菜单图标',
  iconPlaceholder: '点击选择图标',
  routeName: '路由名称',
  routeNameTip: '必须与页面组件的 name 一致，否则 keep-alive 缓存静默失效',
  routeNamePlaceholder: '请输入路由名称',
  componentPathTip: 'views 下的路径，如 /admin/sys-api/index；目录类型填 Layout',
  componentPathPlaceholder: '请输入组件路径',
  routePath: '路由地址',
  routePathTip: '访问此页面的 url，建议以 / 开头',
  routePathPlaceholder: '请输入路由地址',
  isFrame: '是否外链',
  isFrameTip: '通过 iframe 打开指定地址',
  yes: '是',
  no: '否',
  permissionTip: '前端据此控制按钮是否显示',
  permissionPlaceholder: '如 admin:sysUser:add',
  menuStatus: '菜单状态',
  menuStatusTip: '隐藏的菜单不出现在侧边栏，但路由仍然可达',
  apiPermission: 'api 权限',
  apiPermissionTip: '未授权的接口，持有此菜单的角色将无权访问',
  unauthorized: '未授权',
  authorized: '已授权',
  revoke: '收回',
  authorize: '授权',

  removeConfirm: '确认删除该菜单？其下级菜单也会一并删除。',

  rules: {
    title: '菜单标题不能为空',
    sort: '菜单顺序不能为空'
  }
}
