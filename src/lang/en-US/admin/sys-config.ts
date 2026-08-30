export default {
  name: 'Name',
  namePlaceholder: 'Please enter parameter name',
  key: 'Key',
  keyPlaceholder: 'Please enter parameter key',
  builtIn: 'Built-in',
  builtInPlaceholder: 'System built-in',

  configId: 'ID',
  remark: 'Remark',
  peekValue: 'Value: {value}',
  // No trailing space: the Chinese full-width colon carries its own, English
  // takes the one the template already puts before the tag.
  peekFrontend: 'UI parameter:',
  yes: 'Yes',
  no: 'No',

  addTitle: 'Add Parameter',
  editTitle: 'Edit Parameter',
  configName: 'Parameter Name',
  configKey: 'Parameter Key',
  configValue: 'Parameter Value',
  configValuePlaceholder: 'Please enter parameter value',
  configType: 'System Built-in',
  isFrontend: 'Show in Frontend',
  isFrontendPlaceholder: 'Show in frontend?',
  remarkPlaceholder: 'Please enter content',

  // 'Settings' per the glossary, which reserves 'Parameters' for the menu entry.
  exportFilename: 'Settings',
  exportHeader: {
    configId: 'Parameter ID',
    configName: 'Parameter Name',
    configKey: 'Parameter Key',
    configValue: 'Parameter Value',
    remark: 'Remark',
    createdAt: 'Created At'
  },

  rules: {
    configName: 'Parameter name is required',
    configKey: 'Parameter key is required',
    configValue: 'Parameter value is required',
    isFrontend: 'Show in frontend is required'
  }
}
