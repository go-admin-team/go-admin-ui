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
  },

  set: {
    sidebarTitle: 'System Settings',
    sidebarSub: 'Basic information and appearance',
    basic: 'Basic Information',
    basicSub: 'Name, logo, password',
    appearance: 'Appearance',
    appearanceSub: 'Skin and theme',

    basicTitle: 'Basic System Information',
    basicDesc: 'Set the system name, the logo and the default user password',
    logoEmpty: 'No logo',
    logoName: 'System Logo',
    logoHint: '200×200 recommended, JPG or PNG, up to 2MB',
    upload: 'Upload Image',
    appName: 'System Name',
    appNamePlaceholder: 'Please enter system name',
    initPassword: 'Initial User Password',
    initPasswordPlaceholder: 'Please enter the initial password',

    appearanceDesc: 'Adjust the skin and the sidebar theme',
    skin: 'Skin',
    skinPlaceholder: 'Please select a skin',
    skinBlue: 'Blue',
    sideTheme: 'Sidebar Theme',
    sideThemePlaceholder: 'Please select a sidebar theme',
    themeHint: 'Click to switch theme',
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',

    save: 'Save Settings',
    // 'Saved', not 'Updated': the same wording the composables use for a
    // persisted change.
    saveOk: 'Saved successfully',
    logoTooLarge: 'The file is larger than 2MB',

    rules: {
      appName: 'Please enter system name',
      initPassword: 'Please enter the initial password'
    }
  }
}
