/**
 * The department page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD R5).
 */
export default {
  // ── Search and columns ──────────────────────────────────────────
  deptName: '部门名称',
  deptNamePlaceholder: '请输入部门名称',
  status: '状态',
  statusPlaceholder: '部门状态',
  sort: '排序',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加部门',
  editTitle: '修改部门',
  /** Synthetic root of the parent picker, i.e. "no parent". */
  rootCategory: '主类目',
  parent: '上级部门',
  parentPlaceholder: '选择上级部门',
  displaySort: '显示排序',
  leader: '负责人',
  leaderPlaceholder: '请输入负责人',
  phone: '联系电话',
  phonePlaceholder: '请输入联系电话',
  email: '邮箱',
  emailPlaceholder: '请输入邮箱',
  deptStatus: '部门状态',

  removeConfirm: '确认删除该部门？其下级部门也会一并删除。',

  rules: {
    parentId: '上级部门不能为空',
    deptName: '部门名称不能为空',
    sort: '排序不能为空',
    leader: '负责人不能为空',
    emailFormat: '请输入正确的邮箱地址',
    phoneFormat: '请输入正确的手机号码'
  }
}
