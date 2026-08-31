/**
 * The 基本信息 tab -- views/dev-tools/gen/basicInfoForm.vue.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). `rules` repeats two of the placeholders word for word; they are kept as
 * separate keys because a placeholder and a validation message are different
 * roles, and one being reworded should not silently reword the other.
 *
 * The commented-out 是否逻辑删除 block in the template is deliberately not here:
 * it renders nothing, and translating dead markup invites someone to uncomment
 * it later and find half a form.
 */
export default {
  tableName: '数据表名称',
  tableNameTip: '数据库表名称，针对gorm对应的table()使用，⚠️这里必须是蛇形结构',
  tableNamePlaceholder: '请输入表名称',

  tableComment: '菜单名称',
  tableCommentTip: '同步的数据库表名称，生成配置数据时，用作菜单名称',
  tableCommentPlaceholder: '请输入菜单名称',

  className: '结构体模型名称',
  classNameTip: '结构体模型名称，代码中的struct名称定义使用',
  classNamePlaceholder: '请输入',

  functionAuthor: '作者名称',
  functionAuthorPlaceholder: '请输入作者名称',

  remark: '备注',

  rules: {
    tableName: '请输入表名称',
    tableNamePattern: '只允许小写字母，例如 sys_demo',
    tableComment: '请输入菜单名称',
    className: '请输入模型名称',
    classNamePattern: '必须以大写字母开头，例如 SysDemo',
    functionAuthor: '请输入作者',
    functionAuthorPattern: '只允许字母 a-z 或 A-Z'
  }
}
