import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'
import { readWorkbook, values } from './support/workbook'

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
    const bodies = await captureBodies(page, '**/api/v1/post/*', 'PUT')

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

  /**
   * The only test that reaches the writer itself.
   *
   * Everything up to here stops at the confirm, so the export button could go on
   * downloading a corrupt workbook through a green suite -- which is the exact
   * shape a writer swap fails in: same button, same dialog, same file name, and
   * a file Excel refuses to open. The assertions are on the package and its
   * cells, and deliberately not on how a particular writer spells them.
   */
  test('confirming the export downloads a readable workbook', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-post')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '导出' }).click()
    const downloaded = page.waitForEvent('download')
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    const download = await downloaded
    expect(download.suggestedFilename()).toBe('岗位管理.xlsx')

    const workbook = await readWorkbook(download)
    expect(workbook.parts).toContain('[Content_Types].xml')
    expect(workbook.parts).toContain('xl/workbook.xml')

    // The heading row the page declares, then one row per row on screen
    expect(values(workbook)).toEqual([
      ['岗位编号', '岗位编码', '岗位名称', '排序', '创建时间'],
      ['1', 'ceo', '董事长', '1', '2026-08-01T10:00:00Z'],
      ['2', 'dev', '开发工程师', '2', '2026-08-02T10:00:00Z']
    ])

    // postId and sort are numbers in the fixture and have to stay numbers in the
    // sheet, or Excel sorts 10 before 2 and the totals row a user adds is empty.
    const [, first] = workbook.rows
    expect(first.map(cell => cell.numeric)).toEqual([true, false, false, true, false])
  })
})
