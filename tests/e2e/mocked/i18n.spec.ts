import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { readWorkbook, values } from './support/workbook'

/**
 * Switching language, and the three places that quietly do not follow.
 *
 * The sidebar is the easy half -- it re-renders from the menu store and any
 * implementation gets it right. What fails silently is everything holding a
 * copy of a title made at a different time: the breadcrumb reads vue-router's
 * own matcher state, the tab strip copies each title when the tab is opened,
 * and useDict hands out options resolved once when the request landed. Each of
 * those keeps working, in the old language, with nothing in the console.
 */
const switchTo = async(page: Page, label: string) => {
  await page.locator('#lang-select').click()
  await page.getByRole('menuitem', { name: label, exact: true }).click()
}

const openList = async(page: Page) => {
  await page.goto('/#/admin/sys-user')
  await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })
  await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => { /* already gone */ })
}

test.describe('switching language', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('translates the sidebar without a reload', async({ page }) => {
    let reloaded = false
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) reloaded = true
    })

    await openList(page)
    const sidebar = page.locator('.sidebar-container')
    // The fixture's title is 'User'; the language pack's is 'User Management'.
    // Two different strings is what makes this assertion mean anything.
    await expect(sidebar).toContainText('User')

    reloaded = false
    await switchTo(page, 'English')

    await expect(sidebar).toContainText('User Management')
    expect(reloaded, 'the page reloaded instead of re-rendering').toBe(false)
  })

  test('translates the breadcrumb, not just the sidebar', async({ page }) => {
    // The breadcrumb reads $route.matched[].meta.title -- router state, not the
    // Pinia menu tree. Anything that translated by rewriting the store would
    // leave this in the old language while the sidebar changed.
    await openList(page)
    const breadcrumb = page.locator('#breadcrumb-container')
    await expect(breadcrumb).toContainText('User')

    await switchTo(page, 'English')
    await expect(breadcrumb).toContainText('User Management')
  })

  test('translates tabs that were already open', async({ page }) => {
    // tagsView copies meta.title into visitedViews when a tab opens. A tab
    // opened before the switch holds a string made in the old language.
    await openList(page)
    const tabs = page.locator('#tags-view-container')
    await expect(tabs).toContainText('User')

    await switchTo(page, 'English')
    await expect(tabs).toContainText('User Management')
  })

  test('translates dictionary labels on a page already on screen', async({ page }) => {
    // sys-post rather than sys-user: this is the page that renders a dictionary
    // label into a column (dictLabel(sys_normal_disable, row.status)), where
    // sys-user only uses its dictionaries inside dropdowns that are not open.
    //
    // useDict caches per type and used to hand out a ref assigned once, when
    // the request landed. These rows are already on screen when the language
    // changes and nothing refetches -- the labels have to be recomputed.
    await page.goto('/#/admin/sys-post')
    const table = page.locator('.el-table').first()
    await expect(table).toBeVisible({ timeout: 15000 })
    await expect(table).toContainText('正常')

    await switchTo(page, 'English')
    await expect(table).toContainText('Normal')
    await expect(table).not.toContainText('正常')
  })

  test('translates a validation message that is already on screen', async({ page }) => {
    // The failure this is here for: a page declares `const rules = { ... }` at
    // setup, which runs once, so every message inside it is frozen in whichever
    // language the page was opened in. Nothing reports it -- validation keeps
    // working, the dialog keeps rejecting, the sentence under the field is just
    // in the wrong language. The five admin pages pass a computed instead, and
    // el-form revalidates when its rules change (validateOnRuleChange), which
    // is what repaints a message already rendered.
    //
    // Asserting on a message triggered *after* the switch would not catch it:
    // el-form-item's error text can also be repainted by remounting, and the
    // dialog reopening is enough to make that path look green.
    await openList(page)
    await page.getByRole('button', { name: '新增' }).click()

    // Located by visibility rather than by its title, which is one of the
    // things about to change.
    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog).toContainText('添加用户')
    await dialog.getByRole('button', { name: '确 定' }).click()

    const errors = dialog.locator('.el-form-item__error')
    await expect(errors.filter({ hasText: '用户名称不能为空' })).toHaveCount(1)

    // Dispatched rather than clicked, and that is the one liberty this test
    // takes: el-dialog puts .el-overlay-dialog over the whole viewport at
    // z-index 2009, so the navbar switcher is genuinely unreachable by mouse
    // while the dialog is open. The event still lands on el-dropdown's own
    // handler, so everything after this line is the real path. A user meets the
    // same frozen rules by switching first and opening the dialog after --
    // which the tail of this test also checks.
    await page.locator('#lang-select').dispatchEvent('click')
    await page.getByRole('menuitem', { name: 'English', exact: true }).click()

    await expect(errors.filter({ hasText: 'Username is required' })).toHaveCount(1)
    await expect(errors.filter({ hasText: '用户名称不能为空' })).toHaveCount(0)

    // And the route a user does take: close, reopen, fail validation again.
    // Reopening does not re-run setup, so a frozen object would still be
    // handing out Chinese here.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Add', exact: true }).click()

    await expect(dialog).toContainText('Add User')
    await dialog.getByRole('button', { name: 'OK' }).click()
    await expect(errors.filter({ hasText: 'Username is required' })).toHaveCount(1)
  })

  test('keeps the language across a reload', async({ page }) => {
    await openList(page)
    await switchTo(page, 'English')
    await expect(page.locator('.sidebar-container')).toContainText('User Management')

    await page.reload()
    await expect(page.locator('.sidebar-container')).toContainText('User Management', { timeout: 15000 })
  })

  test('leaves a menu with no translation showing its own title', async({ page }) => {
    // The single most likely thing to happen in a real deployment: menus the
    // operator created are not in menu.ts and never will be. PRD R2 and A5 say
    // they show their stored title -- not a blank, not 'menu.DemoProduct'.
    await page.goto('/#/demo/product')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })
    await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
      .catch(() => { /* already gone */ })

    await switchTo(page, 'English')

    const sidebar = page.locator('.sidebar-container')
    await expect(sidebar).toContainText('Product')
    await expect(sidebar).not.toContainText('menu.')
  })

  test('translates Element Plus\'s own strings too', async({ page }) => {
    // Element Plus reads its locale from an injected config rather than from
    // vue-i18n. Passing it to app.use() -- which this project did -- fixes it
    // at boot, so the app would switch language around an untouched date picker
    // and pager.
    await openList(page)
    const pager = page.locator('.pagination-container')
    await expect(pager).toContainText('条/页')

    await switchTo(page, 'English')
    await expect(pager).toContainText('/page')
  })

  test('translates what the navbar search can find', async({ page }) => {
    // The one place that cannot translate as it renders: fuse.js indexes plain
    // strings up front, so the titles are copied into the index when it is
    // built. Everything else reads through routeTitle at render time and
    // follows the language for free -- this had to be rebuilt explicitly, and
    // the menu tree it is built from does not change on a switch, so the
    // existing `routes` watcher would never have fired.
    await openList(page)

    const search = page.locator('#header-search')
    const input = search.locator('input')
    // Scoped to the dropdown that is actually open: el-select teleports its
    // popper to <body>, and the page behind has its own selects whose options
    // are in the DOM too.
    const results = page.locator('.el-select-dropdown:visible .el-select-dropdown__item')

    // The icon toggles, so it is clicked once per open -- and switching
    // language closes it, because the switcher click reaches the body listener
    // this component installs while open.
    await search.locator('.search-icon').click()
    await expect(input).toBeVisible()
    // Typed rather than filled: el-select's remote mode runs its query off the
    // input event, and only reveals the dropdown once results arrive.
    await input.pressSequentially('User')
    // The fixture's own title, which is what zh-CN shows: no menu.ts entry is
    // consulted, the stored value comes straight through.
    await expect(results.first()).toHaveText('Admin > User')

    await switchTo(page, 'English')

    await search.locator('.search-icon').click()
    await expect(input).toBeVisible()
    await input.pressSequentially('User')
    // Same query, rebuilt index: now the translated title.
    await expect(results.first()).toHaveText('Admin > User Management')
  })

  test('follows the language in the browser tab', async({ page }) => {
    // Set in a router guard, which only runs on navigation -- so without a
    // watcher the tab keeps the title from whichever language was current when
    // the page was opened. It is the one piece of the interface still visible
    // while the user is working in another tab.
    await openList(page)
    await expect(page).toHaveTitle(/User/)

    await switchTo(page, 'English')
    await expect(page).toHaveTitle(/User Management/)
  })

  test('says so when the language pack cannot be loaded', async({ page }) => {
    // Each language other than the default is a separate chunk, and this
    // project is deployed to intranets and offline networks where a partial
    // deploy is a real possibility. The click used to discard its promise, so a
    // failed load did nothing at all -- no change, no message, just an
    // unhandled rejection in a console nobody has open.
    await openList(page)

    // Fails the request for the English pack, whatever it is named. In dev it
    // is served from src/lang; a build names it en-US.<hash>.js.
    await page.route(/en-US/, route => route.abort())

    await switchTo(page, 'English')

    await expect(page.locator('.el-message--error')).toBeVisible()
    // And the interface is still the language it was, rather than half-switched.
    await expect(page.locator('.sidebar-container')).toContainText('User')
    await expect(page.locator('.sidebar-container')).not.toContainText('User Management')
  })

  /**
   * The whole confirm dialog, not just the sentence the page passes in.
   *
   * useRemove owned four strings: the body, the title, and both buttons. Only
   * the body could be overridden, so a migrated page reached English there
   * while '提示' / '确定' / '取消' stayed written into the composable -- an
   * English question inside a Chinese box, on every list page in the
   * application. sys-config is used because it takes the default body too, so
   * this covers all four at once.
   */
  test('asks to delete in English, box and buttons included', async({ page }) => {
    await page.goto('/#/admin/sys-config')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await switchTo(page, 'English')
    await page.getByRole('row', { name: /应用名称/ }).getByRole('button', { name: 'Delete' }).click()

    const box = page.locator('.el-message-box')
    await expect(box).toBeVisible()
    await expect(box.locator('.el-message-box__title')).toHaveText('Notice')
    await expect(box.locator('.el-message-box__message')).toHaveText('Delete the selected record?')
    await expect(box.getByRole('button', { name: 'OK' })).toBeVisible()
    await expect(box.getByRole('button', { name: 'Cancel' })).toBeVisible()

    // And nothing else in it either -- the four assertions above name the parts
    // that were wrong once, this one catches the next one.
    expect(await box.innerText(), 'Chinese left in the dialog').not.toMatch(/[\u4e00-\u9fa5]/)

    await box.getByRole('button', { name: 'OK' }).click()
    await expect(page.locator('.el-message--success')).toContainText('Deleted successfully')
  })

  test('renames the picker root that no API sends', async({ page }) => {
    // Every branch in the parent picker comes from the department endpoint and
    // is Chinese in either language. The root above them is the one node this
    // repository writes, so it is the one node a switch has to repaint -- and
    // useTreePicker read it once, when the page was set up, which pinned it to
    // whichever language that was.
    //
    // The tree behind it is fetched once and cached, and reopening the dialog
    // does not re-run setup, so nothing here refetches or rebuilds: the label
    // has to follow on its own.
    await page.goto('/#/admin/sys-dept')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    const dialog = page.locator('.el-dialog:visible')
    const root = () => dialog.locator('.el-form-item').first().locator('.el-select__wrapper')

    await page.getByRole('button', { name: '新增', exact: true }).first().click()
    await expect(dialog).toContainText('添加部门')
    await expect(root()).toHaveText('主类目')

    await dialog.getByRole('button', { name: '取 消' }).click()
    await expect(dialog).toHaveCount(0)

    await switchTo(page, 'English')
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()

    await expect(dialog).toContainText('Add Department')
    await expect(root()).toHaveText('Root')
  })

  test('retitles a dialog that is already open', async({ page }) => {
    // The title moved back into useForm's `title` option in this batch. The
    // option is read on every render, so a page that passes a computed follows
    // the switch -- a page that passes a plain t(...) would sit here in the old
    // language with the rest of the dialog in the new one.
    await openList(page)
    await page.getByRole('button', { name: '新增', exact: true }).click()

    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog.locator('.el-dialog__title')).toHaveText('添加用户')

    await page.locator('#lang-select').dispatchEvent('click')
    await page.getByRole('menuitem', { name: 'English', exact: true }).click()

    await expect(dialog.locator('.el-dialog__title')).toHaveText('Add User')
  })

  /**
   * The same freeze as the sys-user test above, on the batch that followed.
   *
   * Five of the seven pages in it declared `const rules: FormRules = { ... }`
   * at setup, which runs once -- so a message built from t() there keeps the
   * language the page was opened in, and nothing reports it: validation goes on
   * working, the dialog goes on rejecting, the sentence under the field is just
   * in the wrong language. Asserting on a message triggered *after* the switch
   * would not catch it, because reopening the dialog remounts el-form-item and
   * repaints the error either way.
   */
  test('translates a validation message already on screen, on a page that is not sys-user', async({ page }) => {
    await page.goto('/#/admin/sys-post')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '新增' }).click()

    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog).toContainText('添加岗位')
    await dialog.getByRole('button', { name: '确 定' }).click()

    const errors = dialog.locator('.el-form-item__error')
    await expect(errors.filter({ hasText: '岗位名称不能为空' })).toHaveCount(1)

    // Dispatched rather than clicked: the dialog's overlay covers the navbar,
    // so the switcher is genuinely unreachable by mouse while it is open. The
    // event still lands on el-dropdown's own handler.
    await page.locator('#lang-select').dispatchEvent('click')
    await page.getByRole('menuitem', { name: 'English', exact: true }).click()

    await expect(errors.filter({ hasText: 'Position name is required' })).toHaveCount(1)
    await expect(errors.filter({ hasText: '岗位名称不能为空' })).toHaveCount(0)
    // The title is read on every render, so it has to follow the same switch.
    await expect(dialog.locator('.el-dialog__title')).toHaveText('Add Position')
  })

  /**
   * The settings page, which reaches el-form directly rather than through
   * useForm -- so nothing unwraps a ref for it and the computed has to be bound
   * straight to `:rules`. It is also the one page in the batch with no dialog:
   * the message sits on the page itself, where a reader can stare at it for as
   * long as they like before switching.
   */
  test('translates a validation message on the settings form, which has no useForm', async({ page }) => {
    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await page.getByPlaceholder('请输入系统名称').fill('')
    await page.getByRole('button', { name: '保存设置' }).click()

    const error = page.locator('.el-form-item__error')
    await expect(error).toHaveText('请输入系统名称')

    await switchTo(page, 'English')

    await expect(error).toHaveText('Please enter system name')
  })

  /**
   * The one confirm box in the batch that useRemove does not own.
   *
   * Emptying the log asks separately, through an ElMessageBox the page builds
   * itself -- four strings that the composables' translation never touched, so
   * they had to be read at click time here for the same reason useRemove reads
   * its own inside the call.
   */
  test('empties the operation log in English, box and buttons included', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-oper-log')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await switchTo(page, 'English')
    await page.locator('.pro-table__toolbar').getByRole('button', { name: 'Clear' }).click()

    const box = page.locator('.el-message-box')
    await expect(box).toBeVisible()
    await expect(box.locator('.el-message-box__title')).toHaveText('Notice')
    await expect(box.locator('.el-message-box__message'))
      .toHaveText('Clear every operation log? This cannot be undone.')
    await expect(box.getByRole('button', { name: 'OK' })).toBeVisible()
    await expect(box.getByRole('button', { name: 'Cancel' })).toBeVisible()
    // The four assertions above name the parts that were Chinese; this one
    // catches whichever part is next.
    expect(await box.innerText(), 'Chinese left in the dialog').not.toMatch(/[一-龥]/)

    await box.getByRole('button', { name: 'OK' }).click()
    await expect.poll(() => calls.extra.operLogClean).toBe(1)
    await expect(page.locator('.el-message--success')).toContainText('Cleared')
  })

  /**
   * The exported sheet, which is written rather than rendered.
   *
   * Its headings and its file name are the one piece of copy that leaves the
   * browser, and they were built into a module-level array. Anything resolved
   * once at setup would write Chinese headings into a workbook an English
   * reader asked for -- and no assertion on the screen would notice, because
   * the screen is correct.
   */
  test('writes the exported sheet in the language the reader asked in', async({ page }) => {
    await page.goto('/#/admin/sys-post')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })

    await switchTo(page, 'English')
    await page.locator('.pro-table__toolbar').getByRole('button', { name: 'Export' }).click()

    // Located by role rather than by name: useExport still writes its own
    // confirm in Chinese, which is not this test's subject.
    const confirm = page.locator('.el-message-box')
    await expect(confirm).toBeVisible()
    const downloaded = page.waitForEvent('download')
    await confirm.locator('.el-message-box__btns .el-button--primary').click()

    const download = await downloaded
    expect(download.suggestedFilename()).toBe('Position Management.xlsx')

    const workbook = await readWorkbook(download)
    const [header] = values(workbook)
    expect(header).toEqual(['Position ID', 'Position Code', 'Position Name', 'Order', 'Created At'])
  })

  test('asks to export in English, box and buttons included', async({ page }) => {
    // useExport was missed when the other composables were translated, so this
    // dialog stayed Chinese on an English page in exactly the way useRemove's
    // did: an English page, a Chinese question, Chinese buttons.
    await page.goto('/#/admin/sys-post')
    await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })
    await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
      .catch(() => { /* already gone */ })

    await switchTo(page, 'English')
    await page.getByRole('button', { name: 'Export' }).click()

    const box = page.locator('.el-message-box')
    await expect(box).toBeVisible()
    await expect(box.locator('.el-message-box__title')).toHaveText('Notice')
    await expect(box.locator('.el-message-box__message')).toHaveText('Export the current page of the list?')
    await expect(box.getByRole('button', { name: 'OK' })).toBeVisible()
    await expect(box.getByRole('button', { name: 'Cancel' })).toBeVisible()
    // Nothing Chinese left anywhere in the dialog, not just in the parts named
    // above -- the failure this replaces was a mix, not a single string.
    expect(await box.innerText(), 'Chinese left in the dialog').not.toMatch(/[\u4e00-\u9fff]/)
  })

  /**
   * Toasts the server used to overrule.
   *
   * Every one of these call sites read `msgSuccess(response.msg || t('...'))`,
   * which put the backend in charge of the wording and left the translation as
   * a fallback that never ran -- these endpoints all answer with a message. It
   * was wrong in both directions at once, and the fixtures hid it by answering
   * with the same strings the language pack holds. They now answer what the
   * real handlers answer.
   */
  test('reports a generated file in the reader\'s language, not the server\'s', async({ page }) => {
    // The direction that needs no language switch at all: this endpoint replies
    // in English (app/other/apis/tools/gen.go), so a Chinese user reading a
    // Chinese interface was shown an English sentence.
    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    const row = page.getByRole('row', { name: /sys_demo/ })
    await row.locator('.el-dropdown button').click()
    await page.locator('.el-dropdown-menu:visible').getByText('生成配置').click()

    const toast = page.locator('.el-message--success')
    await expect(toast).toContainText('已生成')
    await expect(toast).not.toContainText('Code generated successfully')
  })

  test('reports a saved setting in the reader\'s language, not the server\'s', async({ page }) => {
    // And the other direction: this endpoint answers 更新成功 whoever is asking,
    // so an English reader got a Chinese toast. Note it is not even the word
    // the button promises -- the button says Save, the server says updated.
    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await switchTo(page, 'English')
    await page.getByRole('button', { name: 'Save Settings' }).click()

    const toast = page.locator('.el-message--success')
    await expect(toast).toContainText('Saved successfully')
    expect(await toast.innerText(), 'the server\'s Chinese reached the toast').not.toMatch(/[一-龥]/)
  })

  /**
   * The import dialog, which no batch had touched at all.
   *
   * It was found by scanning for rendered Chinese rather than from the debt
   * list: thirteen literals and no useI18n, sitting behind a toolbar button on
   * an already-migrated page. Its own file rather than keys under gen.ts,
   * because the two pages disagree on what tableComment means.
   */
  test('translates the import dialog, which is opened from a migrated page', async({ page }) => {
    await page.goto('/#/dev-tools/gen')
    await page.waitForSelector('.el-table')

    await switchTo(page, 'English')
    await page.locator('.pro-table__toolbar').getByRole('button', { name: 'Import' }).click()

    const dialog = page.getByRole('dialog').filter({ hasText: 'Import Tables' })
    await expect(dialog).toBeVisible()

    // The count line is pluralised, which is the one string here Chinese does
    // not need: 张表 covers any number.
    await dialog.getByRole('cell', { name: 'sys_order' }).click()
    await expect(dialog).toContainText('1 table selected')

    // Nothing left behind -- title, search labels, column headers, buttons. The
    // rows are deliberately excluded: 订单 is the comment MySQL holds on
    // sys_order, and data out of the database stays in the language it was
    // written in. That is the same line lang/backend.ts draws.
    const chrome = [
      await dialog.locator('.el-dialog__header').innerText(),
      await dialog.locator('form').first().innerText(),
      await dialog.locator('.el-table__header-wrapper').innerText(),
      await dialog.locator('.el-dialog__footer').innerText()
    ].join('\n')
    expect(chrome, 'Chinese left in the import dialog').not.toMatch(/[一-龥]/)

    await dialog.getByRole('button', { name: 'OK' }).click()
    await expect(page.locator('.el-message--success')).toContainText('Imported successfully')
  })

  test('switches back', async({ page }) => {
    // Going one way can pass on a stale-but-correct-looking first render.
    await openList(page)
    await switchTo(page, 'English')
    await expect(page.locator('.sidebar-container')).toContainText('User Management')

    await switchTo(page, '简体中文')
    await expect(page.locator('#tags-view-container')).toContainText('User')
    await expect(page.locator('#breadcrumb-container')).not.toContainText('User Management')
  })
})

