/**
 * Words that appear on more than one page.
 *
 * Kept small on purpose: an entry here that only one page uses is harder to
 * find than one sitting next to that page's other text, and
 * scripts/check-i18n-usage.mjs reports it as dead. Add a word here when the
 * second page needs it, not in anticipation.
 *
 * Every Chinese value must be byte-for-byte what the interface renders today --
 * PRD R5. The 309 Chinese assertions in the e2e suite are the check, and they
 * are not being touched.
 */
export default {
  confirm: '确定',
  cancel: '取消',
  notice: '提示',
  reset: '重置',
  search: '搜索',
  refresh: '刷新',
  actions: '操作',
  close: '关闭',
  empty: '暂无数据',
  selectPlaceholder: '请选择',
  loading: '加载中',

  // The toolbar and row actions every list page repeats, and the column every
  // one of them ends with. All five admin pages migrated so far carry each of
  // these; sys-role and sys-config carry 导出 as well.
  add: '新增',
  edit: '修改',
  delete: '删除',
  export: '导出',
  createdAt: '创建时间',

  // The dialog footer's pair, which is NOT the same string as confirm/cancel
  // above: Element Plus's own message box renders 确定/取消, while the footer of
  // a two-character Chinese button is spaced by convention. The e2e suite
  // matches on both spellings, so collapsing them would change what renders.
  // English has no such convention, so both spellings translate to one word.
  dialogConfirm: '确 定',
  dialogCancel: '取 消',

  // What utils/request.ts says when a request cannot be completed. They sit
  // here rather than in a module of their own because the interceptor has no
  // component instance and no page to belong to -- it speaks for every one of
  // them.
  systemNotice: '系统提示',
  relogin: '重新登录',
  sessionExpired: '登录状态已过期',
  sessionExpiredPrompt: '登录状态已过期，您可以继续留在该页面，或者重新登录',
  networkError: '服务器连接异常，请检查服务器！',

  // What the router guard reports when the menu cannot be built -- stores/
  // permission.ts throws it, src/permission.js turns it into a toast. Same
  // reason as the block above: the guard runs before any page exists.
  menuLoadFailed: '菜单数据加载异常',

  // The guard's last resort, for a throw that carried no message of its own.
  // 'Has Error' is what renders today in both languages -- it is a placeholder
  // left in the original code, not copy, and R5 keeps the Chinese value equal
  // to what ships. Writing a real Chinese sentence here is a copy change, not a
  // translation, so it is deliberately left alone.
  unknownError: 'Has Error'
}
