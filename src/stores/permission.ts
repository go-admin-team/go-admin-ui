import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { constantRoutes } from '@/router'
import { getRoutes } from '@/api/admin/sys-role'
// Explicit .vue path: TypeScript's bundler resolution does not try the .vue
// extension for a directory import, though Vite resolves either form.
import Layout from '@/layout/index.vue'
import { resolveRedirect } from '@/utils/route'
import { i18n } from '@/lang'

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
  const loader = viewsModules[key]
  if (!loader) {
    // viewsModules is import.meta.glob over the same directory, so it already
    // holds every key this template could build. A `|| import(...)` fallback
    // could only ever be reached for a path that does NOT exist, where it
    // produced an opaque chunk-load failure instead of naming the component.
    throw new Error(`loadView: no component at src/views${view}.vue (check the menu's component path)`)
  }
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
        // The server's message still wins here, unlike the success toasts:
        // a failure carries a reason only the backend knows, and dropping it
        // would leave the user with a sentence that never varies.
        throw new Error(response.msg || i18n.global.t('common.menuLoadFailed'))
      }

      const menuData = (response.data || []) as BackendMenu[]

      // Walked once. The menu was previously built twice over the same data --
      // doubling the work and producing a second loadView closure per page --
      // only so the sidebar copy could omit the catch-all. Appending it to a
      // separate array achieves that without the second walk.
      const sidebarRoutes: AppRoute[] = []
      generaMenu(sidebarRoutes, menuData)

      // Shares route objects with sidebarRoutes rather than copying them, so
      // nothing here may mutate a route in place -- every consumer (Sidebar,
      // TopNav, Settings) only reads. Building the tree twice used to make that
      // safe by accident; now it is a rule.
      const dynamicRoutes: AppRoute[] = [
        ...sidebarRoutes,
        { path: '/:pathMatch(.*)*', redirect: '/', hidden: true } as AppRoute
      ]
      this.setRoutes(dynamicRoutes)
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
