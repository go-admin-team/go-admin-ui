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

### 列宽：文字列一律 `min-width`，不要用 `width`

`width` 是刚性的，列宽预算加起来超过容器时表格会横向溢出，而 `fixed="right"` 的操作列
会**盖住**相邻列而不是滚过去 —— 在 1280px 这个最常见的笔记本宽度上就会发生。
`min-width` 允许 el-table 压缩列以适应容器，并把富余宽度还给它们。

只有这三类才用 `width`：选择框列、内容是固定控件的列（如状态开关）、`fixed` 的操作列。

粗算一下：1280px 窗口下表格容器约 840px。减去选择框 45 + 状态 82 + 操作 140，
留给文字列的是约 580px。**超了就会溢出，没有任何报错。**

### 操作列

用 ProTable 的 `#actions` 插槽，不要自己写 `<el-table-column fixed="right">` ——
插槽会带上固定列必须的 `class-name`（否则单元格换行，只有固定列变高，和滚动区的行对不齐）。
存量页面里有 `class-name="small-padding fixed-width"` 的旧写法，新页面不要沿用。

**每行最多两个直接按钮**，其余进溢出菜单。三个文字按钮会让操作列成为整表最宽的列，
而它又是固定的，于是它就是那个盖住别人的。

### 工具栏按钮的层级

- **新增**：`type="primary"`（始终可用，是页面主操作）
- **依赖选中的批量操作**（修改/删除）：次级按钮，删除加 `type="danger" plain`

**不要给它们用填充按钮。** Element Plus 的禁用填充按钮是"浅色填充 + 白字"，
实测亮色下是 `oklab(0.81)`、暗色下 `oklab(0.36)` —— 看起来像渲染坏了或像启用状态，
都不像禁用。次级按钮的禁用态靠文字颜色表达，一眼可辨。

### 时间列用 `<DateCell :value="row.createdAt" />`

列里显示日期，完整时间戳挂在 `title` 上。带排序箭头的表头加上 `2026-08-01 14:00`
需要约 141px，占掉文字列预算的四分之一，会导致单元格换行、每行高 14px。

### 移动端：窄屏自动换成卡片

768px 以下 `ProTable` 把表格换成卡片列表，操作按钮改为左滑呼出。
**页面默认不需要做任何事**，卡片各部分取自列的声明顺序：

| 卡片位置 | 取自 |
|---|---|
| 标题 | 第一个不是主键的列 |
| 副标题（收起时也可见，只有两个位置） | 其后两列 |
| 徽章 | `prop` 是 `status`/`state` 且有自定义渲染的列 |
| 展开区 | 其余列，主键列排在最后 |
| 左滑按钮 | `#actions` 插槽 |

所以**调整列顺序会改变移动端的信息层级**，不再只是改变桌面端的左右位置。

15 个列表页里有 9 个第一列是主键（`userId`、`roleId`、`dictCode`…），
所以主键列会自动让位——否则卡片标题就是一个「1」。判断依据是 `prop`：
`id`/`code`，或以 `Id`/`Code` 结尾。

**两条规则都只看 `prop`，不看 label。** label 是给人看的标题，页面接入 i18n 之后
它是读者选的那门语言——按 label 匹配的规则会在中文下正常、在英文下**静默失效**：
不报错、不空白，卡片只是又拿主键当标题、徽章整个消失。`prop` 是代码标识符，不随语言变。

徽章认不出来时才标 `card-role="badge"`，**不要为了让它认出来去改 `prop`**。
`sys-config` 的「内置」列（`configType`）就是这种：它确实是徽章，但不是状态。
把匹配模式放宽到能顺带捞到它，正是旧规则的下场——旧规则按 label 里的
状态/内置/类型/是否 取**第一个**匹配，于是在字典页选中了「字典类型」、
在代码生成页选中了「go类型」，两个都不是状态，只是排在前面。

默认不合适时在列上标 `card-role`，**标了就要维护，非必要不标**：

- `card-role="title"` —— 指定标题列
- `card-role="badge"` —— 提到标题右侧
- `card-role="hidden"` —— 移动端不渲染

长文本列（JSON、长 URL、备注）在卡片里默认截断到 3 行，所以忘了标注也不会
把列表撑开几屏。**确实不该出现在移动端的列**才标 `hidden`。

列的 `#default` 会被卡片**原样复用**，状态开关、`DateCell`、权限按钮都不用为移动端
重写。但**自定义渲染里不要写死像素宽度** —— 卡片可用宽度比表格列窄，写死的会溢出。

