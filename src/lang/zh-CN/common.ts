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
  loading: '加载中',

  // What utils/request.ts says when a request cannot be completed. They sit
  // here rather than in a module of their own because the interceptor has no
  // component instance and no page to belong to -- it speaks for every one of
  // them.
  systemNotice: '系统提示',
  relogin: '重新登录',
  sessionExpired: '登录状态已过期',
  sessionExpiredPrompt: '登录状态已过期，您可以继续留在该页面，或者重新登录',
  networkError: '服务器连接异常，请检查服务器！'
}
