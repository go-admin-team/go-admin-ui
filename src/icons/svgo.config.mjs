// svgo 4 不再支持 yml 配置，仅接受 .js / .mjs / .cjs
//
// 移除 fill 相关属性，使图标颜色可由 CSS 的 currentColor 接管 —— SvgIcon
// 组件依赖这一点来跟随主题色，图标自带的 fill 会覆盖它。
export default {
  plugins: [
    {
      name: 'removeAttrs',
      params: {
        attrs: ['fill', 'fill-rule']
      }
    }
  ]
}