`ProTable` 自身：`card`（默认 `true`，置 `false` 则始终用表格，适合本身就靠横向
对照的表格）、`card-breakpoint`（默认 `768`）。

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
  api: delProduct,
  onSuccess: () => table.getList()
})
// 模板：@click="remove(row.id)" / @click="remove(table.selectedIds)"
```

### useTable 的几个选项

- **`paginated: false`** —— 接口一次返回整个集合、页面本来就没有分页器时用（部门树、菜单树）。
  不发分页键，响应体当集合读，`ProTable` 也不渲染分页器。
- **`defaultSort: { prop, order }`** —— 列表默认按某列排序时用。它同时记住"当前排序的是哪一列"，
  否则第一次手动排序会把新键**加在**默认键旁边，后端收到两个互相矛盾的排序。
  同一个值也传给 `ProTable`，表头箭头才会一致。
- **`immediate: false`** —— 首次加载要等别的东西就绪时用。

### 导出用 `useExport`

```ts
const { exportExcel, exporting } = useExport()

const handleExport = () => exportExcel({
  header: ['编号', '名称'],
  fields: ['id', 'name'],
  rows: table.rows,
  filename: '岗位管理'
})
```

**不要自己 import 写出器** —— 之前 5 个页面各抄了一份手工拼工作簿的代码。
写出器由 `useExport` 动态载入，只有真的点了导出才会下载它；表格与列宽的构造在
`src/utils/workbook.ts`，有单元测试。
导出的是**传进去的行**，也就是当前这一页，不是整个集合；默认确认文案已经这么说了。

比 mixin 好在哪：**一个页面可以调多次**。mixin 把名字合并进组件，一页只能用一次，
所以需要第二个表单的页面只能整个绕开它 —— 17 个列表页里有 16 个就是这么做的。
`sys-user` 现在同页挂了两个 `useForm`（编辑、重置密码），互不干扰。

三条必须知道的行为：

- **提交有防重**。`submit()` 在飞行中会直接返回 `false`，不会发第二次请求。
  `useRemove` 同理。**别自己写 `ElMessageBox.confirm` + 删除的那一套** ——
  手写版本区分不了"用户点了取消"和"服务端报错"，这正是旧 mixin 的老问题。
- **拦截器已经报过错**。`utils/request.ts` 对非 200 直接 reject 并弹了消息，
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
`useExport` / `useDict` 同理。**判据只有一条：调用方是属性访问就 `reactive()`，
是解构就返回裸 ref。** 两者搞反不会报错——裸对象里的 computed 被属性访问取出来时
不解包，模板拿到的是 `ComputedRef`，组件只在控制台刷
`Invalid prop: type check failed`，功能照常。`useTreePicker` 曾经就是这样，
`sys-dept` 一轮 e2e 刷 18 条、`sys-menu` 22 条，页面看不出任何异常。

### composable 的内置文案跟随语言

`useRemove` 的确认框（标题/正文/两个按钮）、`useForm` 的对话框标题与提交成功提示，
默认值都从语言包取，**不用页面再传**。composable 没有组件实例，走
`import { i18n } from '@/lang'` + `i18n.global.t(...)`，且**取值必须发生在每次用到的时候**——
写在函数体、computed 或回调里都行，直接写成 `useXxx({ title: t('...') })` 这种在
setup 阶段就求值的形式不行，那等于把整个页面钉死在打开时的语言。

页面要覆盖默认值时，凡是"取一次就固定"的选项都收 `MaybeRef`，传 `computed(() => t(...))`：

| 选项 | 类型 |
|---|---|
| `useForm` 的 `rules` | `MaybeRef<FormRules>` |
| `useForm` 的 `title.create` / `title.edit` | `MaybeRef<string>` |
| `useTreePicker` 的 `rootLabel` | `MaybeRef<string>` |

`useRemove` 的 `confirmText` 不需要，它本来就是 `(count) => string`，每次开框都重新调用。

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

类型参数描述的是**信封**而不是 payload —— 拦截器把 `{ code, data, msg }` 直接返回给调用方，
而不是 axios 包着它的那层；原因写在 `src/utils/request.ts` 做这件事的那几行旁边。
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

页面路由由后端菜单动态生成（`src/stores/permission.ts`），前端只维护
`router/index.js` 中的固定路由（登录、首页、错误页等）。

`meta` 字段：`title` `icon` `noCache` `affix` `hidden` `breadcrumb`。

**承载子路由的位置一律用 `RouterViewKeepAlive`，不要写裸 `<router-view />`** ——
后者渲染出的页面不受 `keep-alive` 管辖，多级菜单的缓存会失效。

### 打包应用的 `component` 必须以 `apps/` 开头

`apps.config.mjs` 配置的第三方/商店应用，页面由 `scripts/sync-apps.mjs` 复制进
`src/apps/<code>/`；`stores/permission.ts` 的 `appPath()` 只认**第一段是 `apps`**
的路径去那里找组件，其余一律当成主仓内置视图去 `src/views/` 下找。

所以给打包应用写菜单种子，`component` 必须是：

```
apps/<code>/<该应用内的相对路径>/index
```

比如 `code: 'order'` 的应用要写成 `apps/order/index`，**不能**写成
`/order/index` —— 第一段是 `order` 而不是 `apps`，会被当成内置视图去找一个
不存在的 `src/views/order/index.vue`，表现上同样会摔到 `AppNotInstalled`
占位，但控制台报的是 views 路径，跟真实原因（漏了 `apps/` 前缀）对不上，
排查时容易被带偏。

`source` 目录内容原样搬进 `src/apps/<code>/`，不会在 `code` 之外自动再插一层
——想要 `apps/<code>/index` 这种最短形式，`source` 就要直接指到该应用自己
"这一个页面模块"的目录，而不是应用仓库的 `views` 根目录。

## 多语言

**新代码不要写中文字面量。** 界面上的每一句话都从语言包取：

```vue
<template>
  <el-button>{{ $t('common.add') }}</el-button>          <!-- Options API 页面照样能用 -->
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
msgSuccess(t('admin.sysUser.resetOk'))
</script>
```

没有组件实例的地方（`utils/`、`composables/`）用 `import { i18n } from '@/lang'` 再 `i18n.global.t(...)`。

语言包在 `src/lang/{语言}/`，**目录结构与 `src/views/` 一一对应**，所以"新页面的文案放哪"
不需要决策，照抄路径即可。高频公共词（新增/修改/删除/确定/取消…）一律先查 `common.ts`，
**有就复用**，别在各页面重复定义——`pnpm check:i18n` 会把只用一次的公共词报成死键。

key 分层命名（`admin.sysUser.resetPassword`），**不要用中文原文当 key**：
中文短句当 key，改一次措辞就要连带改所有引用点。

### 菜单和字典的文案不走 `t()`

它们来自数据库，键是后端的 `menu_name` 和 `dict_type`+`dict_value`：

```ts
import { routeTitle, translateDictLabel } from '@/lang/backend'
```

**查不到就回退数据库原值，而且这是正常状态**——用户自建的菜单永远不会在语言包里。
所以这条路径故意不经过 `t()`/`te()`：那会为每个自建菜单打一条 missing-key 警告，
而用 `missingWarn: false` 关掉它，会连普通语言包里真正的遗漏一起消音。两种"查不到"性质不同。

`zh-CN` 目录下**没有也不要加** `menu.ts` / `dict.ts`——中文本来就是数据库里的值，
加一份等于给同一批文案造第二个源头，改菜单名时两边就会对不上。

### 加一门语言

复制 `src/lang/en-US/` 改译文，在 `src/lang/locales.ts` 的 `LOCALES` 里加一行。
**不改表结构、不改后端、不需要数据库迁移。**

两道 CI 检查看着它：`tests/unit/lang/parity.spec.ts` 比对两棵 key 树是否对称（menu/dict 除外，
它们的正确形态就是不对称的）；`pnpm check:i18n` 拿 `menu.ts`/`dict.ts` 的键去核对后端
`config/db.sql` 的种子数据，键对不上就是拼错了。

### 迁移存量页面时

**zh-CN 的值必须与页面当前渲染的文字逐字一致**，一个标点都不能改。e2e 里有 300 多处中文断言，
"中文界面逐字不变"正是迁移正确性的验收标准，那些断言是免费的回归保护。
遇到明显别扭的措辞（`Header 固定`、`侧边栏Logo` 这种中英混排）也照抄——
改措辞是另一件事，单独一个提交、单独改测试。

e2e 的浏览器语言在 `playwright.config.ts` 里钉死为 `zh-CN`。别去掉：应用跟随
`navigator.language`，而 Playwright 默认 en-US，去掉之后整套中文断言会一起变红。

## 全局可用

无需 import 即可使用：

- 指令：`v-permisaction` `v-permission`
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
  - 唯一例外是 Google Analytics 标签，且**受 `VUE_APP_GA_ID` 开关控制**：
    仓库里所有 `.env` 都留空，构建产物中不会出现任何 googletagmanager 引用，
    只有演示站部署（`build.yml`）才注入。`tests/unit/build/google-analytics.spec.ts`
    守着这个开关。要再加例外，先想清楚离线部署怎么办
- 不在业务代码里写死后端地址，一律通过 `VUE_APP_BASE_API`
- 删除组件前先确认零引用（`grep` 文件路径、标签名、全局注册三处）
- 提交前跑 `pnpm run lint` 与 `pnpm run test:unit`
