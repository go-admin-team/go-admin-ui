import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The suite runs in Chinese (playwright.config.ts pins the locale), so anything
 * English has to switch first. Clicked rather than dispatched: none of the
 * pages below has a modal open over the navbar.
 */
const switchTo = async(page: Page, label: string) => {
  await page.locator('#lang-select').click()
  await page.getByRole('menuitem', { name: label, exact: true }).click()
}

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
    for (const label of ['字段描述', 'go类型', 'json属性', '表单', '列表', '查询', '必填', '显示类型']) {
      expect(text).toContain(label)
    }
  })

  test('the explained headers carry their explanation', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    // Three headers carry an explanation; the rest are plain labels. 表单 joined
    // them when it was renamed: it is the column most easily misread, so it is
    // the one that most needed saying what it does.
    const hints = page.locator('.el-table__header .field-label__hint')
    await expect(hints).toHaveCount(3)

    // In column order -- 表单, 列表, 查询.
    for (const [index, expected] of [
      [0, '是否出现在新增/修改表单中'],
      [1, '是否在列表中展示'],
      [2, '是否作为搜索条件']
    ] as Array<[number, string]>) {
      await hints.nth(index).hover()
      // Located by its own text rather than by :visible -- hovering the next
      // hint while the previous tooltip is still fading out leaves two of them
      // on screen, and a bare :visible matches both.
      await expect(page.locator('.el-popper').filter({ hasText: expected })).toBeVisible()
    }
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

  test('a column with no relation table offers no key to pick', async({ page }) => {
    // The fallback used to be a synthetic `{ columnId: 0, columnName: '请选择' }`
    // row, and the two pickers below it bind :value="column.jsonField" -- which
    // that row does not carry. So each rendered one option whose value was
    // undefined: blank, because the option's own slot prints jsonField too, and
    // selectable, which would have written undefined onto the record. Element
    // Plus reported it, on every render, as `Invalid prop: type check failed for
    // prop "value"`.
    //
    // el-select has a placeholder of its own, so nothing was gained by it.
    await installApiMocks(page)

    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')

    const cell = page.locator('.el-table__body .el-table__row').first().locator('td').nth(15)
    await expect(cell.locator('.el-select__placeholder')).toHaveText('请选择')
    await cell.locator('.el-select').click()

    const dropdown = page.locator('.el-select-dropdown:visible')
    await expect(dropdown).toBeVisible()
    await expect(dropdown.locator('.el-select-dropdown__item')).toHaveCount(0)
  })
})

/**
 * The same three screens in English.
 *
 * The generator is the least-visited page in the application and the one with
 * the most developer jargon, so these assert the words themselves rather than
 * just "something changed": a translation that silently falls back to the key
 * still changes the text.
 */
test.describe('dev-tools gen in English', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('the list translates in place, without a reload', async({ page }) => {
    let reloaded = false
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) reloaded = true
    })

    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    await expect(page.locator('.el-table__header')).toContainText('模型名称')

    reloaded = false
    await switchTo(page, 'English')

    const header = page.locator('.el-table__header')
    for (const label of ['ID', 'Table Name', 'Menu Name', 'Model Name', 'Created At']) {
      await expect(header).toContainText(label)
    }
    await expect(page.locator('.el-table__header')).not.toContainText('模型名称')

    const toolbar = page.locator('.pro-table__toolbar')
    await expect(toolbar.getByRole('button', { name: 'Import' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: 'Delete' })).toBeVisible()

    expect(reloaded, 'the page reloaded instead of re-rendering').toBe(false)
  })

  test('the row actions and the overflow menu translate', async({ page }) => {
    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    await switchTo(page, 'English')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'Preview' })).toBeVisible()

    await row.locator('.el-dropdown button').click()
    // The language switcher is an el-dropdown too, and its popper is still on
    // screen a moment after the switch -- so the row's menu is the one that is
    // not offering languages.
    const menu = page.locator('.el-dropdown-menu:visible').filter({ hasNotText: '简体中文' })
    await expect(menu).toContainText('Generate into Project')
    await expect(menu).toContainText('Generate Configuration')
    await expect(menu).toContainText('Generate Migration Script')
    await expect(menu).toContainText('Delete')
    expect(await menu.innerText(), 'Chinese left in the menu').not.toMatch(/[一-龥]/)
  })

  test('deleting one table asks in English, in the singular', async({ page }) => {
    // The Chinese sentence has one form. English has two, and the count decides
    // -- a page that passed a plain string here would read "the 1 selected
    // tables". The row menu deletes exactly one, which is the form the
    // composable's own default never exercises.
    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    await switchTo(page, 'English')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await row.locator('.el-dropdown button').click()
    await page.locator('.el-dropdown-menu:visible').getByText('Delete').click()

    const box = page.locator('.el-message-box')
    await expect(box.locator('.el-message-box__message'))
      .toHaveText('Delete the generator configuration for the selected table?')
    expect(await box.innerText(), 'Chinese left in the dialog').not.toMatch(/[一-龥]/)
  })

  test('the preview dialog is titled in English', async({ page }) => {
    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')
    await switchTo(page, 'English')

    await page.getByRole('row', { name: /sys_demo/ }).getByRole('button', { name: 'Preview' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.el-dialog__title')).toHaveText('Code Preview')
  })
})

