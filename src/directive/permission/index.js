import permission from './permission'
import permisaction from './permisaction'

const install = function(Vue) {
  Vue.directive('permission', permission)
  Vue.directive('permisaction', permisaction)
}

if (window.Vue) {
  window['permission'] = permission
  window['permisaction'] = permisaction
  // eslint-disable-next-line no-undef
  Vue.use(install)
}

permission.install = install
export default permission
