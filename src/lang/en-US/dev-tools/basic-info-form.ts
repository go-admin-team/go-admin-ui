export default {
  // 数据表名称 here and 表名称 on the list page name the same thing
  tableName: 'Table Name',
  tableNameTip: 'The database table name, used by gorm for table(). ⚠️It must be snake_case.',
  tableNamePlaceholder: 'Please enter table name',

  tableComment: 'Menu Name',
  tableCommentTip: 'The database table name that was synced; used as the menu name when the configuration data is generated',
  tableCommentPlaceholder: 'Please enter menu name',

  className: 'Struct Model Name',
  classNameTip: 'The struct model name, used for the struct definition in the generated code',
  classNamePlaceholder: 'Please enter',

  functionAuthor: 'Author Name',
  functionAuthorPlaceholder: 'Please enter author name',

  remark: 'Remark',

  rules: {
    tableName: 'Please enter table name',
    tableNamePattern: 'Lowercase letters only, e.g. sys_demo',
    tableComment: 'Please enter menu name',
    className: 'Please enter model name',
    classNamePattern: 'Must start with an uppercase letter, e.g. SysDemo',
    functionAuthor: 'Please enter author',
    functionAuthorPattern: 'Letters a-z or A-Z only'
  }
}
