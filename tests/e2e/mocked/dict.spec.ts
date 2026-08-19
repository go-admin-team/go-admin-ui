import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The dictionary pair. The entries page is the reason useTable has
 * `immediate: false`: its route carries a dict id, but the entries endpoint
 * filters on the dict type string, so the first list request cannot go out
 * until the type has been fetched.
 */
test.describe('dict', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists dictionary types', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/dict')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('row', { name: /系统状态/ }).locator('.el-tag')).toHaveText('正常')
  })

  // The type is a link into its own entries, carrying the record's id
  test('the type links through to its entries', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/dict')
    await page.waitForSelector('.el-table')

    await page.getByRole('link', { name: 'sys_common_status' }).click()

    await expect(page).toHaveURL(/#\/admin\/dict\/data\/1$/)
    await page.waitForSelector('.el-table')
    await expect(page.getByRole('cell', { name: '关闭状态' })).toBeVisible()
  })

  // status is an int on SysDictType, a string in the dictionary that labels it
  test('submits status as a number', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, /\/api\/v1\/dict\/type\/\d+/, 'PUT')

    await page.goto('/#/admin/dict')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /系统状态/ }).getByRole('button', { name: '修改' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '修改字典类型' })
    await dialog.getByPlaceholder('请输入内容').fill('改过的备注')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.dictType.update).toBe(1)
    expect(typeof JSON.parse(bodies.at(-1) || '{}').status).toBe('number')
  })

  test('deleting sends the id the endpoint keys on', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, /\/api\/v1\/dict\/type(\?|$)/, 'DELETE')

    await page.goto('/#/admin/dict')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /用户性别/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.dictType.remove).toBe(1)
    expect(JSON.parse(bodies.at(-1) || '{}').ids).toEqual([2])
  })
})

test.describe('dict data', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  // Without immediate: false the list would go out on mount with no dictType,
  // which the endpoint reads as "every entry in the system".
  test('no list request goes out before the type is known', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/dict/data/1')
    await page.waitForSelector('.el-table')

    expect(calls.dictData.list).toBe(1)
    expect(calls.dictData.listQueries.at(-1) ?? '').toContain('dictType=sys_common_status')
  })

  test('lists the entries of that dictionary', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/dict/data/1')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: '正常状态' })).toBeVisible()
  })

  // Resetting has to land back on this dictionary, not on every entry
  test('resetting keeps the dictionary it belongs to', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/dict/data/1')
    await page.waitForSelector('.el-table')

    await page.getByPlaceholder('请输入字典标签').fill('正常')
    await page.getByPlaceholder('请输入字典标签').press('Enter')
    await expect.poll(() => calls.dictData.listQueries.at(-1)).toContain('dictLabel=')

    await page.locator('.pro-table__search').getByRole('button', { name: '重置' }).click()

    await expect.poll(() => calls.dictData.listQueries.at(-1) ?? '').not.toContain('dictLabel=')
    expect(calls.dictData.listQueries.at(-1) ?? '').toContain('dictType=sys_common_status')
  })

  // Adding an entry cannot choose its dictionary; the page decides it
  test('a new entry is locked to this dictionary', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/dict/data/1')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加字典数据' })
    const type = dialog.locator('.el-form-item').filter({ hasText: '字典类型' }).locator('input')
    await expect(type).toHaveValue('sys_common_status')
    await expect(type).toBeDisabled()
  })
})
