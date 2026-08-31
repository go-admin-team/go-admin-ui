/**
 * The generated-table editor -- views/dev-tools/gen/editTable.vue.
 *
 * The 字段信息 tab is a developer's table: its headers name Go and SQL
 * artefacts rather than business concepts, so the English side uses the words a
 * developer already knows (Go Type, JSON Field) instead of a literal rendering.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD R5).
 */
export default {
  // ── Tabs ────────────────────────────────────────────────────────
  tabBasic: '基本信息',
  tabColumns: '字段信息',
  tabGen: '生成信息',

  hiddenColumns: '⚠️表字段中的id、create_by、update_by、created_at、updated_at、deleted_at的字段在此列表中已经隐藏',

  // ── Column table ────────────────────────────────────────────────
  // type="index", so this 序号 is the row ordinal -- gen.tableId is the key
  index: '序号',
  columnName: '字段列名',
  columnComment: '字段描述',
  columnType: '物理类型',
  goType: 'go类型',
  goField: 'go属性',
  jsonField: 'json属性',

  // 「表单」rather than 「编辑」, which is what this column said until now.
  // The checkbox is bound to is_insert, and is_insert decides whether the column
  // appears in the generated 添加或修改 dialog -- a form used for both. Read next
  // to 列表 and 查询, which say where else a column shows up, 「编辑」 reads as
  // "may be edited" -- which is is_edit, the one flag it does not control.
  isInsert: '表单',
  isInsertTip: '是否出现在新增/修改表单中，打勾表示出现',
  isList: '列表',
  isListTip: '是否在列表中展示，打勾表示展示',
  isQuery: '查询',
  isQueryTip: '是否作为搜索条件，打勾表示作为条件',
  queryType: '查询方式',
  isRequired: '必填',

  htmlType: '显示类型',
  htmlTypes: {
    input: '文本框',
    select: '下拉框',
    radio: '单选框',
    textarea: '文本域'
  },

  dictType: '字典类型',
  fkTableName: '关系表',
  fkLabelId: '关系表key',
  fkLabelName: '关系表value',

  // ── Footer ──────────────────────────────────────────────────────
  back: '返回',
  submit: '提交',
  validationFailed: '表单校验未通过，请重新检查提交内容',
  saveSuccess: '保存成功'
}
