import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The two iframe pages size themselves to the window, without fighting over it.
 *
 * Both assigned `window.onresize`, which is a single slot: whichever opened
 * second replaced the other's handler, so under keep-alive the first page's
 * iframe stopped resizing. Neither removed anything on unmount, so the closure
 * held an unmounted component for the rest of the session.
 *
 * Nothing about that is visible on screen -- the page renders, the iframe
 * loads, and the height is only wrong once the window changes size -- which is
 * how it survived. It survived the tests too: neither route was in the mocked
 * menu tree, so the suite had never opened either page.
 */
/** True if anything claimed window.onresize -- the fix never does. */
const tookTheSlot = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.onresize !== null)

/**
 * The height of the iframe's container on the page currently shown.
 *
 * Located rather than queried: keep-alive leaves the previous page's markup in
 * the document, so document.querySelector finds whichever mounted first and
 * reports a height that never changes again.
 */
const frameHeight = async(page: import('@playwright/test').Page) => {
  const box = await page.locator('.box-card div[style*="height"]:visible').first().boundingBox()
  return box?.height ?? 0
}

test.describe('the iframe pages', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('resize without claiming the window\'s only handler slot', async({ page }) => {
    await page.goto('/#/dev-tools/swagger')
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 15000 })
    expect(await tookTheSlot(page), 'took the window.onresize slot').toBe(false)

    await page.goto('/#/dev-tools/build')
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 15000 })
    expect(await tookTheSlot(page), 'took the window.onresize slot').toBe(false)
  })

  test('each still follows the window on its own', async({ page }) => {
    // The behaviour the handler exists for, asserted per page rather than
    // assumed: the second page must not have disabled the first.
    for (const route of ['/#/dev-tools/swagger', '/#/dev-tools/build']) {
      await page.goto(route)
      await expect(page.locator('iframe').first()).toBeVisible({ timeout: 15000 })

      // Wait for the first size to land before reading it. The handler runs on
      // the resize event, so reading straight after setViewportSize returns
      // whatever the previous iteration left behind -- which on the second pass
      // is the short height, making any comparison against it meaningless.
      await page.setViewportSize({ width: 1280, height: 900 })
      await expect.poll(() => frameHeight(page)).toBeGreaterThan(700)
      const tall = await frameHeight(page)

      await page.setViewportSize({ width: 1280, height: 600 })
      await expect.poll(() => frameHeight(page),
        { message: `${route} did not follow the window` }).toBeLessThan(tall)
    }
  })

  test('let go of the window when left', async({ page }) => {
    await page.goto('/#/dev-tools/swagger')
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 15000 })

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    // Resizing after leaving must not reach a component that is gone.
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width: 1000, height: 700 })
    await page.waitForTimeout(300)
    expect(errors, 'a stale handler ran after unmount').toEqual([])
  })
})
