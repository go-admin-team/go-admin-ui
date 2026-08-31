import { test, expect, type Page } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'
import { captureBodies } from './support/crud'

/**
 * The suite runs in Chinese (playwright.config.ts pins the locale).
 *
 * `dispatchEvent` rather than a click: el-dialog lays .el-overlay-dialog over
 * the whole viewport, so the navbar switcher is genuinely unreachable by mouse
 * while a dialog is open. The event still lands on el-dropdown's own handler,
 * so everything after it is the real path.
 */
const switchTo = async(page: Page, label: string) => {
  await page.locator('#lang-select').dispatchEvent('click')
  await page.getByRole('menuitem', { name: label, exact: true }).click()
}

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

test.describe('schedule in English', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.goto('/#/schedule/manage')
    await page.waitForSelector('.el-table')
  })

  test('the list, its toolbar and its row actions translate', async({ page }) => {
    await switchTo(page, 'English')

    const header = page.locator('.el-table__header')
    for (const label of ['ID', 'Name', 'Group', 'Cron Expression', 'Invoke Target', 'Status']) {
      await expect(header).toContainText(label)
    }
    expect(await header.innerText(), 'Chinese left in the headers').not.toMatch(/[一-龥]/)

    const toolbar = page.locator('.pro-table__toolbar')
    await expect(toolbar.getByRole('button', { name: 'Add' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: 'Delete' })).toBeVisible()
    await expect(toolbar.getByRole('button', { name: 'Log' })).toBeVisible()

    await expect(page.getByRole('row', { name: /清理过期日志/ })
      .getByRole('button', { name: 'Stop' })).toBeVisible()
    await expect(page.getByRole('row', { name: /同步用户/ })
      .getByRole('button', { name: 'Start' })).toBeVisible()
  })

  test('the hover card behind the invoke target translates', async({ page }) => {
    // Four interpolated sentences, and the values inside three of them are also
    // translated -- 接口/函数, 允许/禁止, and the misfire policy, which used to
    // be a module-level record built once.
    await switchTo(page, 'English')
    await page.getByRole('row', { name: /同步用户/ }).getByText('SyncUsers').hover()

    const card = page.locator('.el-popover:visible')
    await expect(card).toContainText('Args: full')
    await expect(card).toContainText('Invoke type: Function')
    await expect(card).toContainText('Misfire policy: Run Once')
    await expect(card).toContainText('Concurrent: Forbid')
  })

  test('a validation message already on screen follows the language', async({ page }) => {
    // Same failure as the generator's tabs: `const rules = { ... }` is evaluated
    // once at setup, and this page is kept alive, so reopening the dialog does
    // not rebuild it. useForm unwraps a ref, so a computed is all it takes --
    // and el-form revalidates on a rule change, which is what repaints a message
    // that is already rendered.
    await page.getByRole('button', { name: '新增', exact: true }).click()

    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog).toContainText('添加任务')
    await dialog.getByRole('button', { name: '确 定' }).click()

    const errors = dialog.locator('.el-form-item__error')
    await expect(errors.filter({ hasText: '名称不能为空' })).toHaveCount(1)

    await switchTo(page, 'English')

    await expect(dialog.locator('.el-dialog__title')).toHaveText('Add Task')
    await expect(errors.filter({ hasText: 'Name is required' })).toHaveCount(1)
    await expect(errors.filter({ hasText: '名称不能为空' })).toHaveCount(0)
    await expect(errors.filter({ hasText: 'Invoke target is required' })).toHaveCount(1)
  })

  test('the misfire radio group repaints while the dialog is open', async({ page }) => {
    // The three labels came from a plain Record<number, string>, read by both
    // the radio group and the hover card. A dialog that is already open has to
    // follow without being closed and reopened.
    await page.getByRole('row', { name: /清理过期日志/ }).getByRole('button', { name: '修改' }).click()

    const dialog = page.locator('.el-dialog:visible')
    await expect(dialog).toContainText('立即执行')

    await switchTo(page, 'English')

    await expect(dialog).toContainText('Run Immediately')
    await expect(dialog).toContainText('Run Once')
    await expect(dialog).toContainText('Skip')
    await expect(dialog).not.toContainText('立即执行')
  })

  test('starting a job asks in English, box and buttons included', async({ page }) => {
    await switchTo(page, 'English')
    await page.getByRole('row', { name: /同步用户/ }).getByRole('button', { name: 'Start' }).click()

    const box = page.locator('.el-message-box')
    await expect(box.locator('.el-message-box__title')).toHaveText('Notice')
    // The job's own name is Chinese in either language -- it is user data
    await expect(box.locator('.el-message-box__message')).toHaveText('Start the task "同步用户"?')
    await expect(box.getByRole('button', { name: 'OK' })).toBeVisible()
    await expect(box.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('deleting one job asks in English, in the singular', async({ page }) => {
    await switchTo(page, 'English')
    // The row's delete is the icon button, which carries the job name as its title
    await page.getByRole('row', { name: /同步用户/ })
      .getByTitle('Delete task: 同步用户').click()

    const box = page.locator('.el-message-box')
    await expect(box.locator('.el-message-box__message')).toHaveText('Delete the selected task?')
  })
})

test.describe('the job log page in English', () => {
  test.beforeEach(async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)
    await page.goto('/#/schedule/log')
    await expect(page.locator('.job-log__viewport')).toBeVisible()
  })

  test('the console chrome translates', async({ page }) => {
    // Nothing here refetches: the socket is opened once on mount, and the state
    // word beside the dot was a lookup table built at setup.
    await expect(page.locator('.job-log__count')).toHaveText('0 行')

    await switchTo(page, 'English')

    await expect(page.locator('.job-log__count')).toHaveText('0 lines')
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()
    // The dev server does not speak this protocol, so the socket closes and the
    // page offers to reconnect. Either state is legitimate; both are asserted
    // in English rather than by waiting for one.
    await expect(page.locator('.job-log__state')).toHaveText(/Connecting|Connected|Disconnected/)
    await expect(page.locator('.job-log__empty')).toHaveText(/waiting for task output|Not connected/)
    expect(await page.locator('.job-log').innerText(), 'Chinese left on the page')
      .not.toMatch(/[一-龥]/)
  })
})
