# Sass Legacy API 废弃警告处理说明

## 问题描述
编译时出现警告：
```
Deprecation Warning [legacy-js-api]: The legacy JS API is deprecated 
and will be removed in Dart Sass 2.0.0.
```

## 原因
- 项目当前使用 `sass-loader: ^13.3.3` + `sass: ^1.91.0`
- sass-loader 13.x 默认仍走 Dart Sass 的 legacy JS API（从 14.x 起才默认使用 modern API）
- Dart Sass 2.0 将移除此 API

## 解决方案

### 🎯 方案1：环境变量静默（已实施）✅

在 `.env.development` 和 `.env.production` 中添加：

```bash
SASS_SILENCE_DEPRECATIONS = 'legacy-js-api'
```

Dart Sass 会自动读取此环境变量并静默对应警告。

**优点**：
- ✅ 不需要重装依赖
- ✅ 不修改 webpack 配置
- ✅ 立即生效
- ✅ 官方推荐方式

**缺点**：
- ⚠️ 只是隐藏警告，未来 Dart Sass 2.0 可能不兼容

---

### 🚀 方案2：切换到 modern API（推荐长期方案）

升级 sass-loader 到 14+，默认使用 Dart Sass 的 modern API：

```bash
pnpm add -D sass-loader@^14.2.1
```

或在当前 13.x 下于 `vue.config.js` 中显式指定：

```js
css: {
  loaderOptions: {
    sass: { api: 'modern' }
  }
}
```

两种方式生效后即可移除环境变量配置。

**优点**：
- ✅ 彻底解决问题
- ✅ 面向未来兼容

**缺点**：
- ⚠️ 可能需要调整配置
- ⚠️ 需要重新安装依赖

---

## 当前状态

✅ **已采用方案1**，通过环境变量静默警告。

sass-loader 虽已是 13.3.3，但仍走 legacy API，因此静默配置目前仍然必要。
建议在未来 Vue 3 稳定后，按方案2 切换到 modern API 并移除该环境变量。

---

## 验证

重启开发服务器后，编译过程中不再显示该警告：

```bash
# 需要完全重启，而不是热重载
npm run dev
```

## 参考
- [Sass Legacy JS API](https://sass-lang.com/d/legacy-js-api)
- [Sass Silencing Deprecations](https://sass-lang.com/documentation/cli/dart-sass/#silencedeprecations)
- [sass-loader v13 文档](https://github.com/webpack-contrib/sass-loader/blob/master/CHANGELOG.md)

