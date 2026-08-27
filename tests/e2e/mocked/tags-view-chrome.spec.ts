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

  test('every tab has a visible top border', async({ page }) => {
    const borders = await page.locator('.el-tabs__item').evaluateAll(nodes =>
      nodes.map(node => getComputedStyle(node as HTMLElement).borderTopWidth)
    )

    expect(borders.length).toBeGreaterThan(0)
    // Declared and rendered are different things -- this only proves the rule
    // applies. The geometry checks above are what prove it is on screen.
    expect(borders.every(width => parseFloat(width) > 0), `border widths: ${borders}`).toBe(true)
  })
})
