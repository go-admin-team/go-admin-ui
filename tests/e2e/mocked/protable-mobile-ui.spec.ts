import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { json } from './support/crud'

const PHONE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 900 }

/**
 * Serves sys-user as real pages, which mockCrud does not: it answers every
 * request with the whole array and a count equal to its length, so nothing that
 * accumulates pages can be exercised against it.
 *
 * Registered after installApiMocks so it wins -- Playwright matches routes in
 * reverse registration order.
 */
async function installPagedUsers(page: Page, total = 25) {
  const calls = { pages: [] as number[] }

  await page.route(/\/api\/v1\/sys-user(\?|$)/, async route => {
    if (route.request().method() !== 'GET') return route.fallback()

    const params = new URL(route.request().url()).searchParams
    const index = Number(params.get('pageIndex') ?? 1)
    const size = Number(params.get('pageSize') ?? 10)
    calls.pages.push(index)

    const start = (index - 1) * size
    const list = Array.from({ length: Math.max(0, Math.min(size, total - start)) }, (_, at) => ({
      userId: start + at + 1,
      username: `user${start + at + 1}`,
      nickName: `用户${start + at + 1}`,
      phone: '13800000000',
      status: '2',
      createdAt: '2026-08-01T00:00:00Z',
      dept: { deptName: '研发部' }
    }))

    await route.fulfill(json({ code: 200, data: { list, count: total }}))
  })

  return calls
}

const openList = async(page: Page) => {
  await page.goto('/#/admin/sys-user')
  await expect(page.locator('.pro-card').first()).toBeVisible({ timeout: 15000 })
  // main.js fades the splash layer out and removes it half a second after
  // mount. It covers the whole viewport until then, so any click before it goes
  // lands on the splash instead of the page.
  await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => { /* already gone */ })
}

/**
 * The phone layout, as a layout rather than as a narrow table.
 *
 * These cover the parts that fail silently: a floating button that opens onto
 * nothing, a filter sheet that leaves a filter applied with no sign of it, a
 * sentinel that replaces the list instead of extending it. None of them throw,
 * and the pages keep working -- they just stop being usable on a phone, which
 * no assertion about rows or requests would notice.
 */
test.describe('the phone layout', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
  })

  test('the tab strip is gone and takes its reserved space with it', async({ page }) => {
    await openList(page)

    await expect(page.locator('#tags-view-container')).toHaveCount(0)

    // The strip was hidden with CSS first, and AppMain -- which computes its own
    // top padding in JS from the settings flag -- kept reserving the 40px,
    // leaving a grey band under the navbar. The padding is the assertion
    // because it is the half that does not show up in a screenshot diff.
    const padding = await page.locator('.app-main').evaluate(el =>
      parseFloat(getComputedStyle(el).paddingTop)
    )
    expect(padding, `app-main reserves ${padding}px`).toBeLessThanOrEqual(50)
  })

  test('the toolbar moves into a floating button', async({ page }) => {
    await openList(page)

    // Not merely absent from the top: present, and reachable where a thumb is.
    await expect(page.locator('.pro-table__toolbar')).toHaveCount(0)
    const fab = page.locator('.pro-table__fab-btn')
    await expect(fab).toBeVisible()

    const box = (await fab.boundingBox())!
    expect(box.width, 'below the 44px minimum touch target').toBeGreaterThanOrEqual(44)
    expect(box.y + box.height, 'not anchored to the bottom of the screen')
      .toBeGreaterThan(PHONE.height - 120)

    // And it opens onto the page's own buttons rather than a duplicate set.
    await expect(page.locator('.pro-table__fab-menu')).toBeHidden()
    await fab.click()
    const menu = page.locator('.pro-table__fab-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('button', { name: '新增' })).toBeVisible()
  })

  test('filters open in a sheet and close once applied', async({ page }) => {
    await openList(page)

    // Inline the form cost 181px before any row was visible; collapsed it costs
    // one button.
    await expect(page.locator('.pro-table__search')).toHaveCount(0)

    await page.locator('.pro-table__filter-bar button').click()
    const sheet = page.locator('.el-drawer.pro-table__sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('button', { name: '查看结果' })).toBeVisible()

    await sheet.locator('input[placeholder="请输入用户名称"]').fill('admin')
    await sheet.getByRole('button', { name: '查看结果' }).click()

    // The result is the feedback; a sheet left open would cover it.
    await expect(sheet).toBeHidden()
  })

  test('the filter button says how many filters are applied', async({ page }) => {
    await openList(page)
    const bar = page.locator('.pro-table__filter-bar button')

    // Without this count a filter left set is invisible behind a closed sheet,
    // and an empty list with no explanation is worse than the form's height.
    await expect(bar).toHaveText(/筛选$/)

    await bar.click()
    const sheet = page.locator('.el-drawer.pro-table__sheet')
    await sheet.locator('input[placeholder="请输入用户名称"]').fill('admin')
    await sheet.getByRole('button', { name: '查看结果' }).click()
    await expect(sheet).toBeHidden()

    await expect(bar).toHaveText(/筛选 · 1/)
  })
})

