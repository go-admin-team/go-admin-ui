import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks, menuRows } from './fixtures'
import { captureBodies, json } from './support/crud'

/**
 * The menu page: the last of the tree tables, and the most conditional form in
 * the app -- which fields exist depends on whether the entry is a directory, a
 * page or a button.
 */
test.describe('sys-menu', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('renders the tree without a pager', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await expect(page.getByRole('cell', { name: '系统管理' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '用户管理' })).toBeVisible()
    await expect(page.locator('.pagination-container')).toHaveCount(0)

    expect(calls.menu.listQueries.at(-1) ?? '').not.toContain('pageIndex')
  })

  // A button-level entry has no route of its own, so it is never in the sidebar
  test('a button entry shows no visibility state', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await expect(page.getByRole('row', { name: /用户管理/ }).getByText('显示')).toBeVisible()
    await expect(page.getByRole('row', { name: /用户新增/ }).getByText('--')).toBeVisible()
  })

  test('the permission column reveals the routes it grants', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await page.getByText('admin:sysUser:list').hover()

    const popover = page.locator('.el-popover:visible')
    await expect(popover).toContainText('用户列表')
    await expect(popover).toContainText('/api/v1/sys-user')
  })

  // Which fields exist follows the type: a directory has no permission code, a
  // button has no route, icon or visibility.
  test('the form follows the menu type', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')
    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加菜单' })
    await expect(dialog).toBeVisible()

    // 目录 is the default: routes yes, permission no
    await expect(dialog.getByPlaceholder('请输入路由地址')).toBeVisible()
    await expect(dialog.getByPlaceholder('如 admin:sysUser:add')).toHaveCount(0)

    // Element Plus hides the native input and paints a label, so click the label
    const typeGroup = dialog.locator('.el-form-item').filter({ hasText: '菜单类型' })
    await typeGroup.locator('.el-radio__label').filter({ hasText: /^菜单$/ }).click()
    await expect(dialog.getByPlaceholder('如 admin:sysUser:add')).toBeVisible()
    await expect(dialog.locator('.el-transfer')).toBeVisible()

    await typeGroup.locator('.el-radio__label').filter({ hasText: /^按钮$/ }).click()
    await expect(dialog.getByPlaceholder('请输入路由地址')).toHaveCount(0)
    await expect(dialog.getByPlaceholder('如 admin:sysUser:add')).toBeVisible()
  })

  test('adding under a row preselects that row as the parent', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /系统管理/ }).getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加菜单' })
    await expect(dialog.locator('.el-form-item').filter({ hasText: '上级菜单' })
      .locator('.el-select__wrapper')).toHaveText('系统管理')
  })

  // The picker used to read `table.rows`, so a search truncated it: opening 修改
  // on a match whose parent had been filtered away left the field empty, and
  // saving re-parented the menu to whatever was picked next.
  test('the parent picker keeps the whole tree after a search', async({ page }) => {
    await installApiMocks(page)

    // Registered after installApiMocks so it wins -- routes match in reverse
    // registration order. A filtered list answers with the leaf alone.
    await page.route(/\/api\/v1\/menu(\?|$)/, async route => {
      const url = new URL(route.request().url())
      if (route.request().method() !== 'GET' || !url.searchParams.get('title')) {
        await route.fallback()
        return
      }
      await route.fulfill(json({
        code: 200,
        msg: 'ok',
        data: [{ ...menuRows[0].children![0], children: [] }]
      }))
    })

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await page.getByPlaceholder('请输入菜单名称').fill('用户管理')
    await page.getByPlaceholder('请输入菜单名称').press('Enter')
    await expect(page.getByRole('cell', { name: '系统管理' })).toHaveCount(0)

    await page.getByRole('row', { name: /用户管理/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改菜单' })
    // Its parent was filtered out of the list, but the picker still resolves it
    await expect(dialog.locator('.el-form-item').filter({ hasText: '上级菜单' })
      .locator('.el-select__wrapper')).toHaveText('系统管理')
  })

  // The picker and the list read the same endpoint, so fetching the tree on
  // mount and again after every write costs a second copy of a body already on
  // screen. It loads on first use instead.
  test('the tree costs no request until a dialog needs it', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')
    await page.waitForTimeout(300)

    // Just the list; nothing has asked for the picker yet
    expect(calls.menu.list).toBe(1)

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()
    await expect.poll(() => calls.menu.list).toBe(2)

    // Opening it again reuses the tree it already has
    await page.getByRole('dialog').getByRole('button', { name: '取 消' }).click()
    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()
    await page.waitForTimeout(300)
    expect(calls.menu.list).toBe(2)
  })

  test('editing loads the record', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /用户管理/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改菜单' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入菜单标题')).toHaveValue('用户管理')
    await expect(dialog.getByPlaceholder('请输入组件路径')).toHaveValue('/admin/sys-user/index')
  })

  // The old page maintained the expanded list from the transfer's move events,
  // and its removal branch pushed nothing -- so revoking a route emptied it.
  test('revoking a route shrinks the granted set rather than clearing it', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, /\/api\/v1\/menu\/\d+/, 'PUT')

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')
    await page.getByRole('row', { name: /用户管理/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改菜单' })
    const transfer = dialog.locator('.el-transfer')
    await expect(transfer).toBeVisible()

    // Grant the second route, so two are held
    // The left panel lists the routes not yet granted; its checkbox is a label too
    await transfer.locator('.el-transfer-panel').first()
      .locator('.el-transfer-panel__list .el-checkbox').first().click()
    await transfer.getByRole('button', { name: '授权' }).click()

    await dialog.getByRole('button', { name: '确 定' }).click()
    await expect.poll(() => calls.menu.update).toBeGreaterThan(0)

    const sent = JSON.parse(bodies.at(-1) || '{}')
    expect(sent.apis.length).toBe(2)
    // Kept in step with the ids rather than rebuilt from move events
    expect(sent.sysApi.length).toBe(2)
  })

  test('deleting asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-menu')
    await page.waitForSelector('.el-table')
    const before = calls.menu.list

    await page.getByRole('row', { name: /用户新增/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.menu.remove).toBe(1)
    await expect.poll(() => calls.menu.list).toBeGreaterThan(before)
  })
})
