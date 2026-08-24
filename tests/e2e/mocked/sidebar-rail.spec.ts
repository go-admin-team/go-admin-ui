import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * Both sidebar surfaces render.
 *
 * The light rail used to be a setting that did not work: the container turned
 * white while styles/sidebar.scss held the menu inside it to the dark tokens
 * with !important, so the rows kept their white text and landed white on white.
 * Every test stayed green throughout, because nothing looked at what a menu row
 * renders as -- it was present, it was clickable, it just could not be read.
 *
 * So these measure contrast rather than colour. Asserting the expected hex would
 * pin the palette instead of the property that matters, and would need
 * rewriting the next time the brand changes; a ratio keeps working.
 */

/** Relative luminance per WCAG 2.1, from a computed `rgb()` string. */
const luminance = (colour: string): number => {
  const [r, g, b] = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

interface RailColours {
  rowText: string
  rowBg: string
  railBg: string
  titleText: string
  headerBg: string
}

const railColours = (page: Page): Promise<RailColours> => page.evaluate(() => {
  const at = (selector: string) => document.querySelector(selector) as HTMLElement
  const row = at('.el-menu-item:not(.is-active)')
  return {
    rowText: getComputedStyle(row).color,
    rowBg: getComputedStyle(row).backgroundColor,
    railBg: getComputedStyle(at('.sidebar-container')).backgroundColor,
    titleText: getComputedStyle(at('.sidebar-title')).color,
    headerBg: getComputedStyle(at('.sidebar-logo-container')).backgroundColor
  }
})

const open = async(page: Page) => {
  // The name comes from the login page and is cached; seeding it means the
  // header has something to render.
  await page.addInitScript(() => {
    localStorage.setItem('app_info', JSON.stringify({ sys_app_name: 'go-admin管理系统' }))
  })
  await page.goto('/#/demo/product')
  await page.waitForSelector('.el-menu')
}

/** Flips the rail through the settings drawer, the way a user would. */
const switchRail = async(page: Page, to: 'light' | 'dark') => {
  await page.locator('#layout-settings').click()
  await expect(page.locator('.rightPanel-container')).toHaveClass(/show/)
  await page.locator(`.setting-drawer-block-checbox-item:has(img[alt="${to}"])`).click()
  await page.locator('.rightPanel-close').click()
}

test.describe('sidebar rail', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('a menu row is legible on the default rail', async({ page }) => {
    await open(page)

    const c = await railColours(page)
    // 4.5:1 is WCAG AA for body text. A row that fails this is the bug: the
    // colours were still applied, they just cancelled each other out.
    expect(contrast(c.rowText, c.rowBg), `row text ${c.rowText} on ${c.rowBg}`).toBeGreaterThan(4.5)
  })

  test('the application name is legible on the rail header', async({ page }) => {
    await open(page)

    const c = await railColours(page)
    expect(contrast(c.titleText, c.headerBg), `title ${c.titleText} on ${c.headerBg}`).toBeGreaterThan(4.5)
  })

  test('the header is part of the rail, not a block of brand colour on it', async({ page }) => {
    await open(page)

    const c = await railColours(page)
    // These used to differ by a full-saturation gradient, which is what made the
    // corner read as a plaque stuck onto the navigation rather than its header.
    expect(c.headerBg).toBe(c.railBg)
    expect(c.rowBg).toBe(c.railBg)
  })

  test('the other rail is legible too, and the switch reaches it', async({ page }) => {
    await open(page)
    const before = await railColours(page)

    await switchRail(page, 'dark')

    const after = await railColours(page)
    expect(after.railBg, 'the rail actually changed').not.toBe(before.railBg)
    expect(contrast(after.rowText, after.rowBg), `row text ${after.rowText} on ${after.rowBg}`).toBeGreaterThan(4.5)
    expect(contrast(after.titleText, after.headerBg), `title ${after.titleText} on ${after.headerBg}`).toBeGreaterThan(4.5)
    expect(after.headerBg).toBe(after.railBg)
  })
})
