import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The tab strip's own geometry.
 *
 * A tab is drawn as a card with a border on three sides, so the top edge is
 * what makes it read as a tab rather than as a label. It sits in a 40px strip
 * that clips its overflow, which is a combination that hides a defect rather
 * than showing one: a tab one pixel too tall for its row loses that edge
 * silently, and every other test still passes because the tab is present,
 * clickable and correctly labelled.
 */
test.describe('the tab strip', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-tabs__item')
    // Element Plus positions the strip after a tick; measuring before it
    // settles reads the pre-layout numbers.
    await page.waitForTimeout(800)
  })

  test('a tab keeps its top edge inside the row that clips it', async({ page }) => {
    // Measured against the row the tabs are laid out in, not the strip's border
    // box. The strip is 40px tall and clips overflow, but the tabs sit in
    // .el-tabs__header inside it -- so a tab can be within the strip's outer
    // bounds and still have its top cut off. Comparing against the strip is
    // what let this pass while the border was missing on screen.
    const row = await page.locator('.el-tabs__header').boundingBox()
    const tab = await page.locator('.el-tabs__item').first().boundingBox()
    expect(row && tab).toBeTruthy()

    // Shipped as tab top 57 against a row starting at 58: one pixel out, which
    // is exactly the border, so the tab read as an open-topped box.
    expect(tab!.y, `tab top ${tab!.y} vs row top ${row!.y}`).toBeGreaterThanOrEqual(row!.y)
  })

  test('the tab and the bar below it stay apart', async({ page }) => {
    const navbar = await page.locator('.navbar').boundingBox()
    const tab = await page.locator('.el-tabs__item').first().boundingBox()

    // The other half of the same squeeze: a tab tall enough to clear the strip
    // would instead climb into the navbar's bottom border and draw a line
    // through it. Neither end may overlap.
    expect(tab!.y, 'the tab starts below the navbar').toBeGreaterThanOrEqual(navbar!.y + navbar!.height)
  })

  /**
   * Declared and rendered are different things, and this is the check that
   * knows the difference.
   *
   * The rule was applied, getComputedStyle reported `1px solid #d9d9d9` on all
   * four sides, and the top edge was still not on screen: Element Plus lifts a
   * card tab a pixel so that neighbours share an edge, .el-tabs__nav-wrap is a
   * pixel shorter than the tab and clips, and the pixel it cut was that border.
   * Reading the style could never have caught it -- the style was correct.
   *
   * Walking every clipping ancestor rather than naming nav-wrap: the previous
   * version compared the tab against .el-tabs__header, which does not clip, so
   * it passed for the whole time the border was missing.
   *
   * Vertical only, and deliberately. The strip is a fixed 40px, so a tab cut
   * off at the top or bottom is always a defect. Sideways it is the opposite:
   * the strip scrolls, and clipping the tab that runs past its right-hand edge
   * is what a scrolling row is supposed to do -- checking left and right here
   * would fail on any window narrow enough to need it.
   */
  test('a tab keeps its top and bottom borders on screen, not just declared', async({ page }) => {
    const problems = await page.locator('.el-tabs__item').evaluateAll(nodes => {
      const clipped: string[] = []

      for (const node of nodes as HTMLElement[]) {
        const label = node.textContent?.trim() || '(unnamed)'
        const style = getComputedStyle(node)
        if (parseFloat(style.borderTopWidth) <= 0) {
          clipped.push(`${label}: no top border declared`)
          continue
        }

        const box = node.getBoundingClientRect()
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          const overflowY = getComputedStyle(parent).overflowY
          if (overflowY === 'visible') continue

          const bounds = parent.getBoundingClientRect()
          const where = `${parent.className || parent.tagName.toLowerCase()} (${overflowY})`
          // Half a pixel of slack for subpixel layout; a cut border is a whole one.
          if (box.top < bounds.top - 0.5) {
            clipped.push(`${label}: top ${box.top} cut by ${where} starting at ${bounds.top}`)
          }
          if (box.bottom > bounds.bottom + 0.5) {
            clipped.push(`${label}: bottom ${box.bottom} cut by ${where} ending at ${bounds.bottom}`)
          }
        }
      }

      return clipped
    })

    expect(problems, problems.join(' | ')).toEqual([])
  })
})
