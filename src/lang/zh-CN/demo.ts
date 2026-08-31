/**
 * The reference list page, which AGENTS.md points newcomers at.
 *
 * Its status labels are literals rather than a dictionary lookup, unlike every
 * real page -- `row.status === '1' ? '正常' : '停用'`. Migrated as they are
 * (PRD R5); turning them into a useDict call is a change to what the example
 * teaches and belongs in its own commit.
 */
export default {
  name: '名称',
  namePlaceholder: '请输入名称',
  code: '编码',
  codePlaceholder: '请输入编码',
  price: '单价',
  status: '状态',
  statusPlaceholder: '请选择状态',
  normal: '正常',
  disabled: '停用',
  remark: '备注',
  remarkPlaceholder: '请输入内容',
  rules: {
    name: '名称不能为空',
    code: '编码不能为空'
  }
}
