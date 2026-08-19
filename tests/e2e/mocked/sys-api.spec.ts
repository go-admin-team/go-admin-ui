import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The route registry. The Go side registers these, so the page edits them and
 * nothing else -- the version it replaced carried handleAdd, handleDelete and
 * selection tracking that no button in the template reached.
 */
test.describe('sys-api', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists routes with their method', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(3)
    await expect(page.getByRole('row', { name: /用户列表/ }).getByText('GET')).toBeVisible()
    await expect(page.getByRole('row', { name: /菜单删除/ }).getByText('DELETE')).toBeVisible()
  })

  // SYS routes are infrastructure and cannot be granted to a role
  test('distinguishes SYS routes, BUS routes and untitled ones', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    const title = (name: RegExp) =>
      page.getByRole('row', { name }).locator('td').first().locator('.el-tag')

    await expect(title(/菜单删除/)).toHaveClass(/el-tag--success/)
    await expect(title(/用户列表/)).toHaveClass(/el-tag--info/)
    // A route the backend registered without a title
    await expect(page.getByRole('row', { name: /unnamed/ }).locator('td').first()
      .locator('.el-tag')).toHaveText('暂无')
  })

  test('offers no create or delete', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.pro-table__toolbar')).toHaveCount(0)
    await expect(page.getByRole('row', { name: /用户列表/ }).getByRole('button', { name: '删除' }))
      .toHaveCount(0)
  })

  // titleOrder, pathOrder and createdAtOrder are all bound by SysApiGetPageReq,
  // so unlike the dictionary pages these headers can sort
  test('sorting sends an order key the endpoint binds', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    await page.getByRole('columnheader', { name: /标题/ }).click()
    await expect.poll(() => calls.sysApi.listQueries.at(-1)).toContain('titleOrder=asc')

    // The previous key goes away rather than stacking beside the new one
    await page.getByRole('columnheader', { name: /创建时间/ }).click()
    await expect.poll(() => calls.sysApi.listQueries.at(-1)).toContain('createdAtOrder=asc')
    expect(calls.sysApi.listQueries.at(-1) ?? '').not.toContain('titleOrder')
  })

  test('editing loads the route and locks its path', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /用户列表/ }).getByRole('button', { name: '修改' }).click()

    const drawer = page.getByRole('dialog').filter({ hasText: '修改接口' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByPlaceholder('标题')).toHaveValue('用户列表')
    // The backend owns the path; it is shown for confirmation, not for editing
    await expect(drawer.getByPlaceholder('地址')).toBeDisabled()
    await expect(drawer.getByPlaceholder('地址')).toHaveValue('/api/v1/sys-user')
  })

  test('saving sends the edited route', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, /\/api\/v1\/sys-api\/\d+/, 'PUT')

    await page.goto('/#/admin/sys-api')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /用户列表/ }).getByRole('button', { name: '修改' }).click()
    const drawer = page.getByRole('dialog').filter({ hasText: '修改接口' })
    await drawer.getByPlaceholder('标题').fill('用户分页列表')
    await drawer.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.sysApi.update).toBe(1)
    expect(JSON.parse(bodies.at(-1) || '{}').title).toBe('用户分页列表')
  })
})
