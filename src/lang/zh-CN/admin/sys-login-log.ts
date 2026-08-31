/**
 * The login log: read and delete, nothing writes it.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5), 'ip 地址' and its lower-case i included -- the column, the search label
 * and the placeholder all spell it that way today. 删除 comes from common.ts.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  username: '用户名',
  usernamePlaceholder: '请输入用户名',
  status: '状态',
  statusPlaceholder: '登录状态',
  ipaddr: 'ip 地址',
  ipaddrPlaceholder: '请输入 ip 地址',

  // ── Columns ─────────────────────────────────────────────────────
  msg: '类型',
  /** The address column's hover card, which is where the client details are. */
  peekLocation: '归属地：{value}',
  peekBrowser: '浏览器：{value}',
  peekOs: '系统：{value}',
  peekPlatform: '固件：{value}',
  loginTime: '登录时间',

  removeConfirm: '确认删除选中的 {count} 条登录日志？'
}
