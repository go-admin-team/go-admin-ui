import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The light/dark switch, and the two places that have to agree about it.
 *
 * The dark palette and Element Plus's dark variable sheet were both in the tree
 * for a long time with nothing to turn them on -- no code anywhere put the
 * `dark` class on <html> -- so they were maintained without ever rendering.
 * These tests exist so that cannot happen again quietly.
 *
 * The awkward part is that the decision is made twice: a snippet in index.html
 * paints before any CSS parses, and src/utils/color-scheme.ts owns it from then
 * on. They read the same key and the same rules, and the test that matters most
 * here is the one that checks they do not disagree.
 */

const KEY = 'color-scheme'

const luminance = (colour: string): number => {
  const [r, g, b] = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const surfaces = (page: Page) => page.evaluate(() => ({
  hasDarkClass: document.documentElement.classList.contains('dark'),
  body: getComputedStyle(document.body).backgroundColor,
  container: getComputedStyle(document.querySelector('.app-main') ?? document.body).backgroundColor,
  text: getComputedStyle(document.body).color
}))

const open = async(page: Page, stored?: string) => {
  await page.addInitScript(value => {
    localStorage.setItem('app_info', JSON.stringify({ sys_app_name: 'go-admin管理系统' }))
    if (value) localStorage.setItem('color-scheme', value)
  }, stored ?? '')
  await page.goto('/#/demo/product')
  await page.waitForSelector('.el-table')
}

test.describe('colour scheme', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('a stored dark preference is applied before anything renders', async({ page }) => {
    await open(page, 'dark')

    const s = await surfaces(page)
    expect(s.hasDarkClass).toBe(true)
    // The point of the snippet in index.html: the class is on <html> from the
    // first parsed byte, not after the bundle boots.
    expect(luminance(s.body), `body ${s.body}`).toBeLessThan(0.1)
  })

  test('index.html and the token file agree about the page background', async({ page }) => {
    // index.html carries its own copy of the body colour, because the page needs
    // one before the stylesheet exists. A copy can drift: this one held
    // #f0f1f5 -- the previous palette's grey -- long after the tokens moved on,
    // and had no dark branch at all, so dark mode kept a light page under it.
    await open(page, 'dark')
    const dark = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      token: getComputedStyle(document.documentElement).getPropertyValue('--ga-bg-body').trim()
    }))
    expect(dark.body).toBe(await page.evaluate(t => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = t
      document.body.append(probe)
      const resolved = getComputedStyle(probe).backgroundColor
      probe.remove()
      return resolved
    }, dark.token))
  })

  test('a stored light preference stays light', async({ page }) => {
    await open(page, 'light')

    const s = await surfaces(page)
    expect(s.hasDarkClass).toBe(false)
    expect(luminance(s.body), `body ${s.body}`).toBeGreaterThan(0.7)
  })

  test('the drawer switches the scheme and the choice survives a reload', async({ page }) => {
    await open(page)

    await page.locator('#layout-settings').click()
    await expect(page.locator('.rightPanel-container')).toHaveClass(/show/)
    await page.locator('.drawer-color-scheme').getByText('深色', { exact: true }).click()

    await expect.poll(async() => (await surfaces(page)).hasDarkClass).toBe(true)
    expect(await page.evaluate(k => localStorage.getItem(k), KEY)).toBe('dark')

    // Remembered, not just applied: a preference that resets on reload is worse
    // than none, because the page flashes the theme the user rejected.
    await page.reload()
    await page.waitForSelector('.el-table')
    expect((await surfaces(page)).hasDarkClass).toBe(true)
  })

  test('an unset preference follows the operating system', async({ page, browser }) => {
    await open(page)
    // Nothing stored, and this context reports a light OS
    expect((await surfaces(page)).hasDarkClass).toBe(false)

    const dark = await browser.newContext({ colorScheme: 'dark' })
    const darkPage = await dark.newPage()
    await authenticate(dark)
    await installApiMocks(darkPage)
    await darkPage.goto('/#/demo/product')
    await darkPage.waitForSelector('.el-table')

    expect(await darkPage.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )).toBe(true)
    await dark.close()
  })
})
