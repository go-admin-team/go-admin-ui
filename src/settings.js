export default {
  title: 'go-admin后台管理系统',

  /**
   * @type {boolean} true | false
   * @description Whether show the settings right-panel
   */
  showSettings: true,

  /**
   * 是否显示顶部导航
   * 注：Element Plus 2.14.0 水平 el-menu 有 calcSliceIndex/childNodes bug，暂关闭
   */
  topNav: false,

  /**
   * @type {boolean} true | false
   * @description Whether need tagsView
   */
  tagsView: true,

  /**
   * @type {boolean} true | false
   * @description Whether fix the header
   */
  fixedHeader: true,

  /**
   * @type {boolean} true | false
   * @description Whether show the logo in sidebar
   */
  sidebarLogo: true,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   */
  errorLog: 'production',

  /**
   * Sidebar surface: 'light' or 'dark', switched from the settings drawer.
   *
   * Light is the default because it is what the systems this gets compared
   * against do, Ant Design Pro among them: navigation and content share one
   * plane separated by a hairline, and the accent is spent on the few things
   * that are actually interactive rather than on the largest block of screen
   * nobody looks at. The dark rail is one switch away for deployments that
   * prefer it, and both are covered by tests/e2e/mocked/sidebar-rail.spec.ts.
   */
  themeStyle: 'light'
}
