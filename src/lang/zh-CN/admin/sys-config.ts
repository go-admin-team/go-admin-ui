/**
 * The parameter page.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). The search labels are deliberately shorter than the form's -- 名称 and
 * 键名 against 参数名称 and 参数键名 -- because the search bar is one row wide;
 * both spellings are kept.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  name: '名称',
  namePlaceholder: '请输入参数名称',
  key: '键名',
  keyPlaceholder: '请输入参数键名',
  builtIn: '内置',
  builtInPlaceholder: '系统内置',

  // ── Columns ─────────────────────────────────────────────────────
  configId: '编码',
  remark: '备注',
  /** The key column's hover card, which is where the value is readable. */
  peekValue: '键值：{value}',
  peekFrontend: 'UI 参数：',
  yes: '是',
  no: '否',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加参数',
  editTitle: '修改参数',
  configName: '参数名称',
  configKey: '参数键名',
  configValue: '参数键值',
  configValuePlaceholder: '请输入参数键值',
  configType: '系统内置',
  isFrontend: '前台显示',
  isFrontendPlaceholder: '是否前台显示',
  remarkPlaceholder: '请输入内容',

  // ── Export ──────────────────────────────────────────────────────
  // The filename says 参数设置 while the menu says 参数管理. That mismatch is in
  // the interface today and is copied as-is; renaming it is a separate change.
  exportFilename: '参数设置',
  exportHeader: {
    configId: '参数主键',
    configName: '参数名称',
    configKey: '参数键名',
    configValue: '参数键值',
    remark: '备注',
    createdAt: '创建时间'
  },

  rules: {
    configName: '参数名称不能为空',
    configKey: '参数键名不能为空',
    configValue: '参数键值不能为空',
    isFrontend: '是否前台显示不能为空'
  },

  /**
   * sys-config/set.vue -- the settings form, the other page in this directory.
   *
   * Its own section rather than more keys at the top level: this page names the
   * settings it edits (系统名称, 用户初始密码), while the list page above names
   * the columns of the table they are stored in (参数名称, 参数键值), and the
   * two vocabularies would collide if merged.
   */
  set: {
    // ── Sidebar ───────────────────────────────────────────────────
    sidebarTitle: '系统配置',
    sidebarSub: '基础信息与外观设置',
    basic: '基础信息',
    basicSub: '名称、Logo、密码',
    appearance: '外观设置',
    appearanceSub: '皮肤与主题风格',

    // ── Basic information ─────────────────────────────────────────
    basicTitle: '系统基础信息',
    basicDesc: '配置系统名称、Logo 及用户默认密码',
    logoEmpty: '暂无 Logo',
    logoName: '系统 Logo',
    logoHint: '推荐 200×200，支持 JPG / PNG，大小不超过 2MB',
    upload: '上传图片',
    appName: '系统名称',
    appNamePlaceholder: '请输入系统名称',
    initPassword: '用户初始密码',
    initPasswordPlaceholder: '请输入初始密码',

    // ── Appearance ────────────────────────────────────────────────
    appearanceDesc: '调整皮肤样式与侧栏主题风格',
    skin: '皮肤样式',
    skinPlaceholder: '请选择皮肤样式',
    skinBlue: '蓝色',
    sideTheme: '侧栏主题',
    sideThemePlaceholder: '请选择侧栏主题',
    themeHint: '点击快速切换主题',
    themeDark: '深色主题',
    themeLight: '浅色主题',

    // ── Saving ────────────────────────────────────────────────────
    save: '保存设置',
    /**
     * Only reached when the server answers without a message of its own -- the
     * page still prefers `response.msg`, which is what it shows today.
     */
    saveOk: '保存成功',
    logoTooLarge: '文件大小超过 2MB',

    rules: {
      appName: '请输入系统名称',
      initPassword: '请输入初始密码'
    }
  }
}
