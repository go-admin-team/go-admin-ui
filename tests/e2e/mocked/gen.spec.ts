import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The code generator's table list. Six row actions and a preview dialog that
 * never opened, which is the shape this page was in.
 */
test.describe('dev-tools gen', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists the configured tables', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(2)
    await expect(page.getByRole('cell', { name: 'sys_demo' })).toBeVisible()
  })

  // The dialog bound v-model to `open`, which no data property declared: Vue
  // warned on every render and the dialog never entered the DOM, so 预览 fetched
  // every template and displayed none of them.
  test('the preview dialog opens and shows the templates', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /sys_demo/ }).getByRole('button', { name: '预览' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '代码预览' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('api.go', { exact: true })).toBeVisible()
    await expect(dialog.getByText('model.go', { exact: true })).toBeVisible()
    await expect(dialog).toContainText('func (e SysDemo) GetPage()')
  })

  test('switching template tabs changes the code shown', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    await page.getByRole('row', { name: /sys_demo/ }).getByRole('button', { name: '预览' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '代码预览' })
    await dialog.getByText('model.go', { exact: true }).click()

    await expect(dialog).toContainText('type SysDemo struct')
  })

  // Two buttons and a menu, not six buttons in a pinned column
  test('the row keeps two buttons and puts the rest behind a menu', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await expect(row.locator('.pro-table__actions button')).toHaveCount(3)

    await row.locator('.el-dropdown button').click()
    const menu = page.locator('.el-dropdown-menu:visible')
    await expect(menu).toContainText('生成到项目')
    await expect(menu).toContainText('生成配置')
    await expect(menu).toContainText('生成迁移脚本')
    await expect(menu).toContainText('删除')
  })

  // The row's delete used to fire immediately, with no confirmation at all,
  // while the toolbar's asked first
  test('deleting from the row menu asks first', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await row.locator('.el-dropdown button').click()
    await page.locator('.el-dropdown-menu:visible').getByText('删除').click()

    const confirm = page.locator('.el-message-box')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: '取消' }).click()
    expect(calls.extra.tableDeletes).toBe(0)

    await row.locator('.el-dropdown button').click()
    await page.locator('.el-dropdown-menu:visible').getByText('删除').click()
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.extra.tableDeletes).toBe(1)
    expect(calls.extra.tableDeleteUrl).toContain('/sys/tables/info/1')
  })

  test('generating runs once per click', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await row.locator('.el-dropdown button').click()
    await page.locator('.el-dropdown-menu:visible').getByText('生成配置').click()

    await expect.poll(() => calls.extra.generated).toEqual(['todb'])
  })
})

test.describe('dev-tools import', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('the import dialog lists the database tables', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '导入' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: '导入表' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('cell', { name: 'sys_order' })).toBeVisible()
    // createTime, not createdAt: DBTables comes out of INFORMATION_SCHEMA
    await expect(dialog.getByRole('cell', { name: '2026-07-01 10:00:00' })).toBeVisible()
  })

  test('confirming imports the checked tables and reloads the list', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    const before = calls.extra.genTableList

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '导入' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '导入表' })

    // Clicking the row ticks it, which is how this dialog has always behaved
    await dialog.getByRole('cell', { name: 'sys_order' }).click()
    await expect(dialog).toContainText('已选 1 张表')

    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.extra.tableImports).toBe(1)
    expect(JSON.parse(calls.extra.tableImportBody || '{}').tables).toBe('sys_order')
    await expect.poll(() => calls.extra.genTableList).toBeGreaterThan(before)
  })

  test('confirm is disabled until something is checked', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '导入' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '导入表' })

    await expect(dialog.getByRole('button', { name: '确 定' })).toBeDisabled()
  })
})

/**
 * The edit page. Its 字段信息 table had no header at all: two columns used
 * :render-header with Vue 2 render functions, those threw, and one throwing
 * header renderer takes the whole header row down with it.
 */
test.describe('dev-tools editTable', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('the column table has its headers', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    const headers = page.locator('.el-table th')
    await expect(headers.first()).toBeVisible()

    const text = await page.locator('.el-table__header').innerText()
    for (const label of ['字段描述', 'go类型', 'json属性', '列表', '查询', '必填', '显示类型']) {
      expect(text).toContain(label)
    }
  })

  test('the two explained headers carry their explanation', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    // Two headers carry an explanation; the rest are plain labels
    const hints = page.locator('.el-table__header .field-label__hint')
    await expect(hints).toHaveCount(2)

    await hints.first().hover()
    await expect(page.locator('.el-popper:visible')).toContainText('是否在列表中展示')
  })

  test('the columns load into editable rows', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__body .el-table__row')).toHaveCount(2)
    await expect(page.locator('.el-table__body input[type="text"]').first()).toHaveValue('名称')
  })

  // true-value, not the deprecated true-label
  test('the flag checkboxes reflect the record', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    const rows = page.locator('.el-table__body .el-table__row')
    // name: isList 1, status: isList 0
    await expect(rows.nth(0).locator('.el-checkbox').nth(1)).toHaveClass(/is-checked/)
    await expect(rows.nth(1).locator('.el-checkbox').nth(1)).not.toHaveClass(/is-checked/)
  })

  test('the basic tab is filled from the record', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    await page.getByRole('tab', { name: '基本信息' }).click()
    await expect(page.getByPlaceholder('请输入表名称')).toHaveValue('sys_demo')
    await expect(page.getByPlaceholder('请输入作者名称')).toHaveValue('wenjian')
  })

  // The tabs held a copy of the record and emitted update:info, which the page
  // never listened for; it read the values back out of el-form's model prop.
  test('an edit in the basic tab reaches the saved payload', async({ page }) => {
    await installApiMocks(page)
    const bodies = await captureBodies(page, '**/api/v1/sys/tables/info', 'PUT')

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    await page.getByRole('tab', { name: '基本信息' }).click()
    await page.getByPlaceholder('请输入菜单名称').fill('演示菜单')
    await page.getByRole('button', { name: '提交' }).click()

    await expect.poll(() => bodies.length).toBe(1)
    const sent = JSON.parse(bodies[0] || '{}')
    expect(sent.tableComment).toBe('演示菜单')
    expect(sent.columns).toHaveLength(2)
    // Strings in the radio groups, booleans on the wire
    expect(typeof sent.isAuth).toBe('boolean')
  })
})
