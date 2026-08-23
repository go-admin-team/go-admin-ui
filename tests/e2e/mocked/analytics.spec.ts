import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * That a navigation reaches the analytics hook, and reaches it once.
 *
 * The unit tests pin what a page view looks like; this pins that one happens.
 * Both halves are needed because the failure is silent either way -- a hook
 * that never fires and a hook that fires twice both leave the application
 * working perfectly, and are only visible in a report weeks later.
 *
 * The tag itself is not loaded here: dev builds carry no measurement id, by
 * design. A recording stub stands in for it, which is what `window.gtag` is
 * from the application's point of view anyway.
 */

interface Hit {
  page_title: string
  page_location: string
}

/** Installs the stub before any application code runs, and reads it back. */
const recordHits = async(page: Page) => {
  await page.addInitScript(() => {
    const hits: unknown[][] = []
    Object.assign(window, {
      __hits: hits,
      gtag: (...args: unknown[]) => { hits.push(args) }
    })
  })

  return {
    pageViews: async(): Promise<Hit[]> => page.evaluate(() =>
      ((window as unknown as { __hits: unknown[][] }).__hits)
        .filter(([command, name]) => command === 'event' && name === 'page_view')
        .map(([, , params]) => params as Hit)
    )
  }
}

test.describe('analytics', () => {
  test('the login page reports itself, under a path and not under "/"', async({ page }) => {
    const { pageViews } = await recordHits(page)
    await installApiMocks(page)

    // No token, so the guard sends any route to the login page
    await page.goto('/#/login')
    await page.waitForSelector('form')

    await expect.poll(pageViews).toHaveLength(1)
    const [hit] = await pageViews()

    // The point of the whole exercise: the browser is at "/#/login", whose path
    // is "/", and GA4 takes the page from the path. Reported as-is, the login
    // page would be indistinguishable from every other route on the site.
    expect(new URL(hit.page_location).pathname).toBe('/login')

    // The path is what tells the login page apart, not the title: the /login
    // route declares no meta.title, so getPageTitle falls back to the site name
    // and reports the same string every untitled route does.
    expect(hit.page_title).toBe('go-admin 后台管理系统')
  })

  test('a page the guard turned away is not reported as visited', async({ page }) => {
    const { pageViews } = await recordHits(page)
    await installApiMocks(page)

    // No token, so the guard answers this with next('/login?redirect=...').
    // The user never sees sys-post; reporting it would invent a visit to a page
    // that was never rendered, and inflate every protected route by one hit per
    // signed-out arrival -- which is most of them, on a public demo.
    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('form')

    await expect.poll(pageViews).toHaveLength(1)
    const [hit] = await pageViews()
    expect(new URL(hit.page_location).pathname).toBe('/login')
  })

  test('a signed-in navigation reports once, not once per redirect', async({ page, context }) => {
    const { pageViews } = await recordHits(page)
    await authenticate(context)
    await installApiMocks(page)

    // The guard answers the first authenticated navigation by loading the user,
    // registering routes and calling next({ ...to, replace: true }). That ends
    // one navigation and starts another over the same route, so anything
    // counting navigations rather than completed ones doubles this page.
    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await expect.poll(pageViews).toHaveLength(1)
    const [hit] = await pageViews()
    expect(new URL(hit.page_location).pathname).toBe('/admin/sys-post')
  })

  test('each route change reports its own page', async({ page, context }) => {
    const { pageViews } = await recordHits(page)
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')
    await expect.poll(pageViews).toHaveLength(1)

    // A tag on its own sees one page load and nothing after it; the whole
    // reason page views are sent from the router is this second navigation.
    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    await expect.poll(pageViews).toHaveLength(2)
    expect((await pageViews()).map(hit => new URL(hit.page_location).pathname))
      .toEqual(['/admin/sys-post', '/admin/sys-dept'])
  })

  test('clicking the page you are already on is not a second visit', async({ page, context }) => {
    const { pageViews } = await recordHits(page)
    await authenticate(context)
    await installApiMocks(page)

    await page.goto('/#/demo/product')
    await page.waitForSelector('.el-table')
    await expect.poll(pageViews).toHaveLength(1)

    // vue-router answers a navigation to the current route with a duplicated
    // navigation failure. Nothing moves on screen, so nothing was visited --
    // but this is an easy click to make repeatedly, and counted it would put
    // whichever page a user sits on at the top of every report.
    await page.locator('.el-menu-item', { hasText: 'Product' }).click()
    await page.waitForTimeout(500)

    expect(await pageViews()).toHaveLength(1)
  })

  test('nothing breaks when the tag was never injected', async({ page, context }) => {
    // Every build without a measurement id -- intranet and offline deployments
    // among them. The application must not notice.
    await authenticate(context)
    await installApiMocks(page)

    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')
    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    // Spelled out rather than `window.gtag`: the declaration that adds it to
    // Window lives in src/utils/analytics.ts, which nothing here imports.
    expect(await page.evaluate(() =>
      typeof (window as unknown as { gtag?: unknown }).gtag
    )).toBe('undefined')
    expect(errors).toEqual([])
  })
})