/**
 * Which language a visitor lands in before they have chosen one.
 *
 * playwright.config.ts pins the suite to zh-CN, because every other spec
 * describes the Chinese interface. These override it -- this is the only place
 * the detection itself is exercised, and it is not a detail: with the config
 * unpinned, Playwright's default en-US made the dictionary assertion in
 * sys-post.spec.ts fail, which is exactly what a real user with an
 * English-language browser would have seen after upgrading.
 */
test.describe('the login page', () => {
  // No authenticate() here: this is the one screen a visitor reaches before
  // having an account, and it is the single most visited page in the analytics.
  test.beforeEach(async({ page }) => { await installApiMocks(page) })

  test('can be switched before signing in', async({ page }) => {
    // The navbar switcher lives inside the layout, which this page is not part
    // of. Without one here, someone who cannot read Chinese is stopped at the
    // first screen -- there is nothing to click past.
    await page.goto('/#/login')
    await expect(page.locator('.panel-sub')).toHaveText('使用管理员账号登录控制台')

    await switchTo(page, 'English')
    await expect(page.locator('.panel-sub')).toHaveText('Log in to the console with an administrator account')
  })

  test('keeps the switcher reachable on a phone', async({ page }) => {
    // The hero is hidden below 768px and its footer below 860px, so a switcher
    // placed in either would vanish on exactly the screens with no other way
    // out. Asserted against the viewport rather than by eye.
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/#/login')

    const box = (await page.locator('#lang-select').boundingBox())!
    expect(box, 'switcher is not rendered at phone width').toBeTruthy()
    expect(box.x + box.width, 'switcher runs off the right edge').toBeLessThanOrEqual(375)
    expect(box.y, 'switcher sits above the viewport').toBeGreaterThanOrEqual(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }})

  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test('the switcher is still reachable', async({ page }) => {
    // The navbar hides search, fullscreen and settings below 768px. The
    // switcher deliberately sits outside that block: someone whose interface is
    // in a language they cannot read has no other way out, and hiding it on a
    // phone would strand them on the device where it is hardest to recover.
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.pro-card').first()).toBeVisible({ timeout: 15000 })
    await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
      .catch(() => { /* already gone */ })

    await expect(page.locator('#header-search')).toHaveCount(0)
    await expect(page.locator('#lang-select')).toBeVisible()
  })
})

test.describe('a visitor who has not picked a language', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
  })

  test.describe('with an English browser', () => {
    test.use({ locale: 'en-GB' })

    test('lands in English without touching the switcher', async({ page }) => {
      // en-GB, not en-US: the match is on the language subtag, so every English
      // region has to reach the one English pack we ship.
      await openList(page)
      await expect(page.locator('.sidebar-container')).toContainText('User Management')
    })
  })

  test.describe('with a browser language we do not ship', () => {
    test.use({ locale: 'ja-JP' })

    test('falls back to Chinese rather than to a blank interface', async({ page }) => {
      await openList(page)
      const sidebar = page.locator('.sidebar-container')
      await expect(sidebar).toContainText('User')
      await expect(sidebar).not.toContainText('User Management')
    })
  })
})
