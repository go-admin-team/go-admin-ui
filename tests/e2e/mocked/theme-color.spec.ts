import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * Calls the real module in the page.
 *
 * The path is a dev-server URL rather than a module specifier -- `@/` is a
 * build-time alias and means nothing to the browser -- so it is passed in as a
 * value. That also keeps TypeScript from trying to resolve it as an import.
 */
const apply = (page: Page, hex: string) =>
  page.evaluate(async([path, colour]) => {
    const module = await import(/* @vite-ignore */ path) as { applyThemeColor: (h: string) => void }
    module.applyThemeColor(colour)
  }, ['/src/utils/theme-color.ts', hex])

/**
 * The primary colour reaches the components, without touching the network.
 *
 * The unit test covers the arithmetic; this covers the part that made the old
 * mechanism worth replacing. That one fetched element-plus's whole stylesheet
 * from unpkg and string-replaced colours in it -- so it needed a CDN this
 * project forbids, and it only rewrote <style> tags, which a production build
 * does not have.
 */
test.describe('the theme colour', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('repaints the components, and asks the network for nothing', async({ page }) => {
    const external: string[] = []
    page.on('request', request => {
      const url = request.url()
      if (!url.startsWith('http://localhost') && !url.startsWith('data:')) external.push(url)
    })

    await page.goto('/#/admin/sys-user')
    const button = page.locator('.el-button--primary').first()
    await expect(button).toBeVisible({ timeout: 15000 })

    const before = await button.evaluate(el => getComputedStyle(el).backgroundColor)

    await apply(page, '#ff0000')

    await expect(button).toHaveCSS('background-color', 'rgb(255, 0, 0)')
    expect(before).not.toBe('rgb(255, 0, 0)')

    // The whole point: no unpkg, no CDN, nothing off-host.
    expect(external.filter(u => !u.includes('hm.baidu.com')), 'reached for an external host')
      .toEqual([])
  })

  test('recomputes its tints when the appearance changes', async({ page }) => {
    // Tints mix toward the ground, and the dark theme's ground is not white. A
    // colour computed for light and left alone reads washed out on dark.
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await apply(page, '#000000')
    const light = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--el-color-primary-light-5'))

    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await expect.poll(async() => page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--el-color-primary-light-5'))
    ).not.toBe(light)
  })
})
