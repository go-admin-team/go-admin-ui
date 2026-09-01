import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { authenticate, installApiMocks, menuTree } from './fixtures'

/**
 * Menus that point into src/apps/ -- the two outcomes a packaged app has.
 *
 * Both run against the standard mock set with one route re-registered on top:
 * Playwright matches routes in reverse registration order, so the menu served
 * here wins over the one installApiMocks set up.
 */

/** The two cases, hung off the fixture menu rather than replacing it. */
const menuWithApps = {
  ...menuTree,
  data: [
    ...menuTree.data,
    {
      path: '/probe',
      component: 'Layout',
      visible: '0',
      menuName: 'ProbeRoot',
      title: 'Probe',
      icon: 'star',
      noCache: false,
      children: [
        {
          // Resolves: src/apps/_test-fixture/probe/index.vue is committed, and
          // its own header says why.
          path: 'installed',
          component: '/apps/_test-fixture/probe/index',
          visible: '0',
          menuName: 'ProbeInstalled',
          title: 'Probe Installed',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          // Does not resolve, and never will -- no app of this name is synced
          // in. This is a backend installed without its frontend half, or a
          // menu row that outlived an uninstall.
          path: 'ghost',
          component: '/apps/ghost/x/index',
          visible: '0',
          menuName: 'ProbeGhost',
          title: 'Probe Ghost',
          icon: 'star',
          noCache: false,
          children: null
        }
      ]
    }
  ]
}

const serveMenuWithApps = (page: Page) =>
  page.route('**/api/v1/menurole*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(menuWithApps)
  }))

test('a menu pointing into apps/ opens the app page', async({ page, context }) => {
  await authenticate(context)
  await installApiMocks(page)
  await serveMenuWithApps(page)

  await page.goto('/#/probe/installed')

  await expect(page.locator('.app-probe')).toHaveText('probe')
})

/**
 * PRD acceptance item 5, the one written as a disproof: no white screen, no
 * error, and the missing path named where whoever has to fix it will find it.
 *
 * Before this change loadView threw here, from inside the router's async
 * component loader where Vue Router has no recovery path -- so the layout went
 * blank, not just the panel.
 */
test('a menu pointing at an app that is not installed says so instead of blanking the page', async({ page, context }) => {
  const errors: string[] = []
  const warnings: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.text().includes('[loadView]')) warnings.push(message.text())
  })

  await authenticate(context)
  await installApiMocks(page)
  await serveMenuWithApps(page)

  await page.goto('/#/probe/ghost')

  await expect(page.getByText('该功能所属的应用未安装')).toBeVisible()

  // The layout is still there. A blank page would satisfy "no error" too, so
  // the sidebar is what separates a degraded panel from a dead application.
  await expect(page.locator('.el-menu').first()).toBeVisible()

  expect(errors, `an exception escaped: ${errors[0] ?? ''}`).toEqual([])
  expect(warnings.join('\n')).toContain('src/apps/ghost/x/index.vue')
})