test.describe('loading more by scrolling', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
  })

  test('the next page is added to the list, not swapped in', async({ page }) => {
    const calls = await installPagedUsers(page, 25)
    await openList(page)

    const cards = page.locator('.pro-card')
    await expect(cards).toHaveCount(10)
    await expect(page.locator('.pro-card__title').first()).toHaveText('user1')

    await page.locator('.pro-cards__more button').click()

    // 20, not 10: replacing would leave the count unchanged and the first title
    // reading user11 -- which is exactly what a pager does, and the bug this
    // guards against.
    await expect(cards).toHaveCount(20)
    await expect(page.locator('.pro-card__title').first()).toHaveText('user1')
    expect(calls.pages).toEqual([1, 2])
  })

  test('a card stays open when the next page arrives', async({ page }) => {
    await installPagedUsers(page, 25)
    await openList(page)

    const first = page.locator('.pro-card').first()
    await first.locator('.pro-card__toggle').click()
    await expect(first.locator('.pro-card__toggle')).toHaveText('收起')

    await page.locator('.pro-cards__more button').click()
    await expect(page.locator('.pro-card')).toHaveCount(20)

    // The reset watches the row count rather than the array: appending leaves
    // the rows already on screen unchanged, and closing them would punish
    // scrolling.
    await expect(first.locator('.pro-card__toggle')).toHaveText('收起')
  })

  test('the list stops when it runs out', async({ page }) => {
    await installPagedUsers(page, 12)
    await openList(page)

    await page.locator('.pro-cards__more button').click()
    await expect(page.locator('.pro-card')).toHaveCount(12)

    // The sentinel has to disappear, or it keeps asking for a page that is not
    // there for as long as the list is on screen.
    await expect(page.locator('.pro-cards__more')).toHaveCount(0)
    await expect(page.locator('.pro-cards__end')).toBeVisible()
  })

  test('a new search starts the list over', async({ page }) => {
    await installPagedUsers(page, 25)
    await openList(page)
    await page.locator('.pro-cards__more button').click()
    await expect(page.locator('.pro-card')).toHaveCount(20)

    await page.locator('.pro-table__filter-bar button').click()
    const sheet = page.locator('.el-drawer.pro-table__sheet')
    await sheet.locator('input[placeholder="请输入用户名称"]').fill('user')
    await sheet.getByRole('button', { name: '查看结果' }).click()

    // Page one is also the signal that the stack is stale; without it the new
    // results would be appended below the old ones.
    await expect(page.locator('.pro-card')).toHaveCount(10)
  })
})

test.describe('the desktop layout is untouched', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.setViewportSize(DESKTOP)
  })

  test('keeps its table, toolbar, inline filters and pager', async({ page }) => {
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await expect(page.locator('.pro-table__search')).toBeVisible()
    await expect(page.locator('.pro-table__toolbar')).toBeVisible()
    await expect(page.locator('.pagination-container')).toBeVisible()

    await expect(page.locator('.pro-card')).toHaveCount(0)
    await expect(page.locator('.pro-table__fab')).toHaveCount(0)
    await expect(page.locator('.pro-table__filter-bar')).toHaveCount(0)
    await expect(page.locator('#tags-view-container')).toBeVisible()
  })
})
