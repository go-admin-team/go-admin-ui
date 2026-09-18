import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * A directory nested inside another directory: Layout > container > leaf.
 *
 * The shared menuTree in fixtures.ts is one level deep -- every page hangs
 * straight off the Layout -- so nothing else here renders two stacked
 * RouterViewKeepAlive components. The seeded backend menu does: 日志管理 (Log)
 * is a directory under 系统管理 holding sys-login-log and sys-oper-log, and its
 * leaves carry absolute paths while their parent's is /log. That shape is the
 * one that broke, so it is spelled out here rather than folded into the shared
 * tree, which half the suite counts sidebar entries against.
 */
const nestedMenu = {
  code: 200,
  data: [
    {
      path: '/admin',
      component: 'Layout',
      visible: '0',
      menuName: 'Admin',
      title: '系统管理',
      icon: 'api-server',
      noCache: false,
      children: [
        {
          path: '/admin/sys-user',
          component: '/admin/sys-user/index',
          visible: '0',
          menuName: 'SysUserManage',
          title: '用户管理',
          icon: 'user',
          noCache: false,
          children: null
        },
        {
          path: '/log',
          component: '/log/index',
          visible: '0',
          menuName: 'Log',
          title: '日志管理',
          icon: 'log',
          noCache: false,
          children: [
            {
              path: '/admin/sys-login-log',
              component: '/admin/sys-login-log/index',
              visible: '0',
              menuName: 'SysLoginLogManage',
              title: '登录日志',
              icon: 'logininfor',
              noCache: false,
              children: null
            },
            {
              path: '/admin/sys-oper-log',
              component: '/admin/sys-oper-log/index',
              visible: '0',
              menuName: 'OperLog',
              title: '操作日志',
              icon: 'skill',
              noCache: false,
              children: null
            }
          ]
        }
      ]
    }
  ]
}

/** Registered after installApiMocks, which is what makes it win: Playwright matches routes in reverse. */
const serveNestedMenu = (page: import('@playwright/test').Page) =>
  page.route('**/api/v1/menurole*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(nestedMenu)
  }))

/** The two log pages have no column label in common, so the header names which one is on screen. */
const columnHeaders = (page: import('@playwright/test').Page) =>
  page.locator('.app-main .el-table th .cell')

test.describe('a menu nested two levels deep', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  /**
   * Both leaves share one container, so the container's key must not follow the
   * leaf's path. When it did, this navigation never completed: the url, the
   * sidebar and the breadcrumb moved on while the content area kept rendering
   * the page the user had just left, with nothing logged anywhere.
   */
  test('switching between two leaves of the same container swaps the page', async({ page }) => {
    const { calls } = await installApiMocks(page)
    await serveNestedMenu(page)

    await page.goto('/#/admin/sys-oper-log')
    await expect(columnHeaders(page)).toContainText(['操作人员'])

    await page.goto('/#/admin/sys-login-log')
    await expect(columnHeaders(page)).toContainText(['ip 地址'])
    await expect.poll(() => calls.loginLog.list).toBe(1)

    await page.goto('/#/admin/sys-oper-log')
    await expect(columnHeaders(page)).toContainText(['操作人员'])
  })

  /**
   * The container staying put is the whole reason this layer wraps its children
   * in keep-alive: tear it down on every sibling switch and the leaf it cached
   * goes with it. A second list request for a page that was already loaded is
   * how that regression would show up.
   */
  test('the container keeps its children cached across the switch', async({ page }) => {
    const { calls } = await installApiMocks(page)
    await serveNestedMenu(page)

    await page.goto('/#/admin/sys-oper-log')
    await expect(columnHeaders(page)).toContainText(['操作人员'])
    expect(calls.operLog.list).toBe(1)

    await page.goto('/#/admin/sys-login-log')
    await expect(columnHeaders(page)).toContainText(['ip 地址'])

    await page.goto('/#/admin/sys-oper-log')
    await expect(columnHeaders(page)).toContainText(['操作人员'])
    expect(calls.operLog.list).toBe(1)
  })

  /** Entering the section from outside it was never broken; it is here so a fix that trades one for the other is caught. */
  test('reaching a nested leaf from a page outside the container', async({ page }) => {
    const { calls } = await installApiMocks(page)
    await serveNestedMenu(page)

    await page.goto('/#/admin/sys-user')
    await expect(columnHeaders(page)).toContainText(['登录名'])

    await page.goto('/#/admin/sys-login-log')
    await expect(columnHeaders(page)).toContainText(['ip 地址'])
    await expect.poll(() => calls.loginLog.list).toBe(1)
  })
})
