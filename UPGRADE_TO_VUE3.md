# go-admin-ui Vue3 升级实施文档

## 1. 项目分支说明
当前升级分支：`dev-to-vue3`

## 2. 升级目标
- Vue 2.x → Vue 3.x
- Element UI → Element Plus
- Babel、Webpack、ESLint、Jest 等工具包升级
- 其他安全性相关依赖（如 axios、lodash）升级
- **Node.js 版本升级**：从 >=8.9 升级到 >=18.0（推荐 LTS 版本）

## 3. 升级实施阶段

### 阶段零：环境准备（0.5 天） ✅ 已完成
- 检查当前 Node.js 版本（当前 v18.20.1 ✅）
- 升级 Node.js 到最新 LTS 版本（已满足要求）
- 升级 npm 到最新版本（已满足要求）
- 验证新环境下的项目能否正常运行基础命令（如 `npm install` ✅）

### 阶段一：准备与调研 ✅ 已完成
- 备份当前代码，确保可回滚。
- 盘点所有依赖，确认升级目标版本。
- 使用 npm-check-updates 生成升级清单 ✅
- 执行次要版本依赖升级 ✅
- 解决依赖冲突并安装新版本 ✅
- 验证项目基础功能（lint、test）✅

### 阶段二：依赖升级
- 使用 npm-check-updates 或手动修改 `package.json`，升级核心依赖。
- 执行 `npm install`，解决依赖冲突。
- 升级 Babel、Webpack、ESLint、Jest、axios、lodash 等工具包。

### 阶段三：代码适配与重构
- 全面适配 Vue 3 语法（如 Composition API、生命周期钩子变更）。
- 替换 Element UI 为 Element Plus，调整组件用法。
- 升级 vue-router、vuex，并适配新 API。
- 检查第三方库兼容性，必要时替换或移除。

### 阶段四：配置文件调整
- 更新 babel.config.js、webpack、eslint、jest 等配置文件。
- 检查并调整 polyfill、postcss、plop 等相关配置。

### 阶段五：测试与回归
- 运行单元测试，修复因升级导致的测试失败。
- 手动回归主要功能页面，确保无异常。
- 检查打包、部署流程是否正常。

### 阶段六：文档与说明
- 更新 README.md，说明升级内容及注意事项。
- 补充迁移指南，便于团队成员理解变更。

### 阶段七：评审与合并
- 团队代码评审，确认无重大问题后合并至主分支。

## 4. 当前进度总结
- ✅ Node.js 环境检查完成（v18.20.1）
- ✅ 依赖盘点完成，生成了 68 个可升级项
- ✅ 次要版本依赖升级完成（patch/minor 版本）
- ✅ 依赖安装成功，项目可正常运行
- ✅ ESLint 验证通过（发现 35 个问题，多数为代码风格问题）
- ⚠️ 单元测试部分失败（9 个失败，14 个通过），主要问题：
  - `time_str` 变量初始化问题（src/utils/index.js）
  - @vue/test-utils `contains` 方法弃用（测试代码需更新）

## 5. 参考迁移资源
- [Vue 2 → Vue 3 官方迁移指南](https://v3-migration.vuejs.org/)
- [Element UI → Element Plus 迁移文档](https://element-plus.org/zh-CN/guide/migration.html)
- [vue-router 4.x 文档](https://router.vuejs.org/)
- [vuex 4.x 文档](https://vuex.vuejs.org/)
- [Node.js LTS 版本说明](https://nodejs.org/en/about/releases/)

---

> 后续所有升级、重构、测试等工作请严格按照本实施文档分阶段推进。
