import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { searchToggle } from './support/protable'

/**
 * How a list page divides itself up.
 *
 * Two groups of controls with different jobs: the search form decides which
 * rows are on screen, and the toolbar acts on the rows that already are. They
 * are two cards with the page showing between them, rather than one surface
 * with a rule drawn through it.
 *
 * Rendered geometry rather than class names, because a rule that stops applying
 * -- overridden, or dropped in a refactor -- leaves the markup looking right.
 */
test.describe('list page layout', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/#/admin/sys-role')
    await page.waitForSelector('.el-table__row')
    await page.waitForTimeout(600)
  })

  test('the query and the data are separate cards', async({ page }) => {
    const search = await page.locator('.pro-table__search-panel').boundingBox()
    const data = await page.locator('.pro-table__data-panel').boundingBox()

    const gap = data!.y - (search!.y + search!.height)
    expect(gap, `panels are ${gap}px apart`).toBeGreaterThan(4)

    // Both are drawn surfaces, not bare regions of the page: a gap between two
    // things with no edges of their own is just white space.
    for (const panel of ['.pro-table__search-panel', '.pro-table__data-panel']) {
      const border = await page.locator(panel).evaluate(el => {
        const style = getComputedStyle(el as HTMLElement)
        return { width: parseFloat(style.borderTopWidth), colour: style.borderTopColor }
      })
      expect(border.width, `${panel} has an edge`).toBeGreaterThan(0)
      expect(border.colour, `${panel}'s edge is not transparent`).not.toBe('rgba(0, 0, 0, 0)')
    }
  })

  test('the search buttons sit at the right edge, over the table', async({ page }) => {
    const table = await page.locator('.el-table').boundingBox()
    const actions = page.locator('.pro-table__search-actions')
    // The last button, not the cell holding it: a cell in the right-hand column
    // ends at the right edge whichever way its contents are packed.
    const lastButton = await actions.locator('.el-button').last().boundingBox()

    const buttonsEnd = lastButton!.x + lastButton!.width
    const tableEnd = table!.x + table!.width

    // Within the card's padding of the same edge the toolbar, the row actions
    // and the pager all end on.
    expect(Math.abs(buttonsEnd - tableEnd), `buttons end at ${buttonsEnd}, table at ${tableEnd}`)
      .toBeLessThanOrEqual(24)
  })

  test('the search form stays on the left', async({ page }) => {
    const search = await page.locator('.pro-table__search').boundingBox()
    const firstField = await page.locator('.pro-table__search .el-form-item').first().boundingBox()

    // Filters are read left to right like the labels they carry; only the
    // actions moved.
    expect(firstField!.x - search!.x, 'the first filter starts at the left').toBeLessThan(20)
  })

  /**
   * sys-role carries three filters and the panel is three columns wide at this
   * size, one of which belongs to the buttons -- so the third filter starts out
   * hidden and the toggle is what brings it back.
   */
  test('filters past the first row are collapsed, and the toggle opens them', async({ page }) => {
    const fields = page.locator('.pro-table__search .el-form-item')
    await expect(fields).toHaveCount(3)
    await expect(fields.nth(2), 'the third filter is collapsed away').toBeHidden()

    // One row: the buttons are level with the filters that are showing.
    const first = await fields.first().boundingBox()
    const actions = await page.locator('.pro-table__search-actions').boundingBox()
    expect(Math.abs(actions!.y - first!.y), 'the buttons are on the filter row').toBeLessThan(20)

    await searchToggle(page).click()
    await expect(fields.nth(2), 'expanding shows it').toBeVisible()

    await searchToggle(page, '收起').click()
    await expect(fields.nth(2), 'collapsing hides it again').toBeHidden()
  })
})

test.describe('a search panel with room for every filter', () => {
  test('offers no toggle', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    // sys-menu has two filters, which fit beside the buttons at this width.
    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table__row')

    await expect(page.locator('.pro-table__search .el-form-item')).toHaveCount(2)
    await expect(searchToggle(page)).toHaveCount(0)
  })
})
