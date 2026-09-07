import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * A colour the browser will not paint, however it chose to serialise it.
 *
 * Chromium computes `solid transparent` to `rgba(0, 0, 0, 0)`, so comparing
 * against that one string does work here -- but the string is a serialisation
 * detail and the question being asked is about alpha. Reading the alpha says
 * that, and keeps saying it if the serialisation ever differs.
 */
const invisible = (colour: string) => {
  if (colour === 'transparent') return true
  const parts = colour.match(/[\d.]+/g)
  return parts?.length === 4 && Number(parts[3]) === 0
}

/**
 * The page header, which is two elements in two files.
 *
 * The navbar covers the main column and the sidebar's logo block covers the
 * rail, so the line under them only reads as one line if both are the same
 * height. They were 50px and 64px, drawn 14px apart, and nothing noticed --
 * every other test asks whether an element is present, not where its bottom
 * edge lands.
 */
test.describe('the page header', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-tabs__item')
    await page.waitForTimeout(600)
  })

  test('its two halves end on the same line', async({ page }) => {
    const seam = await page.evaluate(() => {
      const edge = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement
        return { bottom: el.getBoundingClientRect().bottom, colour: getComputedStyle(el).borderBottomColor }
      }
      return { logo: edge('.sidebar-logo-container'), navbar: edge('.navbar') }
    })

    expect(seam.logo.bottom, `logo block ends at ${seam.logo.bottom}, navbar at ${seam.navbar.bottom}`)
      .toBeCloseTo(seam.navbar.bottom, 0)
    // The rail may draw no rule at all (the dark rail sets it transparent, and
    // the colour change between the two surfaces is the divider there). What it
    // must not be is a *different* visible colour from the navbar's.
    if (!invisible(seam.logo.colour)) {
      expect(seam.logo.colour, 'both halves use the same rule colour').toBe(seam.navbar.colour)
    }
  })

  /**
   * The logo survived collapsing only until Tailwind was added.
   *
   * `collapse` is one of its utility names, and v4 generates utilities from the
   * words it finds in the source -- so writing `:class="{'collapse': ...}"` on
   * this block is what made it emit `.collapse{visibility:collapse}`. Nothing
   * here sets visibility, so that rule ran unopposed and hid the whole block.
   *
   * It stayed laid out while hidden, which is why this measures a hit test
   * rather than a box: getBoundingClientRect reported the logo at its usual
   * 28x28 the entire time it was invisible.
   */
  test('the logo is still on screen once the rail collapses', async({ page }) => {
    await page.locator('.hamburger-container').first().click()
    await page.waitForTimeout(700)

    const state = await page.evaluate(() => {
      const box = document.querySelector('.sidebar-logo-container') as HTMLElement
      const rect = box.getBoundingClientRect()
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
      return {
        visibility: getComputedStyle(box).visibility,
        // The element under the middle of the block: its own content when the
        // block paints, an ancestor when it does not.
        hitIsInside: !!hit && box.contains(hit),
        hit: hit ? `${hit.tagName.toLowerCase()}.${(hit.className || '').toString().split(' ')[0]}` : 'null'
      }
    })

    expect(state.visibility, 'the block is not hidden by a utility class').toBe('visible')
    expect(state.hitIsInside, `centre of the block hit ${state.hit}`).toBe(true)
  })
})
