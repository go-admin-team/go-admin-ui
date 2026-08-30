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
  }
}
