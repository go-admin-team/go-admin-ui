import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * Safety net for the app shell: session guard, dynamic route generation from the
 * backend menu, permission-driven buttons and keep-alive page caching.
 *
 * These are the paths the Vuex -> Pinia port (P1) and the Options API ->
 * Composition API rewrite (P4) are most likely to break, and all of them fail
 * silently rather than throwing.
 */

test.describe('app shell', () => {
  test('redirects to login when no session cookie is present', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/demo/product')

    await expect(page).toHaveURL(/#\/login/)
  })

  /**
   * The sprite vite-plugin-svg-icons injects, not the <use> that points at it.
   *
   * Those two fail apart: a missing sprite leaves every `<use href="#icon-x">`
   * in the DOM and every test green while the sidebar renders blank squares.
   * The plugin's sprite builder, svg-baker, is unmaintained and pulls old
   * transitive dependencies, so anything that forces those forward has to be
   * checked here rather than at the build's exit code.
   */
  test('the svg sprite is injected and carries its symbols', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-menu')

    const sprite = page.locator('body > svg[id*="svg"], body > div[id*="svg"] svg').first()
    await expect(sprite).toBeAttached()

    const symbols = await page.locator('symbol[id^="icon-"]').count()
    expect(symbols).toBeGreaterThan(50)

    // And one the sidebar actually asks for
    await expect(page.locator('symbol#icon-star')).toBeAttached()
  })

  test('builds the sidebar from the backend menu', async({ page, context }) => {
    await authenticate(context)
    const { calls } = await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-menu')

    // Guard order: getInfo first, then the menu that depends on its roles
    expect(calls.extra.getinfo).toBe(1)
    expect(calls.extra.menurole).toBe(1)

    await expect(page.locator('.el-sub-menu__title', { hasText: 'Demo' })).toBeVisible()
    await expect(page.locator('.el-menu-item', { hasText: 'Product' })).toBeVisible()
  })

  test('renders the page behind a dynamically generated route', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.locator('.el-table').getByText('Alpha')).toBeVisible()
  })

  /**
   * v-permisaction hides controls the user lacks. The fixture grants add and
   * edit but withholds delete, so a regression that neuters the directive shows
   * up as a visible delete button rather than as an error.
   */
  test('hides actions the user has no permission for', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')

    await expect(page.getByRole('button', { name: '新增' })).toBeVisible()
    await expect(page.getByRole('button', { name: '删除' })).toHaveCount(0)
  })

  /**
   * The keep-alive contract, end to end.
   *
   * cachedViews stores the ROUTE name while <keep-alive :include> matches the
   * COMPONENT name; loadView() reconciles the two at runtime. If that breaks --
   * for instance by migrating the page to <script setup> without
   * defineOptions({ name }) -- the page is rebuilt on every visit and re-issues
   * its list request. Counting requests is what makes the silent failure
   * observable.
   */
  test('caches a visited page instead of refetching it', async({ page, context }) => {
    await authenticate(context)
    const { calls } = await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')
    expect(calls.product.list).toBe(1)

    // Navigate away to a sibling page
    await page.locator('.el-menu-item', { hasText: 'Second' }).click()
    await page.waitForURL(/#\/demo\/second/)
    await page.waitForSelector('.el-table')

    // Whatever the sibling page did on its own is irrelevant; what matters is
    // that returning to a cached page issues no further request.
    const beforeReturn = calls.product.list

    await page.locator('.tags-view-item', { hasText: 'Product' }).click()
    await page.waitForURL(/#\/demo\/product/)
    // The sibling page leaves its own .el-table in the DOM, so waiting on that
    // selector would resolve before the returning page had a chance to re-fetch.
    // Give any request a window to appear instead.
    await page.waitForTimeout(600)

    // A cached page is reactivated, not recreated, so created() never re-runs
    expect(calls.product.list).toBe(beforeReturn)
  })

  /**
   * Guards loadView()'s runtime name override specifically.
   *
   * The 'Renamed' menu entry is configured with a menuName that does not match
   * the component's own name, which is what happens as soon as anyone renames a
   * menu in the admin UI. cachedViews then contains a name no component answers
   * to, and only loadView() rewriting the resolved component's name keeps the
   * page cacheable.
   *
   * Deleting that override makes this test fail while every other test here
   * still passes -- which is exactly why it exists as a separate case.
   */
  test('caches a page whose menu name differs from the component name', async({ page, context }) => {
    await authenticate(context)
    const { calls } = await installApiMocks(page)

    await page.goto('/#/demo/renamed')
    await page.waitForSelector('.el-table')

    await page.locator('.el-menu-item', { hasText: 'Second' }).click()
    await page.waitForURL(/#\/demo\/second/)
    await page.waitForSelector('.el-table')

    const beforeReturn = calls.product.list

    await page.locator('.tags-view-item', { hasText: 'Renamed' }).click()
    await page.waitForURL(/#\/demo\/renamed/)
    await page.waitForTimeout(600)

    expect(calls.product.list).toBe(beforeReturn)
  })

  // The trigger used to be a tile fixed to the right edge of the viewport, which
  // covered whatever the page had there -- on a list page, the pinned action
  // column. It lives in the navbar icon row now.
  test('the settings drawer opens from the navbar, not from a floating tile', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')

    // Nothing floating over the content any more
    await expect(page.locator('.handle-button')).toHaveCount(0)

    const drawer = page.locator('.rightPanel-container')
    await expect(drawer).not.toHaveClass(/show/)

    await page.locator('#layout-settings').click()
    await expect(drawer).toHaveClass(/show/)

    await page.locator('.rightPanel-close').click()
    await expect(drawer).not.toHaveClass(/show/)
  })

  test('opens a tab per visited page', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')
    await page.locator('.el-menu-item', { hasText: 'Second' }).click()
    await page.waitForURL(/#\/demo\/second/)

    await expect(page.locator('.tags-view-item', { hasText: 'Product' })).toBeVisible()
    await expect(page.locator('.tags-view-item', { hasText: 'Second' })).toBeVisible()
  })
})
