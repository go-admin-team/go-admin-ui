import { createApp } from 'vue'
import { ElMessage } from 'element-plus'

import Cookies from 'js-cookie'

import 'normalize.css/normalize.css' // a modern alternative to CSS resets

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import '@/styles/index.scss' // global css
import '@/styles/admin.scss'

import { Codemirror } from 'vue-codemirror'

import App from './App'
import store from './store'
import router from './router'
import permission from './directive/permission'

import { getDicts } from '@/api/admin/dict/data'
import { getItems, setItems } from '@/api/table'
import { getConfigKey } from '@/api/admin/sys-config'
import { parseTime, resetForm, addDateRange, selectDictLabel, /* download,*/ selectItemsLabel } from '@/utils/costum'
import { dialogDrag } from '@/utils/dialog' // dialog directive
import { setupErrorHandler } from '@/utils/error-log' // error log

import SvgIcon from './icons' // icon
import './permission' // permission control

// import Viser from 'viser-vue'
// Note: viser-vue 不支持 Vue 3，需要后续处理

import * as filters from './filters' // global filters

import Pagination from '@/components/Pagination'
import BasicLayout from '@/layout/BasicLayout'

import Particles from '@tsparticles/vue3'
import { loadSlim } from '@tsparticles/slim'

import '@/utils/dialog'

// import VueDND from 'awe-dnd'
// Note: awe-dnd 不支持 Vue 3，已改用 vue3-dnd

import 'remixicon/fonts/remixicon.css'

console.info(`欢迎使用go-admin，谢谢您对我们的支持，在使用过程中如果有什么问题，
请访问https://github.com/go-admin-team/go-admin 或者
 https://github.com/go-admin-team/go-admin-ui 向我们反馈，
 谢谢！`)

// 创建 Vue 应用实例
const app = createApp(App)

// 全局方法挂载（$前缀版本 + 无前缀版本同时注册，兼容历史代码）
const msgSuccess = (msg) => ElMessage({ showClose: true, message: msg, type: 'success' })
const msgError = (msg) => ElMessage({ showClose: true, message: msg, type: 'error' })
const msgInfo = (msg) => ElMessage.info(msg)

const globalMethods = {
  getDicts, getItems, setItems, getConfigKey,
  parseTime, resetForm, addDateRange, selectDictLabel, selectItemsLabel,
  msgSuccess, msgError, msgInfo
}

Object.entries(globalMethods).forEach(([key, fn]) => {
  app.config.globalProperties[key] = fn // this.getDicts(...)
  app.config.globalProperties['$' + key] = fn // this.$getDicts(...)
})

// 全局过滤器改为全局方法
app.config.globalProperties.$filters = filters

// 全局组件注册（Pagination 同时注册两个名称兼容历史模板）
app.component('AppPagination', Pagination)
app.component('Pagination', Pagination)
app.component('BasicLayout', BasicLayout)
app.component('CodeEditor', Codemirror)
app.component('SvgIcon', SvgIcon)

// 全局注册 Element Plus 图标：模板中的 <el-icon><Xxx /></el-icon> 需要
// 图标组件可被解析，否则会被当作未知 HTML 标签而不渲染任何内容
for (const [name, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, comp)
}

// 注册插件
app.use(store)
app.use(router)
app.use(permission)
app.use(Particles, {
  init: async engine => {
    await loadSlim(engine)
  }
})
app.use(ElementPlus, {
  locale: zhCn,
  size: Cookies.get('size') || 'default'
})

// 注册自定义指令
app.directive('dialogDrag', dialogDrag)

// 设置错误处理器
setupErrorHandler(app)

// 挂载应用
app.mount('#app')

// 应用挂载完成后淡出首屏加载层，动画结束再从 DOM 移除
const loader = document.getElementById('loader-wrapper')
if (loader) {
  document.body.classList.add('loaded')
  setTimeout(() => loader.remove(), 500)
}
