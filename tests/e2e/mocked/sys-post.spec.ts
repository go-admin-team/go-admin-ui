import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The post page: a standard paginated list, migrated from the Options API.
 *
 * What is checked is the behaviour the old page had, so a regression shows up
 * as a failure rather than as a diff: paging keys go out, the dictionary labels
 * the status column, the form converts status back to a number, and the export
 * writes what the table is holding.
 */
test.describe('sys-post', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists posts with paging keys', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: '董事长' })).toBeVisible()

    const sent = calls.post.listQueries.at(-1) ?? ''
    expect(sent).toContain('pageIndex=1')
    expect(sent).toContain('pageSize=')
  })

  test('labels status through the dictionary', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    // status 2 is 正常, status 1 is 停用 -- the dictionary keys on strings while
    // the list sends numbers, so this also covers the loose comparison
    await expect(page.getByRole('row', { name: /董事长/ }).getByText('正常')).toBeVisible()
    await expect(page.getByRole('row', { name: /开发工程师/ }).getByText('停用')).toBeVisible()
  })

  test('bulk buttons stay disabled until a row is picked', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    const toolbar = page.locator('.pro-table__toolbar')
    await expect(toolbar.getByRole('button', { name: '修改' })).toBeDisabled()
    await expect(toolbar.getByRole('button', { name: '删除' })).toBeDisabled()

    await page.locator('.el-table__row .el-checkbox').first().click()

    await expect(toolbar.getByRole('button', { name: '修改' })).toBeEnabled()
    await expect(toolbar.getByRole('button', { name: '删除' })).toBeEnabled()
  })

  test('editing loads the record', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /开发工程师/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改岗位' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入岗位名称')).toHaveValue('开发工程师')
  })

  // The list sends status as a number, the dictionary keys on strings, and the
  // write endpoints want numbers back.
  test('submits status as a number', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies: string[] = []
    await page.route('**/api/v1/post/*', async route => {
      if (route.request().method() === 'PUT') bodies.push(route.request().postData() ?? '')
      await route.fallback()
    })

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /开发工程师/ }).getByRole('button', { name: '修改' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '修改岗位' })
    await dialog.getByPlaceholder('请输入岗位名称').fill('高级开发工程师')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.post.update).toBeGreaterThan(0)
    const sent = JSON.parse(bodies.at(-1) || '{}')
    expect(typeof sent.status).toBe('number')
  })

  test('creating a post reaches the create endpoint', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '添加岗位' })
    await dialog.getByPlaceholder('请输入岗位名称').fill('产品经理')
    await dialog.getByPlaceholder('请输入编码名称').fill('pm')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.post.create).toBe(1)
    await expect(dialog).toBeHidden()
  })

  test('deleting a row asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')
    const before = calls.post.list

    await page.getByRole('row', { name: /开发工程师/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.post.remove).toBe(1)
    await expect.poll(() => calls.post.list).toBeGreaterThan(before)
  })

  test('export asks before writing anything', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '导出' }).click()

    const confirm = page.locator('.el-message-box')
    await expect(confirm).toBeVisible()
    // Says what it does: the rows on screen, not the whole collection
    await expect(confirm).toContainText('当前列表')
    await confirm.getByRole('button', { name: '取消' }).click()
    await expect(confirm).toBeHidden()
  })
})
