/**
 * The operation log: an audit trail, so it reads, deletes and empties, and
 * nothing on it creates a record.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). 删除 / 导出 / 提示 / 确定 / 取消 come from common.ts; the detail
 * dialog's 关 闭 does not, because common.close is 关闭 without the spacing a
 * two-character Chinese button gets, and this is the only button in the
 * application that spells it the other way.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  operUrl: '访问地址',
  operUrlPlaceholder: '请输入访问地址',
  status: '状态',
  statusPlaceholder: '操作状态',
  operTime: '操作时间',
  rangeSeparator: '至',
  startDate: '开始日期',
  endDate: '结束日期',

  // ── Toolbar ─────────────────────────────────────────────────────
  clean: '清空',

  // ── Columns ─────────────────────────────────────────────────────
  operId: '编号',
  request: '请求',
  /** The request column's hover card, which is where the rest of the row is. */
  peekHost: 'Host：{value}',
  peekLocation: '归属地：{value}',
  peekLatency: '耗时：{value}',
  operName: '操作人员',
  operDate: '操作日期',
  detail: '详细',

  // ── Detail dialog ───────────────────────────────────────────────
  detailTitle: '操作日志详细',
  detailUrl: '请求地址',
  loginInfo: '登录信息',
  requestMethod: '请求方式',
  latency: '耗时',
  module: '系统模块',
  operStatus: '操作状态',
  operParam: '请求参数',
  jsonResult: '返回参数',
  dialogClose: '关 闭',

  // ── Deleting and emptying ───────────────────────────────────────
  removeConfirm: '确认删除选中的 {count} 条操作日志？',
  cleanConfirm: '确认清空全部操作日志？此操作不可撤销。',
  cleanOk: '已清空',

  // ── Export ──────────────────────────────────────────────────────
  exportFilename: '操作日志',
  exportHeader: {
    operId: '编号',
    module: '系统模块',
    businessType: '操作类型',
    operName: '操作人员',
    operIp: '主机',
    operLocation: '操作地点',
    requestMethod: '请求方式',
    operUrl: '请求地址',
    status: '状态',
    operDate: '操作日期'
  }
}
