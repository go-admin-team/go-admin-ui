import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * Scheduled jobs. The action column branches on two fields at once: entry_id is
 * the handle cron hands back, so zero means the job is not currently scheduled,
 * and a disabled job can be neither started nor stopped.
 */
test.describe('schedule', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('lists jobs with their group and status', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    await expect(page.locator('.el-table__row')).toHaveCount(3)
    await expect(page.getByRole('row', { name: /清理过期日志/ }).getByText('默认')).toBeVisible()
    await expect(page.getByRole('row', { name: /同步用户/ }).getByText('系统')).toBeVisible()
  })

  // entry_id is snake_case, alone among the model's fields. Reading entryId --
  // which is what the type used to declare -- makes it undefined, and every row
  // then looks like it is running.
  test('offers 停止 for a running job and 启动 for a stopped one', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    const running = page.getByRole('row', { name: /清理过期日志/ })
    await expect(running.getByRole('button', { name: '停止' })).toBeVisible()
    await expect(running.getByRole('button', { name: '启动' })).toHaveCount(0)

    const stopped = page.getByRole('row', { name: /同步用户/ })
    await expect(stopped.getByRole('button', { name: '启动' })).toBeVisible()
    await expect(stopped.getByRole('button', { name: '停止' })).toHaveCount(0)
  })

  test('a disabled job offers neither', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    const disabled = page.getByRole('row', { name: /已停用的任务/ })
    await expect(disabled.getByRole('button', { name: '启动' })).toHaveCount(0)
    await expect(disabled.getByRole('button', { name: '停止' })).toHaveCount(0)
    await expect(disabled.getByRole('button', { name: '修改' })).toBeVisible()
  })

  test('starting asks first, then reloads', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')
    const before = calls.job.list

    await page.getByRole('row', { name: /同步用户/ }).getByRole('button', { name: '启动' }).click()
    await expect(page.locator('.el-message-box')).toContainText('同步用户')
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()

    await expect.poll(() => calls.extra.jobStarts).toBe(1)
    await expect.poll(() => calls.job.list).toBeGreaterThan(before)
  })

  // A hand-rolled confirm needs the same in-flight guard useRemove holds
  test('double-clicking 停止 opens one dialog, not two', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr'))
        .find(tr => tr.textContent?.includes('清理过期日志'))
      const stop = Array.from(row?.querySelectorAll('button') ?? [])
        .find(b => b.textContent?.includes('停止')) as HTMLButtonElement
      stop.click()
      stop.click()
    })

    await expect(page.locator('.el-message-box')).toHaveCount(1)
    await page.locator('.el-message-box').getByRole('button', { name: '确定' }).click()
    await expect.poll(() => calls.extra.jobStops).toBe(1)
  })

  // The seed registers this route as JobLog; pushing 'job_log' matched nothing,
  // so the button did nothing at all
  test('the 日志 button reaches the log page', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    await page.locator('.pro-table__toolbar').getByRole('button', { name: '日志' }).click()

    await expect(page).toHaveURL(/#\/schedule\/log$/)
    await expect(page.locator('.job-log__viewport')).toBeVisible()
  })

  test('submits status as a number', async({ page }) => {
    const { calls } = await installApiMocks(page)
    const bodies = await captureBodies(page, '**/api/v1/sysjob', 'PUT')

    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')

    await page.getByRole('row', { name: /清理过期日志/ }).getByRole('button', { name: '修改' }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: '修改任务' })
    await dialog.getByPlaceholder('名称').fill('清理归档日志')
    await dialog.getByRole('button', { name: '确 定' }).click()

    await expect.poll(() => calls.job.update).toBe(1)
    expect(typeof JSON.parse(bodies.at(-1) || '{}').status).toBe('number')
  })
})
