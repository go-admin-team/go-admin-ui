import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The department page: the first tree table on the composable layer, and the
 * reason `paginated: false` exists.
 *
 * /api/v1/dept answers with the whole tree in one body -- no `{ list, count }`
 * envelope, no paging -- and the page never had a pager. Without the flag,
 * useTable would read `list` off an array and show nothing, and ProTable would
 * draw a pager the endpoint does not read.
 */
test.describe('sys-dept', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('renders the tree from a body that is not a page', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    // Two roots plus one child, expanded by default
    await expect(page.getByRole('cell', { name: '研发部' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '测试部' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '前端组' })).toBeVisible()
  })

  test('draws no pager and sends no paging keys', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.pagination-container')).toHaveCount(0)

    const sent = calls.dept.listQueries.at(-1) ?? ''
    expect(sent).not.toContain('pageIndex')
    expect(sent).not.toContain('pageSize')
  })

  test('searching keeps the query free of paging keys', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')
    const before = calls.dept.list

    await page.getByPlaceholder('请输入部门名称').fill('研发')
    await page.getByPlaceholder('请输入部门名称').press('Enter')

    await expect.poll(() => calls.dept.list).toBeGreaterThan(before)
    const sent = calls.dept.listQueries.at(-1) ?? ''
    expect(sent).toContain('deptName=')
    expect(sent).not.toContain('pageIndex')
  })

  test('a root offers no delete, a child does', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    // parentId === 0 marks a root: it has no parent to fall back to. The page
    // used to test `p_id`, a field no Go struct declares -- so the check read
    // `undefined !== 0`, which is always true, and roots offered delete too.
    // The fixture invented p_id as well, which is why the suite stayed green.
    const root = page.getByRole('row', { name: /研发部/ })
    await expect(root.getByRole('button', { name: '修改' })).toBeVisible()
    await expect(root.getByRole('button', { name: '删除' })).toHaveCount(0)

    const child = page.getByRole('row', { name: /前端组/ })
    await expect(child.getByRole('button', { name: '删除' })).toBeVisible()
  })

  test('editing loads the record and locks the parent', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /前端组/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改部门' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入部门名称')).toHaveValue('前端组')
    // Moving a department between parents is not something the endpoint supports
    await expect(dialog.locator('.el-form-item').filter({ hasText: '上级部门' })
      .locator('.el-select__wrapper')).toHaveClass(/is-disabled/)
  })

  test('adding under a row preselects that row as the parent', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /研发部/ }).getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加部门' })
    await expect(dialog).toBeVisible()
    // The selected label lives in .el-select__wrapper, not in the input: the
    // input el-select renders is a readonly combobox with an empty value.
    await expect(dialog.locator('.el-form-item').filter({ hasText: '上级部门' })
      .locator('.el-select__wrapper')).toHaveText('研发部')
  })

  // The list sends status as a number, the dictionary keys on strings, and the
  // write endpoints want numbers back.
  test('submits status and sort as numbers', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies: string[] = []
    await page.route('**/api/v1/dept/*', async route => {
      if (route.request().method() === 'PUT') bodies.push(route.request().postData() ?? '')
      await route.fallback()
    })

    await page.goto('/#/admin/sys-dept')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /前端组/ }).getByRole('button', { name: '修改' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '修改部门' })
    await dialog.getByPlaceholder('请输入部门名称').fill('前端小组')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.dept.update).toBe(1)
    const sent = JSON.parse(bodies.at(-1) || '{}')
    expect(typeof sent.status).toBe('number')
    expect(typeof sent.sort).toBe('number')
  })
})
