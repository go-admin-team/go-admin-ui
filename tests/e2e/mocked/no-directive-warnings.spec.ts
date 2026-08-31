import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * No runtime directive is applied where Vue cannot apply it.
 *
 * v-dialogDrag sat on the scheduler's el-dialog for as long as this project has
 * been on Vue 3, and never ran once: el-dialog's root is not an element, so Vue
 * skips the directive and says so. Nothing broke -- the dialog simply was not
 * draggable, which is indistinguishable from never having offered it.
 *
 * A console warning is not something anyone reads, so this asserts the count.
 */
test('no component gets a directive Vue will refuse to run', async({ page, context }) => {
  const warnings: string[] = []
  page.on('console', message => {
    if (message.text().includes('non-element root node')) warnings.push(message.text().slice(0, 100))
  })

  await authenticate(context)
  await installApiMocks(page)

  // The scheduler is where the only such directive lived; its dialog is the
  // component that produced the warning.
  await page.goto('/#/schedule')
  await expect(page.locator('.el-table').first()).toBeVisible({ timeout: 15000 })
  await page.locator('#loader-wrapper').waitFor({ state: 'detached', timeout: 10000 })
    .catch(() => { /* already gone */ })
  await page.locator('.pro-table__toolbar button').first().click()
  await expect(page.locator('.el-dialog:visible')).toBeVisible({ timeout: 10000 })

  expect(warnings, `Vue refused to run a directive: ${warnings[0] ?? ''}`).toEqual([])
})
