# AGENTS.md — go-admin-ui 前端

> 给 AI 编码工具与新贡献者的约定。**只写"不遵守就会出错"的规则**；依赖版本以
> `package.json` 为准，命令以其 `scripts` 为准，此处不复述，避免与代码脱节。
>
> 标准列表页的完整写法见 **`src/views/demo/`** —— 那是可构建、有测试、CI 会跑的
> 参照物。本文与它冲突时，以它为准。

## 页面结构

业务页面用 `PageContainer` 包裹，列表部分交给 `ProTable`：

```vue
<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="id">
      <template #search><!-- el-form-item --></template>
      <template #toolbar><!-- 操作按钮 --></template>
      <!-- el-table-column，照常写 -->
    </ProTable>
  </PageContainer>
</template>
```

`ProTable` 只接管重复的管道：搜索表单外壳、搜索/重置按钮、`el-table` 的
loading/data/selection/sort 绑定、分页。**列仍然写 `<el-table-column>`**，
Element Plus 的插槽能力一个都没少。传给它的其余属性会落到内部的 `el-table` 上
（`border`、`max-height` 等照常可用）。

搜索框**不要再写 `@keyup.enter`** —— 搜索按钮是 `native-type="submit"`，回车已经
统一走表单提交；自己再加一遍，在只有一个文本框的搜索栏上会发两次请求。

`BasicLayout` + `#wrapper` 是旧写法，新页面不要再用。

**组件 `name` 必须与后端菜单配置的 `menu_name` 一致** —— `keep-alive` 的 `include`
按组件名匹配，而缓存名单存的是路由名。不一致时缓存会静默失效，没有任何报错。
`<script setup>` 里用 `defineOptions({ name: 'XxxManage' })` 声明。
（`loadView` 已做运行时兜底，但源码仍应保持一致，便于排查。）

## 列表页用 composables，不要再写 mixin

`@/mixins/crud` 已删除。分页查询、搜索重置、多选、新增/修改、提交防重这些逻辑
收敛到 `@/composables`，页面只声明差异部分：

```ts
const table = useTable<Product, ProductQuery>({
  api: listProduct,
  idKey: 'id',
  defaultQuery: () => ({ name: undefined, status: undefined })
})

const form = useForm<Product, number>({
  defaultModel: () => ({ id: undefined, name: undefined }),
  idKey: 'id',
  api: { get: getProduct, add: addProduct, update: updateProduct },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: ids => delProduct({ ids: ids.map(Number) }),
  onSuccess: () => table.getList()
})
// 模板：@click="remove(row.id)" / @click="remove(table.selectedIds)"
```

比 mixin 好在哪：**一个页面可以调多次**。mixin 把名字合并进组件，一页只能用一次，
所以需要第二个表单的页面只能整个绕开它 —— 17 个列表页里有 16 个就是这么做的。
`sys-user` 现在同页挂了两个 `useForm`（编辑、重置密码），互不干扰。

三条必须知道的行为：

- **提交有防重**。`submit()` 在飞行中会直接返回 `false`，不会发第二次请求。
  `useRemove` 同理。**别自己写 `ElMessageBox.confirm` + 删除的那一套** ——
  手写版本区分不了"用户点了取消"和"服务端报错"，这正是旧 mixin 的老问题。
- **拦截器已经报过错**。`utils/request.js` 对非 200 直接 reject 并弹了消息，
  所以 `.then(res => res.code === 200 ? ... : ...)` 的 else 分支是死代码。
  `onError` 只用来做额外处理，**不要再弹一次**。
- **`resetQuery()` 用工厂重建**，不是 `resetFields()`。后者只还原带 `prop` 的字段，
  从搜索表单之外设进来的过滤条件（点部门树、图表下钻）会残留。

`useTable` / `useForm` 返回的是 `reactive()` 对象，模板里直接 `table.loading`、
`form.model.name` 即可，**不用 `.value`，也不用解构**。

el-form 用 **`:ref="form.bindFormRef"`** 绑定（注意有冒号，是表达式）。
不要写 `ref="form.formRef"` —— 不带冒号的 `ref` 认的是 setup 绑定名而非表达式，
匹配不到就让校验被静默跳过。`useForm` 现在会在"声明了 rules 却没拿到 el-form"时
`console.warn`，但别依赖它兜底。

`useRemove` 是例外，返回的是 ref，因为它的用法是解构（`const { remove } = ...`）；
解构 reactive 对象会丢失响应性，解构出来的 ref 反而能在模板里自动解包。

字典用 `useDict`（模块级缓存，同一字典全站只取一次）：

```ts
const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')
```

完整示例见 `src/views/demo/product/index.vue`；复杂场景（部门树联动、两个表单、
排序、批量删除）见 `src/views/admin/sys-user/index.vue`。

## API 层

按模块放在 `src/api/`，统一走 `@/utils/request`：

| 操作 | 函数名 | 方法 |
|---|---|---|
| 列表 | `list{Resource}` | GET |
| 详情 | `get{Resource}` | GET |
| 新增 | `add{Resource}` | POST |
| 修改 | `update{Resource}` | PUT |
| 删除 | `del{Resource}` | DELETE |

响应结构为 `{ code, data, msg }`。**拦截器对 `code !== 200` 直接 reject 并弹了消息**，
所以业务代码拿到的 resolve 一定是成功；`if (res.code === 200)` 的 else 分支永远不会
执行，不要再写。失败要 catch，但只用来恢复自己的状态（loading/submitting），
不要重复提示。

新增或修改 api 模块时写成 `.ts` 并带上类型参数 —— 这是 `useTable` / `useForm`
能推导出行列类型的前提：

```ts
export function listUser(query: SysUserQuery & PageQuery) {
  return request<ApiResponse<PageResult<SysUser>>>({ url: '/api/v1/sys-user', method: 'get', params: query })
}
```

类型参数描述的是**信封**而不是 payload，原因见 `src/utils/request.d.ts`。
调用尚未转 TS 的模块时用 `asApi<T>()` 在调用点断言（`src/types/api.ts`），
每一处都是后续要删掉的临时措施。

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

- 指令：`v-permisaction` `v-permission` `v-dialogDrag`
- 组件：`<BasicLayout>` `<AppPagination>` `<SvgIcon>` `<CodeEditor>`
  （前两个是存量页面用的旧写法，新页面用 `PageContainer` / `ProTable`，显式 import）
- Element Plus 图标已全局注册，模板中直接 `<el-icon><User /></el-icon>`

`this.$getDicts` `this.$parseTime` `this.$msgSuccess` 这类挂在 globalProperties 上的
方法**只在 Options API 组件里可用**。`<script setup>` 没有 `this`，一律改 import：

| 旧 | 新 |
|---|---|
| `this.$msgSuccess` / `this.$msgError` | `import { msgSuccess, msgError } from '@/utils/message'` |
| `this.$parseTime` | `import { parseTime } from '@/utils/costum'` |
| `this.getDicts(...)` | `useDict('...')` |
| `this.resetForm('form')` | `useForm` 的 `reset()`（没有直接的 import 等价物） |

## Vue 3 注意事项

新代码一律 `<script setup lang="ts">` + Composition API；存量 Options API 页面
正在按批次迁移，不要在新页面里沿用。以下 Vue 2 写法在当前版本**无效**，不要产出：

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
