import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * Walks the pages in the dark scheme and fails on anything still painted light.
 *
 * This replaces the way that used to be checked, which was to grep for hex
 * literals. That over-counts by more than an order of magnitude: `src` holds
 * around four hundred of them, and on the routes below exactly two were
 * rendering wrong. Most literals are behind a rule something else overrides, or
 * belong to artwork, or are a chart's categorical palette -- all fine, and all
 * indistinguishable from a real break in a grep.
 *
 * What is checkable is the rendered result, which is what this does: for every
 * box big enough to be seen, is its background light while the scheme is dark,
 * and is its text legible against whatever is actually behind it.
 *
 * It is a floor, not a ceiling. Only routes the fixture can reach are visited,
 * and a page nobody lists here is a page nobody is checking -- so add to
 * ROUTES rather than assuming the sweep covers a new screen.
 */

const ROUTES = [
  '/#/dashboard',
  '/#/admin/sys-api',
  '/#/admin/sys-user',
  '/#/admin/sys-dept',
  '/#/demo/product',
  '/#/schedule/log',
  '/#/profile',
  '/#/404'
]

/** Anything lighter than this counts as a light surface. Mid-grey is ~0.21. */
const LIGHT = 0.55

/** WCAG AA for large text. Body text wants 4.5; this is the floor for "visible". */
const MIN_CONTRAST = 3

const audit = (page: Page) => page.evaluate(({ light, minContrast }) => {
  const luminance = (colour: string): number | null => {
    const parts = colour.match(/[\d.]+/g)
    if (!parts) return null
    const [r, g, b, alpha = '1'] = parts
    // A transparent surface is not this element's problem; keep walking up.
    if (Number(alpha) < 0.4) return null
    const channel = (v: number) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(+r) + 0.7152 * channel(+g) + 0.0722 * channel(+b)
  }

  /** The first opaque background at or above an element -- what it sits on. */
  const behind = (el: HTMLElement): number => {
    for (let n: HTMLElement | null = el; n; n = n.parentElement) {
      const value = luminance(getComputedStyle(n).backgroundColor)
      if (value !== null) return value
    }
    return 0
  }

  const describe = (el: HTMLElement) => el.tagName.toLowerCase() +
    (typeof el.className === 'string' && el.className
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')

  const surfaces: string[] = []
  const texts: string[] = []

  for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
    const box = el.getBoundingClientRect()
    if (box.width < 60 || box.height < 16) continue

    const own = luminance(getComputedStyle(el).backgroundColor)
    if (own !== null && own > light) surfaces.push(`${describe(el)} bg=${getComputedStyle(el).backgroundColor}`)

    // Leaf text only: a wrapper's colour is not what the reader sees.
    if (!el.textContent?.trim() || el.children.length) continue
    // Disabled controls are low-contrast on purpose.
    if (el.closest('.is-disabled, [disabled]')) continue

    const foreground = luminance(getComputedStyle(el).color)
    if (foreground === null) continue
    const [hi, lo] = [foreground, behind(el)].sort((a, b) => b - a)
    const ratio = (hi + 0.05) / (lo + 0.05)
    if (ratio < minContrast) {
      texts.push(`${describe(el)} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}:1`)
    }
  }

  return { surfaces: [...new Set(surfaces)], texts: [...new Set(texts)] }
}, { light: LIGHT, minContrast: MIN_CONTRAST })

test.describe('dark scheme', () => {
  test('no page is still painted light', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.addInitScript(() => {
      localStorage.setItem('color-scheme', 'dark')
      localStorage.setItem('app_info', JSON.stringify({ sys_app_name: 'go-admin管理系统' }))
    })
    await page.setViewportSize({ width: 1280, height: 800 })

    const broken: string[] = []
    for (const route of ROUTES) {
      await page.goto(route)
      // No single selector fits every page here, and a missing wait shows up as
      // an empty audit rather than a failure, so this settles on time.
      await page.waitForTimeout(1500)

      const { surfaces, texts } = await audit(page)
      for (const hit of surfaces) broken.push(`${route}  light surface: ${hit}`)
      for (const hit of texts) broken.push(`${route}  unreadable text: ${hit}`)
    }

    expect(broken, `\n${broken.join('\n')}\n`).toEqual([])
  })
})
