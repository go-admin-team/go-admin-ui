/**
 * The shell: navbar, sidebar, tab strip and the settings drawer.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5) -- including 'Header 固定' and '侧边栏Logo', which mix scripts and are
 * copied as-is rather than tidied. Fixing the wording is a separate change with
 * its own commit; doing it here would make the e2e assertions that guard this
 * migration fail for the wrong reason.
 */
export default {
  language: '语言',
  languageFailed: '语言切换失败，请检查网络后重试',
  logout: '退出登录',
  logoutConfirm: '确定注销并退出系统吗？',
  settings: {
    title: '页面设置',
    theme: '主题设置',
    themeColor: '主题颜色',
    colorScheme: '明暗配色',
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    layout: '布局设置',
    topNav: '开启 TopNav',
    tagsView: '开启任务栏',
    fixedHeader: 'Header 固定',
    sidebarLogo: '侧边栏Logo'
  },
  tagsView: {
    refresh: '刷新当前标签页',
    close: '关闭当前标签页',
    closeOthers: '关闭其他标签页',
    closeAll: '关闭全部标签页'
  },
  topNav: {
    more: '更多菜单'
  }
}
