import { createStore } from 'vuex'

/**
 * Behaviour lock for the permission module ahead of the Vuex -> Pinia port (P1).
 *
 * This module is the highest-risk single point of the migration: it builds the
 * dynamic route table from the backend menu, and it owns the runtime fix that
 * keeps keep-alive working (see the loadView tests below).
 *
 * @/layout and @/router are mocked to keep the whole layout component tree out
 * of the test, which would otherwise pull in Element Plus and the router guard.
 */

const LayoutStub = { name: 'LayoutStub', template: '<div />' }
const constantRoutes = [{ path: '/login', name: 'Login', hidden: true }]
const getRoutes = vi.fn()

vi.mock('@/layout', () => ({ default: LayoutStub }))
vi.mock('@/router', () => ({
  constantRoutes: [{ path: '/login', name: 'Login', hidden: true }],
  default: { addRoute: vi.fn() },
  resetRouter: vi.fn()
}))
vi.mock('@/api/admin/sys-role', () => ({
  getRoutes: (...args) => getRoutes(...args)
}))

const permissionModule = await import('@/store/modules/permission')
const { generaMenu, filterAsyncRoutes, loadView } = permissionModule
const permission = permissionModule.default

function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  Object.assign(permission.state, {
    routes: [], addRoutes: [], defaultRoutes: [], topbarRouters: [], sidebarRouters: []
  })
  return createStore({ modules: { permission } })
}

// Matches the shape returned by the backend menu endpoint
const menuItem = (over = {}) => ({
  path: '/demo',
  component: '/demo/product/index',
  visible: '0',
  menuName: 'DemoProduct',
  title: 'Demo',
  icon: 'star',
  noCache: false,
  ...over
})

