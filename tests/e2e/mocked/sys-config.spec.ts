import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The config page: a list that arrives pre-sorted, which is why useTable grew a
 * defaultSort option.
 */
test.describe('sys-config', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists settings', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: '初始密码' })).toBeVisible()
  })

  test('asks for the default sort on the first load', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    expect(calls.config.listQueries.at(-1) ?? '').toContain('createdAtOrder=desc')
  })

  // The old page tracked its default sort by hand and, on reset, restored it
  // under the key `createdAtOrderOrder` -- one Order too many. So the default
  // sort was lost and a junk key went out with every request after a reset.
  test('reset restores the default sort rather than a mangled key', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    await page.locator('th').filter({ hasText: '名称' }).first()
      .locator('.sort-caret.ascending').click()
    await expect.poll(() => calls.config.listQueries.at(-1)).toContain('configNameOrder=asc')

    await page.locator('.pro-table__search').getByRole('button', { name: '重置' }).click()

    const sent = calls.config.listQueries.at(-1) ?? ''
    expect(sent).toContain('createdAtOrder=desc')
    expect(sent).not.toContain('OrderOrder')
    expect(sent).not.toContain('configNameOrder')
  })

  test('sorting one column replaces the default rather than adding to it', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    await page.locator('th').filter({ hasText: '编码' }).first()
      .locator('.sort-caret.ascending').click()

    await expect.poll(() => calls.config.listQueries.at(-1)).toContain('idOrder=asc')
    // Two contradictory orders would otherwise reach the backend
    expect(calls.config.listQueries.at(-1) ?? '').not.toContain('createdAtOrder')
  })

  test('the key column reveals its value on hover', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    await page.getByText('sys_user_initPassword').hover()

    const popover = page.locator('.el-popover:visible')
    await expect(popover).toContainText('Init@123')
    await expect(popover).toContainText('否')
  })

  test('editing loads the record and fixes the identity fields', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /初始密码/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改参数' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入参数键值')).toHaveValue('Init@123')
    // Code looks settings up by name and key, so those are fixed once created
    await expect(dialog.getByPlaceholder('请输入参数名称')).toBeDisabled()
    await expect(dialog.getByPlaceholder('请输入参数键名')).toBeDisabled()
  })

  test('deleting asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config')
    await page.waitForSelector('.el-table')
    const before = calls.config.list

    await page.getByRole('row', { name: /应用名称/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.config.remove).toBe(1)
    await expect.poll(() => calls.config.list).toBeGreaterThan(before)
  })
})
