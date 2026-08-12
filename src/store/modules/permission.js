import { constantRoutes } from '@/router'
import { getRoutes } from '@/api/admin/sys-role'
import Layout from '@/layout'
// import sysuserindex from '@/views/sysuser/index'

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * Use names to determine if the current user has permission
 * @param names
 * @param route
 */
function hasPathPermission(paths, route) {
  if (route.path) {
    return paths.some(path => route.path === path.path)
  } else {
    return true
  }
}

/**
  * 后台查询的菜单数据拼装成路由格式的数据
  * @param routes
  */
export function generaMenu(routes, data) {
  data.forEach(item => {
    const menu = {
      path: item.path,
      component: item.component === 'Layout' ? Layout : loadView(item.component, item.menuName),
      // eslint-disable-next-line eqeqeq
      hidden: item.visible != '0',
      children: [],
      name: item.menuName,
      meta: {
        title: item.title,
        icon: item.icon,
        noCache: item.noCache
      }
    }
    if (item.children) {
      generaMenu(menu.children, item.children)
    }
    routes.push(menu)
  })
}

// 预建 views 目录索引；未使用 eager，值即为返回 Promise 的懒加载函数，
// 可直接交给 Vue Router 作为异步组件使用
const viewsModules = import.meta.glob('../../views/**/*.vue')

export const loadView = (view, name) => { // 路由懒加载
  const key = `../../views${view}.vue`
  // 兜底：索引未命中时回退到动态 import
  const loader = viewsModules[key] || (() => import(`../../views${view}.vue`))
  if (!name) return loader

  // keep-alive 的 include 按组件 name 匹配，而缓存名单存放的是路由 name。
  // 页面路由的 name 取自后端菜单配置，使用者在菜单管理里改一次名称，就与
  // 写死在 .vue 文件里的组件 name 不再一致，页面缓存随即静默失效且无任何
  // 提示。这里在组件解析完成后以路由 name 覆盖其 name，使两者不再依赖人
  // 工保持一致。
  //
  // 返回副本而非就地修改：同一组件可能被多个菜单项复用，就地修改会让先解
  // 析的那个路由丢掉自己的名字。
  return () => Promise.resolve(loader()).then(mod => {
    const comp = (mod && mod.default) || mod
    if (!comp || comp.name === name) return comp
    return { ...comp, name }
  })
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param components
 */
export function filterAsyncPathRoutes(routes, paths) {
  const res = []

  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPathPermission(paths, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncPathRoutes(tmp.children, paths)
      }
      res.push(tmp)
    }
  })

  return res
}

const state = {
  routes: [],
  addRoutes: [],
  defaultRoutes: [],
  topbarRouters: [],
  sidebarRouters: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  },
  SET_DEFAULT_ROUTES: (state, routes) => {
    state.defaultRoutes = constantRoutes.concat(routes)
  },
  SET_TOPBAR_ROUTES: (state, routes) => {
    // 顶部导航菜单默认添加统计报表栏指向首页
    // const index = [{
    //   path: 'dashboard',
    //   meta: { title: '统计报表', icon: 'dashboard' }
    // }]
    state.topbarRouters = routes // .concat(index)
  },
  SET_SIDEBAR_ROUTERS: (state, routes) => {
    state.sidebarRouters = routes
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      const loadMenuData = []

      getRoutes().then(response => {
        // console.log(JSON.stringify(response))
        let data = response
        if (response.code !== 200) {
          this.$message({
            message: '菜单数据加载异常',
            type: 0
          })
        } else {
          data = response.data
          Object.assign(loadMenuData, data)

          const dynamicRoutes = []
          generaMenu(dynamicRoutes, loadMenuData)
          dynamicRoutes.push({ path: '/:pathMatch(.*)*', redirect: '/', hidden: true })
          commit('SET_ROUTES', dynamicRoutes)
          const sidebarRoutes = []
          generaMenu(sidebarRoutes, loadMenuData)
          commit('SET_SIDEBAR_ROUTERS', constantRoutes.concat(sidebarRoutes))
          commit('SET_DEFAULT_ROUTES', sidebarRoutes)
          commit('SET_TOPBAR_ROUTES', sidebarRoutes)
          resolve(dynamicRoutes)
        }
      }).catch(error => {
        console.log(error)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
