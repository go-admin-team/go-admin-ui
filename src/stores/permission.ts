import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@/router'
import { getRoutes } from '@/api/admin/sys-role'
// Explicit .vue path: TypeScript's bundler resolution does not try the .vue
// extension for a directory import, though Vite resolves either form.
import Layout from '@/layout/index.vue'
import { resolveRedirect } from '@/utils/route'

/** A menu record as returned by GET /api/v1/menurole */
export interface BackendMenu {
  path: string
  component: string
  visible: string
  menuName: string
  title: string
  icon?: string
  noCache?: boolean
  children?: BackendMenu[] | null
}

type AppRoute = RouteRecordRaw & { hidden?: boolean, children?: AppRoute[] }

/**
 * Pre-built index of the views directory. Not eager, so each value is a loader
 * function returning a promise -- exactly what Vue Router wants for an async
 * component.
 */
const viewsModules = import.meta.glob('../views/**/*.vue')

/**
 * Resolves a page component, forcing its name to match the route name.
 *
 * <keep-alive :include> matches by COMPONENT name while the cached list holds
 * ROUTE names, which come from the backend menu configuration. Rename a menu in
 * the admin UI and the two stop agreeing, at which point caching silently stops
 * working: no error, no warning, pages just re-fetch on every tab switch.
 *
 * Overriding the resolved component's name removes the need to keep the two in
 * sync by hand. A copy is returned rather than mutating in place, because one
 * component may back several menu entries and mutation would let whichever
 * resolved first steal the name.
 *
 * Covered by tests/unit/store/permission.spec.js and, end to end, by the
 * "menu name differs from the component name" case in the e2e suite.
 */
export const loadView = (view: string, name?: string) => {
  const key = `../views${view}.vue`
  // Fall back to a dynamic import when the index misses
  const loader = viewsModules[key] || (() => import(`../views${view}.vue`))
  if (!name) return loader

  return () => Promise.resolve(loader()).then(mod => {
    const comp = ((mod as Record<string, unknown>)?.default ?? mod) as Record<string, unknown>
    if (!comp || comp.name === name) return comp
    return { ...comp, name }
  })
}

/** Turns the backend menu tree into Vue Router records, in place. */
export function generaMenu(routes: AppRoute[], data: BackendMenu[]) {
  data.forEach(item => {
    const menu = {
      path: item.path,
      component: item.component === 'Layout' ? Layout : loadView(item.component, item.menuName),
      // The flag is inverted and compared loosely: the backend sends strings,
      // and anything other than '0' means hidden.
      // eslint-disable-next-line eqeqeq
      hidden: item.visible != '0',
      children: [] as AppRoute[],
      name: item.menuName,
      meta: {
        title: item.title,
        icon: item.icon,
        noCache: item.noCache
      }
    } as AppRoute

    if (item.children) {
      generaMenu(menu.children as AppRoute[], item.children)
    }

    // A directory route has no page component of its own, so navigating to it
    // matches the parent but renders nothing. Point it at its first visible
    // child instead.
    const redirect = resolveRedirect(menu.path, menu.children ?? [])
    if (redirect) {
      menu.redirect = redirect
    }

    routes.push(menu)
  })
}

/** Keeps routes whose meta.roles intersects the user's roles. */
export function filterAsyncRoutes(routes: AppRoute[], roles: string[]): AppRoute[] {
  const res: AppRoute[] = []

  routes.forEach(route => {
    const tmp = { ...route }
    const required = tmp.meta?.roles as string[] | undefined
    if (!required || roles.some(role => required.includes(role))) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })

  return res
}

/**
 * Dynamic route table generated from the backend menu.
 *
 * Ported from src/store/modules/permission.js. Behaviour is covered by
 * tests/unit/store/permission.spec.js.
 */
export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [] as AppRoute[],
    addRoutes: [] as AppRoute[],
    defaultRoutes: [] as AppRoute[],
    topbarRouters: [] as AppRoute[],
    sidebarRouters: [] as AppRoute[]
  }),

  actions: {
    setRoutes(routes: AppRoute[]) {
      this.addRoutes = routes
      this.routes = (constantRoutes as AppRoute[]).concat(routes)
    },

    setSidebarRouters(routes: AppRoute[]) {
      this.sidebarRouters = routes
    },

    /**
     * Builds the route table from the backend menu.
     *
     * The Vuex version left its promise pending forever on a non-200 response:
     * it called `this.$message`, which does not exist on a store instance, and
     * the resulting TypeError was swallowed by a .catch that only logged. The
     * router guard then awaited a promise that never settled and the user was
     * left on a blank screen. It now rejects, so the guard's catch runs and
     * sends the user back to the login page.
     */
    async generateRoutes(): Promise<AppRoute[]> {
      const response = await getRoutes()

      if (response.code !== 200) {
        throw new Error(response.msg || '菜单数据加载异常')
      }

      const menuData = (response.data || []) as BackendMenu[]

      const dynamicRoutes: AppRoute[] = []
      generaMenu(dynamicRoutes, menuData)
      dynamicRoutes.push({ path: '/:pathMatch(.*)*', redirect: '/', hidden: true } as AppRoute)
      this.setRoutes(dynamicRoutes)

      // Built a second time on purpose: the sidebar table must not contain the
      // catch-all route appended above.
      const sidebarRoutes: AppRoute[] = []
      generaMenu(sidebarRoutes, menuData)
      this.setSidebarRouters((constantRoutes as AppRoute[]).concat(sidebarRoutes))
      // constantRoutes.concat, matching the Vuex SET_DEFAULT_ROUTES mutation.
      // Settings restores the sidebar from this list when the user turns the top
      // nav off; without the prefix that restore dropped every fixed route,
      // including the dashboard entry, until the next full reload.
      this.defaultRoutes = (constantRoutes as AppRoute[]).concat(sidebarRoutes)
      this.topbarRouters = sidebarRoutes

      return dynamicRoutes
    }
  }
})
