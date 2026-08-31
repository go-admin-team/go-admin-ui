export default {
  tabBasic: 'Basic Information',
  tabColumns: 'Field Information',
  tabGen: 'Generation Information',

  hiddenColumns: '⚠️The id, create_by, update_by, created_at, updated_at and deleted_at columns are hidden from this list',

  // A row ordinal, not a key: 'No.' rather than the glossary's 'ID'
  index: 'No.',
  columnName: 'Column Name',
  columnComment: 'Description',
  // 物理类型 holds the SQL declaration (varchar(64), bigint). 'DB Type' says
  // that to a developer; 'Physical Type' is a literal that only means something
  // to someone who already knows the Chinese.
  columnType: 'DB Type',
  goType: 'Go Type',
  goField: 'Go Field',
  jsonField: 'JSON Field',

  isInsert: 'Form',
  isInsertTip: 'Whether the column appears in the add/edit form; ticked means it does',
  isList: 'List',
  isListTip: 'Whether the column appears in the list; ticked means it does',
  isQuery: 'Query',
  isQueryTip: 'Whether the column is a search condition; ticked means it is',
  queryType: 'Query Type',
  isRequired: 'Required',

  htmlType: 'Display Type',
  // The stored values are input / select / radio / textarea, so the labels are
  // the control names a developer reads in the generated template
  htmlTypes: {
    input: 'Input',
    select: 'Select',
    radio: 'Radio',
    textarea: 'Textarea'
  },

  dictType: 'Dictionary Type',
  fkTableName: 'Relation Table',
  // 关系表key / 关系表value pick the columns used as an option's value and
  // label, so 'Relation Table Key' would be both longer and less accurate
  fkLabelId: 'Relation Key',
  fkLabelName: 'Relation Value',

  back: 'Back',
  submit: 'Submit',
  validationFailed: 'Some fields are not valid. Please check the form before submitting.',
  saveSuccess: 'Saved successfully'
}