/**
 * The editor, whose 字段信息 tab is the densest cluster of developer jargon in
 * the application -- go类型, json属性, 查询方式. Its two tabs are separate
 * components with a rule set each, and both had those rules as a module-level
 * constant: evaluated once, at setup, which this page never re-runs because it
 * is kept alive.
 */
test.describe('dev-tools editTable in English', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.goto('/#/dev-tools/editTable?tableId=1')
    await page.waitForSelector('.el-table')
  })

  test('the tabs, the column headers and the footer translate', async({ page }) => {
    await switchTo(page, 'English')

    // Scoped to the page's own card: the tab strip above it is an el-tabs too
    const tabs = page.locator('.el-card .el-tabs__nav')
    await expect(tabs).toContainText('Basic Information')
    await expect(tabs).toContainText('Field Information')
    await expect(tabs).toContainText('Generation Information')

    const header = page.locator('.el-table__header')
    for (const label of [
      'No.', 'Column Name', 'Description', 'DB Type', 'Go Type', 'Go Field', 'JSON Field',
      'Form', 'List', 'Query', 'Query Type', 'Required', 'Display Type', 'Dictionary Type',
      'Relation Table', 'Relation Key', 'Relation Value'
    ]) {
      await expect(header).toContainText(label)
    }
    expect(await header.innerText(), 'Chinese left in the headers').not.toMatch(/[一-龥]/)

    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

    // The alert above the table, and the headers that carry an explanation
    await expect(page.locator('.el-alert__title')).toContainText('are hidden from this list')
    // first() is now the Form column, which gained its hint when it was renamed
    // from Edit -- the label that read as "may be edited", the one flag the
    // checkbox does not control.
    await page.locator('.el-table__header .field-label__hint').first().hover()
    // role=tooltip, not .el-popper: the switcher's own popper is still fading
    // out and is an .el-popper too
    await expect(page.locator('[role="tooltip"]:visible'))
      .toContainText('Whether the column appears in the add/edit form')
  })

  test('a validation message already on screen follows the language', async({ page }) => {
    // The failure this exists for: `const rules = { ... }` at module scope is
    // evaluated once, so a message rendered under a field keeps the language it
    // was built in. Nothing reports it -- validation still works, the form still
    // refuses to submit, the sentence is just in the wrong language. Asserting
    // on a message triggered *after* the switch would not catch it, because
    // re-triggering repaints the text either way.
    await page.getByRole('tab', { name: '基本信息' }).click()

    const author = page.getByPlaceholder('请输入作者名称')
    await author.fill('')
    await author.blur()

    const errors = page.locator('.el-form-item__error')
    await expect(errors.filter({ hasText: '请输入作者' })).toHaveCount(1)

    await switchTo(page, 'English')

    await expect(errors.filter({ hasText: 'Please enter author' })).toHaveCount(1)
    await expect(errors.filter({ hasText: '请输入作者' })).toHaveCount(0)
  })

  test('the generation tab\'s validation message follows the language too', async({ page }) => {
    // A second rule set in a second component. Covered separately because
    // fixing one file and not the other leaves half a form in the old language
    // -- and both tabs are visible one click apart.
    await page.getByRole('tab', { name: '生成信息' }).click()

    const business = page.locator('.el-form-item').filter({ hasText: '业务名' }).locator('input')
    await business.fill('')
    await business.blur()

    const errors = page.locator('.el-form-item__error')
    await expect(errors.filter({ hasText: '请输入生成业务名' })).toHaveCount(1)

    await switchTo(page, 'English')

    await expect(errors.filter({ hasText: 'Please enter the business name' })).toHaveCount(1)
    await expect(errors.filter({ hasText: '请输入生成业务名' })).toHaveCount(0)
  })

  test('the dictionary picker offers the seeded types by their English name', async({ page }) => {
    // These names arrive from the database, so they are Chinese in either
    // language -- but the seeded ones have a translation keyed by dict_type,
    // and lang/backend.ts already knows how to find it. Without that lookup the
    // one dropdown on this page that lists backend data stays Chinese while
    // every label around it is English. A dictionary the operator created has
    // no entry and keeps its stored name; that is the designed fallback, and it
    // is also what keeps the Chinese interface byte-for-byte unchanged.
    await switchTo(page, 'English')

    // Column 13 is 字典类型; 15 is the relation key the test above uses
    const cell = page.locator('.el-table__body .el-table__row').first().locator('td').nth(13)
    await cell.locator('.el-select').click()

    const dropdown = page.locator('.el-select-dropdown:visible')
    await expect(dropdown).toContainText('System Status')
    await expect(dropdown).not.toContainText('系统状态')
    // The dict_type itself is an identifier and stays as it is
    await expect(dropdown).toContainText('sys_common_status')
  })

  test('saving reports success in English', async({ page }) => {
    // The endpoint answers without a `msg`, so this is the client's own string.
    // Where the backend does send one it wins, in whatever language it was
    // written -- see the note in the batch report.
    await switchTo(page, 'English')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.locator('.el-message--success')).toContainText('Saved successfully')
  })
})
