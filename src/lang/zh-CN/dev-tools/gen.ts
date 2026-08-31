/**
 * The code generator's table list -- views/dev-tools/gen/index.vue.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). Two spellings that look like duplicates and are not: this page's 编辑
 * button says 编辑 while every other list page says 修改 (common.edit), and its
 * 表名称 is the plain table name while basicInfoForm's is 数据表名称. Both are
 * kept as they are; unifying the Chinese is a separate change.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  tableName: '表名称',
  tableNamePlaceholder: '请输入表名称',
  tableComment: '菜单名称',
  tableCommentPlaceholder: '请输入菜单名称',

  // ── Toolbar ─────────────────────────────────────────────────────
  import: '导入',

  // ── Columns ─────────────────────────────────────────────────────
  // Bound to tableId, so this 序号 is a primary key -- editTable's 序号 is a
  // row ordinal and translates differently.
  tableId: '序号',
  className: '模型名称',

  // ── Row actions ─────────────────────────────────────────────────
  edit: '编辑',
  preview: '预览',
  moreActions: '更多操作',
  generateToProject: '生成到项目',
  generateConfig: '生成配置',
  generateMigration: '生成迁移脚本',

  // ── Preview dialog ──────────────────────────────────────────────
  previewTitle: '代码预览',

  // Passed to useRemove's confirmText, which is called when the dialog opens
  deleteConfirm: '确认删除选中的 {count} 张表的生成配置？',
  generated: '已生成'
}
