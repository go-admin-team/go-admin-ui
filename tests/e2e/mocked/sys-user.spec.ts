import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The user page, rebuilt on useTable / useForm / ProTable.
 *
 * It is the page the composable layer was designed against: two independent
 * forms, a filter driven from outside the search form, sorting, and bulk
 * actions. What is checked here is the behaviour the old page got wrong, so
 * these fail if the composables regress rather than merely if the markup moves.
 */
test.describe('sys-user', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists users from the API', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-user')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: 'admin', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '研发部' })).toBeVisible()
  })

  // sys-user set `queryParams.page = 1`, a key the backend does not read, so
  // searching from page 3 quietly returned page 3 of the new result set.
  test('searching sends the filter and returns to page 1', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table__row')).toHaveCount(2)

    await page.getByPlaceholder('请输入用户名称').fill('tester')
    await page.getByRole('button', { name: '搜索' }).click()

    await expect.poll(() => calls.user.list).toBeGreaterThan(1)
    const latest = calls.user.listQueries[calls.user.listQueries.length - 1]
    expect(latest).toContain('username=tester')
    expect(latest).toContain('pageIndex=1')
  })

  // Enter reaches the search through ProTable's native-type="submit" button, not
  // through a per-field @keyup.enter. The browser's implicit-submission rule
  // only fires when a form has exactly one field that blocks it, so relying on
  // it made Enter work on some search bars and not others -- and double-fire on
  // any page that added @keyup.enter to compensate. Exactly one request.
  test('Enter in a search field searches exactly once', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table__row')).toHaveCount(2)
    const before = calls.user.list

    await page.getByPlaceholder('请输入用户名称').fill('tester')
    await page.getByPlaceholder('请输入用户名称').press('Enter')

    await expect.poll(() => calls.user.listQueries.at(-1)).toContain('username=tester')
    // Settle, then confirm the search fired once and not twice
    await page.waitForTimeout(500)
    expect(calls.user.list).toBe(before + 1)
  })

  // The department filter is set by clicking the tree, so it never appears in
  // the search form. el-form's resetFields() only restores fields carrying a
  // matching prop, which is why the old page had to clear deptId by hand -- and
  // why anything else set the same way stayed applied forever.
  test('reset clears a filter the search form does not own', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table__row')).toHaveCount(2)

    await page.locator('.el-tree-node__label').filter({ hasText: '测试部' }).click()
    await expect.poll(() => calls.user.listQueries.at(-1)).toContain('deptId=')

    // Scoped to the search bar: `name` matches a substring, so an unscoped
    // '重置' also matches 重置密码 in the row overflow menus.
    await page.locator('.pro-table__search').getByRole('button', { name: '重置' }).click()

    await expect.poll(() => calls.user.listQueries.at(-1)).not.toContain('deptId=')
  })

  test('sorting sends the order key the backend reads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table__row')).toHaveCount(2)

    await page.locator('th').filter({ hasText: '登录名' }).locator('.sort-caret.ascending').click()

    await expect.poll(() => calls.user.listQueries.at(-1)).toContain('usernameOrder=asc')
  })

  test('the create dialog opens seeded with the configured initial password', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await page.getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加用户' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入用户密码')).toHaveValue('Init@123')
  })

  test('editing loads the record behind the row', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await page.getByRole('row', { name: /tester/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '修改用户' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('请输入用户名称')).toHaveValue('tester')
    // A field the list rows do not carry, proving the detail call was made
    await expect(dialog.getByPlaceholder('请输入内容')).toHaveValue('来自详情接口')
    // The password field belongs to creation only
    await expect(dialog.getByPlaceholder('请输入用户密码')).toHaveCount(0)
  })

  // What this covers is the user-visible outcome -- one record from one
  // double-click -- which the disabled loading button and the composable's
  // in-flight guard deliver together. The guard on its own is isolated in
  // tests/unit/composables/useForm.spec.ts, and by the Enter-key case below.
  test('a double-clicked confirm button creates one user', async({ page }) => {
    const { calls, delays } = await installApiMocks(page)
    delays.userWrite = 1500

    await page.goto('/#/admin/sys-user')
    await page.getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加用户' })
    await dialog.getByPlaceholder('请输入用户昵称').fill('新同事')
    await dialog.getByPlaceholder('请输入用户名称').fill('newbie')
    await dialog.getByPlaceholder('请输入手机号码').fill('13800000009')
    await dialog.getByPlaceholder('请输入邮箱').fill('newbie@example.com')

    // el-tree-select renders a tree in its dropdown, but each node's label is an
    // li.el-select-dropdown__item rather than the .el-tree-node__label a plain
    // el-tree would emit. Scoped to its own popper: the page has several other
    // selects, and the same department name sits in the tree on the left.
    await dialog.locator('.el-form-item').filter({ hasText: '归属部门' })
      .locator('.el-select__wrapper').click()
    await page.locator('.el-tree-select__popper')
      .locator('.el-select-dropdown__item').filter({ hasText: '测试部' }).click()

    const confirm = dialog.getByRole('button', { name: '确 定' })
    await confirm.click()
    // Second click lands while the first request is still open
    await confirm.click({ force: true })

    await expect.poll(() => calls.user.create, { timeout: 5000 }).toBe(1)
    await expect(dialog).toBeHidden()
    // Still one after everything has settled
    expect(calls.user.create).toBe(1)
  })

  test('a validation failure keeps the dialog open and sends nothing', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await page.getByRole('button', { name: '新增' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '添加用户' })
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect(dialog.locator('.el-form-item__error').first()).toBeVisible()
    await expect(dialog).toBeVisible()
    expect(calls.user.create).toBe(0)
  })

  // bindFormRef is a function ref, and Vue calls a function ref with null when
  // its element unmounts. If el-dialog ever tears its body down on close, the
  // form instance would go missing and a later submit would skip validation
  // with nothing to show for it.
  test('validation still runs after a dialog is closed and reopened', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    // Wait for the list, as every other case here does. Clicking 新增 while the
    // page is still resolving its lookups raced under parallel load.
    await page.waitForSelector('.el-table')
    await page.getByRole('button', { name: '新增' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '添加用户' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '取 消' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('button', { name: '新增' }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect(dialog.locator('.el-form-item__error').first()).toBeVisible()
    await expect(dialog).toBeVisible()
    expect(calls.user.create).toBe(0)
  })

  // The second useForm on the page. Under the old mixin a page had one `form`,
  // one `open` and one `submitForm`, so this had to be an ElMessageBox.prompt
  // that could neither validate a length nor mask the input.
  test('resetting a password is a validated form of its own', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await page.getByRole('row', { name: /tester/ }).locator('.row-icon-action').click()

    const dialog = page.getByRole('dialog').filter({ hasText: '重置密码' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('tester')

    // Too short: rejected before anything reaches the network
    await dialog.getByPlaceholder('请输入新密码').fill('123')
    await dialog.getByRole('button', { name: '确 定' }).click()
    await expect(dialog.locator('.el-form-item__error')).toBeVisible()
    expect(calls.extra.passwordReset).toBe(0)

    await dialog.getByPlaceholder('请输入新密码').fill('Secret@123')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.extra.passwordReset).toBe(1)
    await expect(dialog).toBeHidden()
  })

  // Enter reaches the handler directly, so the disabled loading button cannot
  // stop the second submit -- only useForm's in-flight guard can. This is the
  // path the old ElMessageBox.prompt left wide open.
  test('holding Enter down submits the password once', async({ page }) => {
    const { calls, delays } = await installApiMocks(page)
    delays.passwordReset = 1500

    await page.goto('/#/admin/sys-user')
    await page.getByRole('row', { name: /tester/ }).locator('.row-icon-action').click()

    const dialog = page.getByRole('dialog').filter({ hasText: '重置密码' })
    const input = dialog.getByPlaceholder('请输入新密码')
    await input.fill('Secret@123')

    // page.keyboard rather than locator.press: the latter re-resolves the
    // locator and waits for actionability before each key, which is exactly the
    // pause the guard needs to be tested without.
    await input.click()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    await expect.poll(() => calls.extra.passwordReset, { timeout: 5000 }).toBe(1)
    await expect(dialog).toBeHidden()
    expect(calls.extra.passwordReset).toBe(1)
  })

  test('the two forms keep their own state', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-user')

    await page.getByRole('row', { name: /tester/ }).locator('.row-icon-action').click()
    const passwordDialog = page.getByRole('dialog').filter({ hasText: '重置密码' })
    await passwordDialog.getByPlaceholder('请输入新密码').fill('Secret@123')
    await passwordDialog.getByRole('button', { name: '取 消' }).click()
    await expect(passwordDialog).toBeHidden()

    // Opening the other form must not show anything left behind by the first
    await page.getByRole('button', { name: '新增' }).click()
    const userDialog = page.getByRole('dialog').filter({ hasText: '添加用户' })
    await expect(userDialog.getByPlaceholder('请输入用户名称')).toHaveValue('')
    await expect(userDialog.getByPlaceholder('请输入用户昵称')).toHaveValue('')
  })

  // el-table owns the rendered checkboxes; useTable only holds a copy. Both of
  // these drifted apart before: reserve-selection kept deleted rows in the
  // selection without emitting selection-change, and resetQuery emptied the
  // copy while every box stayed ticked.
  test('the selection is dropped after a bulk delete', async({ page }) => {
    const { calls } = await installApiMocks(page)
    await page.goto('/#/admin/sys-user')
    await page.waitForSelector('.el-table')

    await page.locator('.el-table__header .el-checkbox').click()
    const bulk = page.locator('.pro-table__toolbar').getByRole('button', { name: '删除' })
    await expect(bulk).toBeEnabled()

    await bulk.click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()
    await expect.poll(() => calls.user.remove).toBe(1)

    // Otherwise a second click deletes ids the server no longer has
    await expect(bulk).toBeDisabled()
    await expect(page.locator('.el-table__row .el-checkbox.is-checked')).toHaveCount(0)
  })

  test('reset unticks the checkboxes it disables the buttons for', async({ page }) => {
    await installApiMocks(page)
    await page.goto('/#/admin/sys-user')
    await page.waitForSelector('.el-table')

    await page.locator('.el-table__row .el-checkbox').first().click()
    await expect(page.locator('.el-table__row .el-checkbox.is-checked')).toHaveCount(1)

    await page.locator('.pro-table__search').getByRole('button', { name: '重置' }).click()

    await expect(page.locator('.el-table__row .el-checkbox.is-checked')).toHaveCount(0)
    await expect(page.locator('.pro-table__toolbar')
      .getByRole('button', { name: '删除' })).toBeDisabled()
  })

  test('deleting asks first and does nothing when dismissed', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await page.getByRole('row', { name: /tester/ }).getByRole('button', { name: '删除' }).click()

    const confirm = page.locator('.el-message-box')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: '取消' }).click()

    await expect(confirm).toBeHidden()
    expect(calls.user.remove).toBe(0)
  })

  test('deleting a confirmed row reloads the list', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table__row')).toHaveCount(2)
    const before = calls.user.list

    await page.getByRole('row', { name: /tester/ }).getByRole('button', { name: '删除' }).click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.user.remove).toBe(1)
    await expect.poll(() => calls.user.list).toBeGreaterThan(before)
  })

  // The row with userId 1 is the built-in super admin
  test('the super admin row offers no delete button', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-user')

    const adminRow = page.getByRole('row', { name: /超级管理员/ })
    await expect(adminRow.getByRole('button', { name: '修改' })).toBeVisible()
    await expect(adminRow.getByRole('button', { name: '删除' })).toHaveCount(0)
  })
})
