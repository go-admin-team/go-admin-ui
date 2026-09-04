import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'

/**
 * Ported from the Vuex version together with the store itself.
 *
 * @/layout and @/router are mocked to keep the whole layout component tree out
 * of the test, which would otherwise pull in Element Plus and the router guard.
 *
 * One assertion changed on purpose: generateRoutes used to leave its promise
 * pending forever on a non-200 response; it now rejects. See the case at the
 * bottom.
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

const { usePermissionStore, generaMenu, loadView } =
  await import('@/stores/permission')

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

describe('stores/permission', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = usePermissionStore()
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
     * unless `visible` is exactly the string '0'. The backend sends strings, so
     * a strict-equality "cleanup" would hide every menu.
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
     * A directory route renders nothing on its own, so navigating straight to
     * it would leave the content area blank.
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
     * loadView closes that gap at runtime by overriding the resolved
     * component's name. This is also what protects the migration to
     * <script setup>, which derives its name from the file instead.
     *
     * If this fails, page caching is broken app-wide with no error and no
     * visible symptom beyond pages re-fetching on every tab switch. Do not
     * delete or weaken it.
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

    /**
     * The apps branch, and the reason src/apps/_test-fixture is committed.
     *
     * import.meta.glob is a compile-time macro evaluated against the real
     * filesystem, so this resolves a file that is genuinely on disk -- the same
     * way the cases above resolve src/views/error-page/404.vue.
     *
     * The rendered text is what is asserted, not the name: the placeholder
     * comes back carrying the requested name too, so a key-building mistake
     * would pass a name assertion while every app page in the product had
     * silently degraded to "not installed".
     */
    it('resolves a page under src/apps when the menu points there', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const resolved = await loadView('/apps/_test-fixture/probe/index', 'ProbePage')()

      expect(mount(resolved).text()).toBe('probe')
      expect(resolved.name).toBe('ProbePage')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    /**
     * Existing menus store the component field with a leading slash, but the
     * app form is written both ways -- the PRD's acceptance criteria spell it
     * "apps/<code>/x/index" -- and a missing slash must not be the difference
     * between an app that loads and one that reports itself uninstalled.
     */
    it('accepts an app path with or without the leading slash', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const resolved = await loadView('apps/_test-fixture/probe/index', 'ProbePage')()

      expect(mount(resolved).text()).toBe('probe')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    /**
     * BEHAVIOUR CHANGE, deliberate.
     *
     * A component the build does not contain used to throw, from inside the
     * router's async component loader, where Vue Router has no recovery path --
     * so a single mistyped menu path blanked the entire layout rather than the
     * one panel. It now resolves to the AppNotInstalled placeholder.
     *
     * The console line is the other half: without it this change would trade a
     * loud failure for a silent one, and "app not installed" is indistinguishable
     * from "path typed wrong" on screen.
     */
    it('falls back to the placeholder instead of throwing for a missing views path', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const resolved = await loadView('/does/not/exist', 'Missing')()

      expect(resolved).toBeTruthy()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('src/views/does/not/exist.vue'))
      warn.mockRestore()
    })

    it('falls back to the placeholder instead of throwing for a missing app', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const resolved = await loadView('/apps/ghost/x/index', 'Missing')()

      expect(resolved).toBeTruthy()
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('src/apps/ghost/x/index.vue'))
      warn.mockRestore()
    })

    /**
     * A menu whose component was written without the "apps/" prefix (e.g.
     * "/order/index" instead of "apps/order/index") resolves through the views
     * branch and reports a src/views/ path -- correct as far as it goes, but it
     * gives no hint that the real fix is adding a path segment rather than
     * creating that views file. This is the mismatch AGENTS.md's packaged-app
     * section exists to prevent: without it, whoever copies a backend probe's
     * menu seed verbatim (as PRD 006's did with "/order/index") gets sent
     * looking in the wrong directory.
     */
    it('hints at the apps/ prefix when a views-path miss looks like it could be a packaged app', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await loadView('/order/index', 'Missing')()

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('apps/<code>/'))
      warn.mockRestore()
    })

    // The apps branch already names the right fix (run scripts/sync-apps.mjs);
    // it must not also get the views-path hint above, which would tell someone
    // debugging an already-correct "apps/..." component to add a prefix it
    // already has.
    it('does not add the apps/ prefix hint for a miss that is already under apps/', async() => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      await loadView('/apps/ghost/x/index', 'Missing')()

      expect(warn).toHaveBeenCalledWith(expect.not.stringContaining('apps/<code>/'))
      warn.mockRestore()
    })

    // Building the menu is what triggers the warning, so a broken entry is
    // reported at sign-in for every menu at once rather than one at a time as
    // someone happens to click through them.
    it('does not throw while building a menu whose component is missing', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const routes = []

      expect(() => generaMenu(routes, [menuItem({ component: '/apps/ghost/x/index' })])).not.toThrow()
      expect(typeof routes[0].component).toBe('function')
      warn.mockRestore()
    })
  })

  describe('generateRoutes', () => {
    it('builds the route table and prepends the constant routes', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })

      const dynamicRoutes = await store.generateRoutes()

      expect(dynamicRoutes.some(r => r.path === '/demo')).toBe(true)
      expect(store.routes[0]).toMatchObject(constantRoutes[0])
      expect(store.sidebarRouters[0]).toMatchObject(constantRoutes[0])
    })

    // Settings restores the sidebar from defaultRoutes when the user turns the
    // top nav off. The Vuex mutation prefixed constantRoutes; the Pinia port
    // assigned the bare menu, so that restore dropped every fixed route --
    // including the dashboard -- until the next full reload.
    it('keeps the constant routes in defaultRoutes for the sidebar restore', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })

      await store.generateRoutes()

      expect(store.defaultRoutes[0]).toMatchObject(constantRoutes[0])
      expect(store.defaultRoutes.some(r => r.path === '/demo')).toBe(true)
    })

    // The catch-all belongs to the router, never to the sidebar
    it('keeps the catch-all out of the sidebar tables', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })

      await store.generateRoutes()

      const isCatchAll = r => String(r.path).includes('pathMatch')
      expect(store.sidebarRouters.some(isCatchAll)).toBe(false)
      expect(store.defaultRoutes.some(isCatchAll)).toBe(false)
      expect(store.topbarRouters.some(isCatchAll)).toBe(false)
      expect(store.addRoutes.some(isCatchAll)).toBe(true)
    })

    it('appends a catch-all route so unknown paths redirect home', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })

      const dynamicRoutes = await store.generateRoutes()

      expect(dynamicRoutes.at(-1)).toMatchObject({ path: '/:pathMatch(.*)*', redirect: '/' })
    })

    it('keeps the catch-all out of the sidebar route table', async() => {
      getRoutes.mockResolvedValue({ code: 200, data: [menuItem({ component: 'Layout' })] })

      await store.generateRoutes()

      expect(store.sidebarRouters.map(r => r.path)).not.toContain('/:pathMatch(.*)*')
    })

    /**
     * BEHAVIOUR CHANGE, deliberate.
     *
     * The Vuex version neither resolved nor rejected on a non-200 code: it
     * called `this.$message`, which does not exist on a store instance, and the
     * resulting TypeError was swallowed by a .catch that only logged. The
     * router guard then awaited a promise that never settled and the user was
     * left staring at a blank screen.
     *
     * Rejecting lets the guard's existing catch run, which surfaces the error
     * and redirects to the login page.
     */
    it('rejects when the backend reports a non-200 code', async() => {
      getRoutes.mockResolvedValue({ code: 500, msg: 'boom' })

      await expect(store.generateRoutes()).rejects.toThrow('boom')
    })

    it('propagates a network failure', async() => {
      getRoutes.mockRejectedValue(new Error('offline'))

      await expect(store.generateRoutes()).rejects.toThrow('offline')
    })
  })
})
