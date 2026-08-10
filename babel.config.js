module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    '@vue/babel-plugin-jsx'
  ],
  env: {
    development: {
      plugins: ['dynamic-import-node']
    }
  }
}
