import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * How a list page divides itself up.
 *
 * Two groups of controls with different jobs: the search form decides which
 * rows are on screen, and the toolbar acts on the rows that already are. They
 * used to share one flat surface with nothing between them, so which button
 * changed the query and which changed the data was left to the reader.
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

  test('a rule separates the query from the data it filters', async({ page }) => {
    const border = await page.locator('.pro-table__search').evaluate(el => {
      const style = getComputedStyle(el as HTMLElement)
      return { width: parseFloat(style.borderBottomWidth), colour: style.borderBottomColor }
    })

    expect(border.width, 'the search panel has a bottom rule').toBeGreaterThan(0)
    // Not transparent: a border set to the page colour is the same as no border.
    expect(border.colour).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('the toolbar sits against the same edge as the row actions', async({ page }) => {
    const table = await page.locator('.el-table').boundingBox()
    const toolbar = await page.locator('.pro-table__toolbar').boundingBox()
    const lastButton = await page.locator('.pro-table__toolbar .el-button').last().boundingBox()

    // The toolbar spans the width; what matters is where its content ends.
    const toolbarEnd = lastButton!.x + lastButton!.width
    const tableEnd = table!.x + table!.width

    expect(Math.abs(toolbarEnd - tableEnd), `toolbar ends at ${toolbarEnd}, table at ${tableEnd}`)
      .toBeLessThanOrEqual(2)

    // And starts well past the left edge -- otherwise it is still a left-aligned
    // row that happens to reach the right.
    const firstButton = await page.locator('.pro-table__toolbar .el-button').first().boundingBox()
    expect(firstButton!.x, 'the toolbar does not start at the left edge')
      .toBeGreaterThan(toolbar!.x + toolbar!.width / 2)
  })

  test('the search form stays on the left', async({ page }) => {
    const search = await page.locator('.pro-table__search').boundingBox()
    const firstField = await page.locator('.pro-table__search .el-form-item').first().boundingBox()

    // Filters are read left to right like the labels they carry; only the
    // actions moved.
    expect(firstField!.x - search!.x, 'the first filter starts at the left').toBeLessThan(20)
  })
})