describe('store/permission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generaMenu', () => {
    it('maps a backend menu item onto a route record', () => {
      const routes = []
      generaMenu(routes, [menuItem()])

      expect(routes).toHaveLength(1)
      expect(routes[0]).toMatchObject({
        path: '/demo',
        name: 'DemoProduct',
        meta: { title: 'Demo', icon: 'star', noCache: false }
      })
    })

    it('uses the Layout component when component is the string "Layout"', () => {
      const routes = []
      generaMenu(routes, [menuItem({ component: 'Layout' })])

      expect(routes[0].component).toBe(LayoutStub)
    })

    it('produces a lazy loader function for a normal page component', () => {
      const routes = []
      generaMenu(routes, [menuItem()])

      expect(typeof routes[0].component).toBe('function')
    })

    /**
     * The visibility flag is inverted and uses loose equality: a menu is hidden
     * unless `visible` is exactly the string '0'. Backend sends strings, so a
     * strict-equality "cleanup" during the port would hide every menu.
     */
    it('treats visible === "0" as shown and anything else as hidden', () => {
      const routes = []
      generaMenu(routes, [
        menuItem({ path: '/shown', visible: '0' }),
        menuItem({ path: '/hidden', visible: '1' })
      ])

      expect(routes[0].hidden).toBe(false)
      expect(routes[1].hidden).toBe(true)
    })

    it('recurses into children', () => {
      const routes = []
      generaMenu(routes, [
        menuItem({ path: '/parent', component: 'Layout', children: [menuItem({ path: 'child' })] })
      ])

      expect(routes[0].children).toHaveLength(1)
      expect(routes[0].children[0].path).toBe('child')
    })

    /**
     * A directory route renders nothing on its own, so navigating straight to it
     * would leave the content area blank. generaMenu backfills a redirect to the
     * first visible child.
     */
    it('backfills a redirect to the first visible child', () => {
      const routes = []
      generaMenu(routes, [
        menuItem({
          path: '/parent',
          component: 'Layout',
          children: [
            menuItem({ path: 'hidden-one', visible: '1' }),
            menuItem({ path: 'visible-one', visible: '0' })
          ]
        })
      ])

      expect(routes[0].redirect).toBe('/parent/visible-one')
    })

    it('adds no redirect for a leaf route', () => {
      const routes = []
      generaMenu(routes, [menuItem()])

      expect(routes[0].redirect).toBeUndefined()
    })
  })

  describe('loadView', () => {
    it('returns the raw loader when no route name is given', () => {
      expect(typeof loadView('/demo/product/index')).toBe('function')
    })

    /**
     * THE keep-alive contract.
     *
     * <keep-alive :include> matches by COMPONENT name, while the cached list
     * (tagsView.cachedViews) holds the ROUTE name, which comes from the backend
     * menu configuration. Renaming a menu in the admin UI would therefore break
     * caching silently.
     *
     * loadView closes that gap at runtime by overriding the resolved component's
     * name with the route name. This is also what protects the migration to
     * <script setup>, which derives no component name of its own.
     *
     * If this test fails, page caching is broken app-wide with no error, no
     * warning, and no visible symptom beyond pages re-fetching on every tab
     * switch. Do not delete or weaken it.
     */
    it('overrides the resolved component name with the route name', async() => {
      const resolved = await loadView('/error-page/404', 'SysUser')()

      expect(resolved.name).toBe('SysUser')
    })

    it('returns a copy so the same component can back several menu entries', async() => {
      const first = await loadView('/error-page/404', 'NameOne')()
      const second = await loadView('/error-page/404', 'NameTwo')()

      expect(first.name).toBe('NameOne')
      expect(second.name).toBe('NameTwo')
    })
  })

  describe('filterAsyncRoutes', () => {
    it('keeps routes without a roles constraint', () => {
      const result = filterAsyncRoutes([{ path: '/a' }], ['editor'])

      expect(result).toHaveLength(1)
    })

    it('keeps routes whose meta.roles intersect the user roles', () => {
      const routes = [
        { path: '/admin-only', meta: { roles: ['admin'] } },
        { path: '/editor-only', meta: { roles: ['editor'] } }
      ]

      expect(filterAsyncRoutes(routes, ['editor']).map(r => r.path)).toEqual(['/editor-only'])
    })

    it('filters children recursively', () => {
      const routes = [{
        path: '/parent',
        children: [
          { path: 'a', meta: { roles: ['admin'] } },
          { path: 'b', meta: { roles: ['editor'] } }
        ]
      }]

      expect(filterAsyncRoutes(routes, ['editor'])[0].children.map(r => r.path)).toEqual(['b'])
    })
  })

  describe('generateRoutes', () => {
    it('builds the route table and prepends the constant routes', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })
      const store = makeStore()

      const dynamicRoutes = await store.dispatch('permission/generateRoutes', ['admin'])

      expect(dynamicRoutes.some(r => r.path === '/demo')).toBe(true)
      expect(store.state.permission.routes[0]).toMatchObject(constantRoutes[0])
      expect(store.state.permission.sidebarRouters[0]).toMatchObject(constantRoutes[0])
    })

    it('appends a catch-all route so unknown paths redirect home', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })
      const store = makeStore()

      const dynamicRoutes = await store.dispatch('permission/generateRoutes', ['admin'])

      expect(dynamicRoutes.at(-1)).toMatchObject({ path: '/:pathMatch(.*)*', redirect: '/' })
    })

    it('keeps the catch-all out of the sidebar route table', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })
      const store = makeStore()

      await store.dispatch('permission/generateRoutes', ['admin'])

      const paths = store.state.permission.sidebarRouters.map(r => r.path)
      expect(paths).not.toContain('/:pathMatch(.*)*')
    })

    /**
     * KNOWN DEFECT, documented rather than asserted as desired behaviour.
     *
     * When the backend answers with code !== 200 the action neither resolves nor
     * rejects: it calls `this.$message(...)`, which does not exist on a Vuex
     * store instance, and the resulting TypeError is swallowed by the trailing
     * .catch that only console.logs. The promise is left pending forever, so the
     * router guard awaiting it hangs and the user sits on a blank screen.
     *
     * The same hang occurs even without the TypeError, because resolve() is only
     * reached in the success branch.
     *
     * This test pins the current behaviour so the P1 port does not silently
     * change it; it should be replaced with a proper rejection assertion once
     * the defect is fixed.
     */
    it('currently hangs forever when the backend reports a non-200 code', async() => {
      getRoutes.mockResolvedValue({ code: 500, msg: 'boom' })
      const store = makeStore()

      const pending = store.dispatch('permission/generateRoutes', ['admin'])
      const settled = await Promise.race([
        pending.then(() => 'settled', () => 'settled'),
        new Promise(resolve => setTimeout(() => resolve('still-pending'), 50))
      ])

      expect(settled).toBe('still-pending')
    })
  })
})
