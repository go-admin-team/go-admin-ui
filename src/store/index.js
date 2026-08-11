import { createStore } from 'vuex'
import getters from './getters'

// 自动加载 modules 目录下所有 vuex 模块，无需逐个 import
const modulesFiles = import.meta.glob('./modules/*.js', { eager: true })

const modules = Object.keys(modulesFiles).reduce((modules, modulePath) => {
  // './modules/app.js' => 'app'
  const moduleName = modulePath.replace(/^\.\/modules\/(.*)\.\w+$/, '$1')
  modules[moduleName] = modulesFiles[modulePath].default
  return modules
}, {})

const store = createStore({
  modules,
  getters
})

export default store
