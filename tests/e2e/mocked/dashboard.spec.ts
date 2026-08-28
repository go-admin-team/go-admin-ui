import { test, expect, Page, Locator } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/** Whether anything at all has been drawn. Stops at the first opaque pixel. */
const hasPaint = (canvas: Locator) =>
  canvas.evaluate((el: HTMLCanvasElement) => {
    const ctx = el.getContext('2d')
    if (!ctx || !el.width || !el.height) return false
    const { data } = ctx.getImageData(0, 0, el.width, el.height)
    for (let p = 3; p < data.length; p += 4) if (data[p] > 0) return true
    return false
  })

/** The chart in whichever tab pane is currently open. */
const openPaneChart = (page: Page) =>
  page.locator('.el-tab-pane:not([style*="display: none"]) canvas').first()

/**
 * The landing page everyone sees after signing in.
 *
 * Second-busiest route in the deployment and nothing executed it. It matters
 * more than the visit count suggests, because it is the only page whose content
 * is drawn rather than laid out: every chart is an echarts canvas, and a canvas
 * that fails to draw still occupies its space and still satisfies any assertion
 * about the element existing.
 *
 * So these tests read pixels and geometry. That is what survives echarts moving
 * between chunks -- the failure mode of a mis-chunked async import is a canvas
 * that is present, sized, and blank.
 */
test.describe('the dashboard', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/#/dashboard')
    await expect.poll(() => page.locator('canvas').count(), { timeout: 15000 })
      .toBeGreaterThanOrEqual(4)
  })

  test('every visible chart is actually painted', async({ page }) => {
    // :visible already excludes the chart sitting in the inactive tab pane,
    // which has no box; that one gets its own test below.
    const canvases = page.locator('canvas:visible')
    const count = await canvases.count()

    // Guards the guard: without this, a page that rendered no charts at all
    // would pass by checking nothing.
    expect(count, 'no visible canvas to check').toBeGreaterThanOrEqual(3)

    for (let i = 0; i < count; i++) {
      await expect.poll(() => hasPaint(canvases.nth(i)), {
        timeout: 10000,
        message: `canvas ${i} never drew anything`
      }).toBe(true)
    }
  })

  test('a chart revealed by a tab gets the width of its new container', async({ page }) => {
    expect((await openPaneChart(page).boundingBox())!.width).toBeGreaterThan(300)

    await page.getByRole('tab', { name: '访问量' }).click()

    // echarts measures its container once, at init. A chart built inside a
    // hidden pane measures zero and falls back to a 100px default, and without
    // something watching the box it stays 100px after the pane opens -- which
    // is exactly what shipped: 100px beside an identical 570px chart.
    await expect.poll(async() => (await openPaneChart(page).boundingBox())?.width ?? 0, { timeout: 10000 })
      .toBeGreaterThan(300)

    await expect.poll(() => hasPaint(openPaneChart(page)), { timeout: 10000 }).toBe(true)
  })

  test('charts follow the window when it narrows', async({ page }) => {
    const before = (await openPaneChart(page).boundingBox())!.width

    await page.setViewportSize({ width: 1024, height: 900 })

    // Without a resize handler the canvas keeps its old width and either
    // overflows its column or leaves a gap beside it. Polled rather than read
    // once: the handler is debounced, so the new width lands ~100ms late.
    await expect.poll(async() => (await openPaneChart(page).boundingBox())?.width ?? 0, { timeout: 10000 })
      .toBeLessThan(before)
  })

  test('the summary cards carry their figures', async({ page }) => {
    // Static demo figures, but they prove the panel rendered rather than
    // collapsing to an empty grid.
    await expect(page.getByText('总销售额')).toBeVisible()
    await expect(page.getByText('￥126,560')).toBeVisible()
    await expect(page.getByText('日均销售额')).toBeVisible()
  })
})
