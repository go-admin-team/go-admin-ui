import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The two audit pages. They read and delete and nothing writes them, so neither
 * has a useForm -- the shape that proves the layer works without one.
 */
test.describe('sys-login-log', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists attempts and labels their status', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-login-log')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('row', { name: /admin/ }).getByText('正常')).toBeVisible()
    await expect(page.getByRole('row', { name: /tester/ }).getByText('关闭')).toBeVisible()
  })

  // The old page ran its query through addDateRange, which attached an empty
  // beginTime and endTime even though this page has no date picker.
  test('sends only the filters it has', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-login-log')
    await page.waitForSelector('.el-table')

    const sent = calls.loginLog.listQueries.at(-1) ?? ''
    expect(sent).toContain('createdAtOrder=desc')
    expect(sent).not.toContain('beginTime')
    expect(sent).not.toContain('endTime')
  })

  test('the ip column reveals where the attempt came from', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-login-log')
    await page.waitForSelector('.el-table')

    await page.getByText('192.168.1.10').hover()

    const popover = page.locator('.el-popover:visible')
    await expect(popover).toContainText('Chrome')
    await expect(popover).toContainText('macOS')
  })

  test('deleting asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, '**/api/v1/sys-login-log', 'DELETE')

    await page.goto('/#/admin/sys-login-log')
    await page.waitForSelector('.el-table')
    const before = calls.loginLog.list

    await page.getByRole('row', { name: /tester/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.loginLog.remove).toBe(1)
    await expect.poll(() => calls.loginLog.list).toBeGreaterThan(before)
    // The id has to reach the request. Keying the page on a field the endpoint
    // does not send makes remove() a silent no-op, which a call count alone
    // cannot tell apart from a working delete.
    expect(JSON.parse(bodies.at(-1) || '{}').ids).toEqual([2])
  })

  test('bulk delete sends the ids of the checked rows', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, '**/api/v1/sys-login-log', 'DELETE')

    await page.goto('/#/admin/sys-login-log')
    await page.waitForSelector('.el-table')

    await page.locator('.el-table__row').first().locator('.el-checkbox').click()
    const bulk = page.locator('.pro-table__toolbar').getByRole('button', { name: '删除' })
    await expect(bulk).toBeEnabled()
    await bulk.click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.loginLog.remove).toBe(1)
    expect(JSON.parse(bodies.at(-1) || '{}').ids).toEqual([1])
  })
})

test.describe('sys-oper-log', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('the search box sends a filter the endpoint actually binds', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    await page.getByPlaceholder('请输入访问地址').fill('/api/v1/sys-user')
    await page.getByPlaceholder('请输入访问地址').press('Enter')

    await expect.poll(() => calls.operLog.listQueries.at(-1)).toContain('operUrl=')
    // operName has no `form:` tag on the Go DTO, so gin drops it
    expect(calls.operLog.listQueries.at(-1) ?? '').not.toContain('operName')
  })

  test('sorting the date column sends the one order key the endpoint binds', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    // The list starts descending, and el-table cycles ascending → descending → none
    expect(calls.operLog.listQueries.at(-1) ?? '').toContain('createdAtOrder=desc')

    const header = page.getByRole('columnheader', { name: /操作日期/ })
    await header.click()
    await expect.poll(() => calls.operLog.listQueries.at(-1) ?? '').not.toContain('Order=')

    await header.click()
    await expect.poll(() => calls.operLog.listQueries.at(-1)).toContain('createdAtOrder=asc')
    // operTimeOrder has no `form:` tag, so sending it would leave the list
    // unordered -- and useTable would have dropped createdAtOrder to make room
    expect(calls.operLog.listQueries.at(-1) ?? '').not.toContain('operTimeOrder')
  })

  test('lists operations with their method', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('row', { name: /sys-user/ }).getByText('POST')).toBeVisible()
  })

  // This is the one page of the five that actually had a date picker. Its query
  // now carries the two keys the endpoint reads, written from the picker's own
  // state rather than through a helper that read `this`.
  test('the date range reaches the query', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    const sent = calls.operLog.listQueries.at(-1) ?? ''
    expect(sent).not.toContain('beginTime=2026')

    await page.locator('.pro-table__search input[placeholder="开始日期"]').fill('2026-08-01 00:00:00')
    await page.keyboard.press('Enter')
    await page.locator('.pro-table__search input[placeholder="结束日期"]').fill('2026-08-31 23:59:59')
    await page.keyboard.press('Enter')

    await expect.poll(() => calls.operLog.listQueries.at(-1)).toContain('beginTime=2026-08-01')
    expect(calls.operLog.listQueries.at(-1) ?? '').toContain('endTime=2026-08-31')
  })

  // The picker writes into the query and the query writes back into the picker.
  // Without a guard on the way back, reset's own reload and the echo through the
  // picker both fire, and one of the two round trips is thrown away.
  test('resetting a date range reloads once, not twice', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    // A daterange only commits once both ends are filled
    await page.locator('.pro-table__search input[placeholder="开始日期"]').fill('2026-08-01 00:00:00')
    await page.keyboard.press('Enter')
    await page.locator('.pro-table__search input[placeholder="结束日期"]').fill('2026-08-31 23:59:59')
    await page.keyboard.press('Enter')
    await expect.poll(() => calls.operLog.listQueries.at(-1)).toContain('beginTime=2026-08-01')

    const before = calls.operLog.list
    await page.locator('.pro-table__search').getByRole('button', { name: '重置' }).click()

    await expect.poll(() => calls.operLog.list).toBeGreaterThan(before)
    await page.waitForTimeout(500)
    expect(calls.operLog.list - before).toBe(1)
    expect(calls.operLog.listQueries.at(-1) ?? '').not.toContain('beginTime=2026')
  })

  test('the detail dialog shows the payloads', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /sys-user/ }).getByRole('button', { name: '详细' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '操作日志详细' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('/api/v1/sys-user')
    await expect(dialog).toContainText('newbie')
    await expect(dialog).toContainText('"code":200')
  })

  // useRemove holds a flag across the dialog for this reason; a hand-rolled
  // confirm has to hold one too, or two fast clicks stack two dialogs and empty
  // the log twice once both are accepted.
  test('double-clicking 清空 opens one dialog, not two', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    // Both clicks in one tick: the guard is set synchronously before the first
    // await, so the second call returns immediately. Clicking twice through the
    // page would just dismiss the first dialog on its own overlay.
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('.pro-table__toolbar button'))
        .find(el => el.textContent?.includes('清空')) as HTMLButtonElement
      button.click()
      button.click()
    })

    await expect(page.locator('.el-message-box')).toHaveCount(1)

    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()
    await expect.poll(() => calls.extra.operLogClean).toBe(1)
    await expect(page.locator('.el-message-box')).toHaveCount(0)
  })

  // Emptying the whole log asks separately from deleting a row
  test('clearing the log asks before it does it', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '清空' }).click()

    const confirm = page.locator('.el-message-box')
    await expect(confirm).toContainText('不可撤销')
    await confirm.getByRole('button', { name: '取消' }).click()
    expect(calls.extra.operLogClean).toBe(0)

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '清空' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()
    await expect.poll(() => calls.extra.operLogClean).toBe(1)
  })
})
