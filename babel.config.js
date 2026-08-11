// 仅供 jest 转译使用；生产与开发构建由 Vite/esbuild 处理，不经过 babel。
// 原先的 @vue/cli-plugin-babel/preset 随 Vue CLI 一并移除；
// dynamic-import-node 插件也已删除 —— 它曾导致开发模式下 import() 被转为同步 require，
// 使动态路由组件解析异常，Vite 下不存在该问题。
module.exports = {
  // 使用 @vue/babel-preset-app（独立包，不依赖 @vue/cli-service）：
  // 它会一并转译 vue3-jest 编译模板后产生的 ESM 渲染函数，
  // 单用 @babel/preset-env 会遗漏这部分，导致组件测试报
  // "Cannot use import statement outside a module"
  presets: [
    ['@vue/babel-preset-app', { targets: { node: 'current' } }]
  ]
}
