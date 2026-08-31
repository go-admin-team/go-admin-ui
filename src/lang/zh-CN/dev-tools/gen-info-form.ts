/**
 * The 生成信息 tab -- views/dev-tools/gen/genInfoForm.vue.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5), including the mismatch in `rules`: the fields are labelled 应用名 and
 * 接口路径 while their validation messages say 生成包路径 and 生成模块名. That
 * is what the page says today and it is copied rather than corrected.
 *
 * moduleNameTip carries a literal `{sys-user}`. Braces are vue-i18n's
 * interpolation syntax, so it is written with the literal-interpolation form
 * `{'{'}` -- plain braces would be parsed as a placeholder named `sys-user`.
 */
export default {
  tplCategory: '生成模板',
  tplCrud: '关系表（增删改查）',

  packageName: '应用名',
  packageNameTip: '应用名，例如：在app文件夹下将该功能发到那个应用中，默认：admin',

  businessName: '业务名',
  businessNameTip: '可理解为功能英文名，例如 user',

  functionName: '功能描述',
  functionNameTip: '同步的数据库表备注，用作类描述，例如：用户',

  moduleName: '接口路径',
  moduleNameTip: "接口路径，例如：api/v1/{'{'}sys-user{'}'}",

  // ── The tree section, shown only for tplCategory 'tree' ──────────
  otherInfo: '其他信息',
  treeCode: '树编码字段',
  treeCodeTip: '树显示的编码字段名， 如：dept_id',
  treeParentCode: '树父编码字段',
  treeParentCodeTip: '树显示的父编码字段名， 如：parent_Id',
  treeName: '树名称字段',
  treeNameTip: '树节点的显示名称字段名， 如：dept_name',
  selectPlaceholder: '请选择',

  rules: {
    tplCategory: '请选择生成模板',
    packageName: '请输入生成包路径',
    packageNamePattern: '只允许小写字母，例如 system',
    moduleName: '请输入生成模块名',
    moduleNamePattern: '只允许小写字母，例如 sys-demo',
    businessName: '请输入生成业务名',
    businessNamePattern: '字母开头，只允许 a-z 与 A-Z',
    functionName: '请输入生成功能名'
  }
}
