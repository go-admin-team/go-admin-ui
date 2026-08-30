import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

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
