# AGENTS.md — go-admin-ui 前端

> 给 AI 编码工具与新贡献者的约定。**只写"不遵守就会出错"的规则**；依赖版本以
> `package.json` 为准，命令以其 `scripts` 为准，此处不复述，避免与代码脱节。
>
> 标准列表页的完整写法见 **`src/views/demo/`** —— 那是可构建、有测试、CI 会跑的
> 参照物。本文与它冲突时，以它为准。

## 页面结构

业务页面统一由 `BasicLayout` 包裹，内容放 `#wrapper` 插槽：

```vue
<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <!-- 搜索表单 → 操作按钮 → el-table → AppPagination -->
      </el-card>
    </template>
  </BasicLayout>
</template>
```

**组件 `name` 必须与后端菜单配置的 `menu_name` 一致** —— `keep-alive` 的 `include`
按组件名匹配，而缓存名单存的是路由名。不一致时缓存会静默失效，没有任何报错。
（`loadView` 已做运行时兜底，但源码仍应保持一致，便于排查。）

## 列表页优先使用 crud mixin

分页查询、搜索重置、多选、新增/修改弹窗、删除确认这几段逻辑在各页面实现完全
相同，已收敛到 `@/mixins/crud`。页面只需声明差异部分：

```js
import crud from '@/mixins/crud'

export default {
  name: 'DemoProduct',        // 必须与后端菜单的 menu_name 一致
  mixins: [crud],
  created() { this.getList() },
  methods: {
    crudOptions() {
      return {
        idKey: 'id',
        api: { list, get, add, update, del },
        defaultForm: () => ({ id: undefined, name: undefined })
      }
    }
  }
}
```

mixin 提供 `list` `total` `loading` `ids` `single` `multiple` `open` `title`
`form` `queryParams` 等状态，以及 `getList` `handleQuery` `resetQuery`
`handleSelectionChange` `handleAdd` `handleUpdate` `handleDelete` `cancel`
`submitForm` 等方法，页面中直接使用，不要重复实现。

完整示例见 `src/views/demo/product/index.vue`。

## API 层

按模块放在 `src/api/`，统一走 `@/utils/request`：

| 操作 | 函数名 | 方法 |
|---|---|---|
| 列表 | `list{Resource}` | GET |
| 详情 | `get{Resource}` | GET |
| 新增 | `add{Resource}` | POST |
| 修改 | `update{Resource}` | PUT |
| 删除 | `del{Resource}` | DELETE |

响应结构为 `{ code, data, msg }`，`code === 200` 为成功。拦截器已统一处理
401/403 与错误提示，业务代码只需判断 `code`。

**上传文件必须传 `FormData`** —— 拦截器会据此跳过 `Content-Type`，交由浏览器写入
带 boundary 的 `multipart/form-data`。手工设置该头会导致文件被序列化成 JSON 丢失。

## 权限

```vue
<el-button v-permisaction="['admin:sysPost:add']">新增</el-button>
```

标识格式 `模块:资源:操作`，需与后端 `sys_menu` 中的配置一致。
角色级控制用 `v-permission="['admin']"`。

## 路由

页面路由由后端菜单动态生成（`store/modules/permission.js`），前端只维护
`router/index.js` 中的固定路由（登录、首页、错误页等）。

`meta` 字段：`title` `icon` `noCache` `affix` `hidden` `breadcrumb`。

**承载子路由的位置一律用 `RouterViewKeepAlive`，不要写裸 `<router-view />`** ——
后者渲染出的页面不受 `keep-alive` 管辖，多级菜单的缓存会失效。

## 全局可用

无需 import 即可使用：

- 组件：`<BasicLayout>` `<AppPagination>` `<SvgIcon>` `<CodeEditor>`
- 指令：`v-permisaction` `v-permission` `v-dialogDrag`
- 方法：`this.$getDicts` `this.$parseTime` `this.$selectDictLabel`
  `this.$msgSuccess` `this.$msgError`
- Element Plus 图标已全局注册，模板中直接 `<el-icon><User /></el-icon>`

## Vue 3 注意事项

项目使用 Options API。以下 Vue 2 写法在当前版本**无效**，不要产出：

| 失效写法 | 应改为 |
|---|---|
| `slot-scope="scope"` | `#default="scope"` |
| `:visible.sync` `:page.sync` | `v-model:visible` `v-model:page` |
| `@keyup.enter.native` | `@keyup.enter` |
| `filters` 选项 | `$filters.xxx(val)` |
| `this.$set` / `this.$delete` | 直接赋值 |
| 指令 `bind` / `inserted` / `unbind` | `beforeMount` / `mounted` / `unmounted` |

`el-tag` 的 `type` 只接受 `primary/success/info/warning/danger`，**空字符串是非法值**，
会在每次渲染时触发 prop 校验告警。

## 图标

```vue
<svg-icon icon-class="add-db" />   <!-- src/icons/svg/ 下的文件名 -->
<i class="ri-home-line" />          <!-- Remix Icon 字体 -->
```

新增 SVG 后执行 `pnpm run svgo` 清理 `fill` 属性 —— 否则图标无法跟随主题色。

## 提交规范

格式 `type+emoji: 描述`：

`feat✨` `fix🐛` `style💄` `docs📝` `perf👌` `test✅` `refactor🎨` `chore🔧`

一个提交只做一件事。改动跨越多个语义时拆分提交，不要混在一起。

## 红线

- 不引入需要从外部 CDN 加载的资源 —— 内网与离线部署是常见场景
- 不在业务代码里写死后端地址，一律通过 `VUE_APP_BASE_API`
- 删除组件前先确认零引用（`grep` 文件路径、标签名、全局注册三处）
- 提交前跑 `pnpm run lint` 与 `pnpm run test:unit`
