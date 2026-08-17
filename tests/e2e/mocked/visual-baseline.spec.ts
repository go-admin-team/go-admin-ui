import { test } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * Captures screenshots of the main surfaces so a styling change can be compared
 * against a known-good state.
 *
 * Not an assertion suite: it fails nothing and is excluded from `pnpm e2e`.
 * Run it explicitly with `pnpm e2e:shots` before and after a visual change and
 * diff the two folders by eye.
 *
 * Output goes to test-results/shots/<theme>/, which .gitignore already covers.
 */

const surfaces = [
  // No session: the guard bounces an authenticated visit to /login home
  // The login hero types its terminal output in. Waiting on the last line
  // finishing beats a fixed sleep: it settles as soon as the animation is done
  // rather than at a padded guess, and it does not need re-padding if the
  // timings are retuned. Reduced-motion shows the lines at once, so it passes
  // immediately there.
  {
    name: 'login',
    path: '/#/login',
    wait: '.login-page',
    anonymous: true,
    settled: () => {
      const last = document.querySelector('.term-body .l8')
      return !!last && getComputedStyle(last).opacity === '1'
    }
  },
  { name: 'list-page', path: '/#/demo/product', wait: '.el-table' },
  { name: 'dialog', path: '/#/demo/product', wait: '.el-table', open: '新增' },
  // The densest surface: department tree, search bar, toolbar, sortable table
  { name: 'sys-user', path: '/#/admin/sys-user', wait: '.el-table' },
  { name: 'sys-user-dialog', path: '/#/admin/sys-user', wait: '.el-table', open: '新增' }
]

for (const theme of ['light', 'dark'] as const) {
  test.describe(`visual baseline (${theme})`, () => {
    for (const surface of surfaces) {
      test(`${surface.name}`, async({ page, context }) => {
        if (!surface.anonymous) await authenticate(context)
        await installApiMocks(page)

        await page.goto(surface.path)
        // Element Plus keys its dark theme off a class on <html>
        await page.evaluate(t => {
          document.documentElement.classList.toggle('dark', t === 'dark')
        }, theme)

        await page.waitForSelector(surface.wait, { timeout: 15_000 })

        if (surface.open) {
          await page.getByRole('button', { name: surface.open }).click()
          await page.waitForSelector('.el-dialog', { state: 'visible' })
        }

        // Let transitions settle so shots are stable between runs
        if (surface.settled) {
          await page.waitForFunction(surface.settled, null, { timeout: 10_000 })
        }
        await page.waitForTimeout(400)
        await page.screenshot({
          path: `test-results/shots/${theme}/${surface.name}.png`,
          fullPage: false
        })
      })
    }
  })
}
