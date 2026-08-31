export default {
  tplCategory: 'Generation Template',
  tplCrud: 'Relational Table (CRUD)',

  // The Go project generates into app/<name>/, so 'App Name' names the thing
  // the reader will go looking for
  packageName: 'App Name',
  packageNameTip: 'The application name -- which app under the app folder this feature is generated into. Default: admin',

  businessName: 'Business Name',
  businessNameTip: 'The feature name in English, e.g. user',

  functionName: 'Feature Description',
  functionNameTip: 'The table comment synced from the database, used as the class description, e.g. User',

  moduleName: 'API Path',
  moduleNameTip: "The API path, e.g. api/v1/{'{'}sys-user{'}'}",

  // The Chinese messages name fields the form no longer has (生成包路径 for
  // 应用名, 生成模块名 for 接口路径); the English keeps that mismatch rather
  // than quietly fixing one language and not the other
  rules: {
    tplCategory: 'Please select a generation template',
    packageName: 'Please enter the app name',
    packageNamePattern: 'Lowercase letters only, e.g. system',
    moduleName: 'Please enter the API path',
    moduleNamePattern: 'Lowercase letters only, e.g. sys-demo',
    businessName: 'Please enter the business name',
    businessNamePattern: 'Must start with a letter; only a-z and A-Z are allowed',
    functionName: 'Please enter the function name'
  }
}
