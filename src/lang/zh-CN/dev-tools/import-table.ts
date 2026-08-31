/**
 * The generator's "import tables" dialog -- views/dev-tools/gen/importTable.vue.
 *
 * Its own file rather than keys under gen.ts, even though gen/index.vue is what
 * opens it, because the two disagree on what the same column is called:
 * gen.ts's tableComment is 菜单名称 (the menu the generator will produce) while
 * this dialog's is 表描述 (the comment MySQL holds on the table). Sharing a key
 * would eventually make one of them wrong.
 *
 * 创建时间 comes from common.createdAt, which eleven pages already share.
 * 更新时间 does not, because this is the only table in the interface that shows
 * it -- promoting a word used once would be the opposite of what common.ts is
 * for. The dialog's two buttons are common.dialogConfirm/dialogCancel.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD R5).
 */
export default {
  title: '导入表',

  tableName: '表名称',
  tableNamePlaceholder: '请输入表名称',
  tableComment: '表描述',
  tableCommentPlaceholder: '请输入表描述',
  updatedAt: '更新时间',

  selected: '已选 {count} 张表',
  imported: '导入成功'
}
