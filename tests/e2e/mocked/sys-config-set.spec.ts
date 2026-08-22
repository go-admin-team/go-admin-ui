import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * The settings page. Not a list -- a form over a handful of config keys, which
 * is why it is the one admin page with no useTable.
 */
test.describe('sys-config set', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('loads the saved settings', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await expect(page.getByPlaceholder('请输入系统名称')).toHaveValue('go-admin')
    await expect(page.getByPlaceholder('请输入初始密码')).toHaveValue('Init@123')
  })

  // The response omits sys_index_sideTheme, and the control renders regardless
  // -- which is what makes the dropped-key bug invisible. The proof that the key
  // survives is in the save test below, not here.
  test('the appearance section renders with nothing selected', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await page.locator('.nav-item').filter({ hasText: '外观设置' }).click()
    await expect(page.locator('.theme-card')).toHaveCount(2)

    const sideTheme = page.locator('.el-form-item').filter({ hasText: '侧栏主题' })
      .locator('.el-select__wrapper')
    await expect(sideTheme).toBeVisible()
    // The wrapper shows its placeholder: nothing is selected, because the
    // response never carried the key -- but the control is still there
    await expect(sideTheme).toHaveText('请选择侧栏主题')
  })

  // Reset refetches. resetFields would also restore these two fields, but only
  // these two -- it knows nothing about the theme cards or the logo, which sit
  // outside the el-form.
  test('reset puts the saved values back', async({ page }) => {
    await installApiMocks(page)

    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    const name = page.getByPlaceholder('请输入系统名称')
    await name.fill('改了一半')
    await expect(name).toHaveValue('改了一半')

    // The theme cards sit outside the el-form, so this is the half resetFields
    // could not reach
    await page.locator('.nav-item').filter({ hasText: '外观设置' }).click()
    await page.locator('.theme-card').first().click()
    await expect(page.locator('.theme-card.is-active')).toHaveCount(1)

    await page.getByRole('button', { name: '重置' }).click()

    await expect(page.locator('.theme-card.is-active')).toHaveCount(0)
    await page.locator('.nav-item').filter({ hasText: '基础信息' }).click()
    await expect(name).toHaveValue('go-admin')
  })

  test('saving sends every key as a configKey/configValue pair', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await page.getByPlaceholder('请输入系统名称').fill('go-admin pro')
    await page.getByRole('button', { name: '保存设置' }).click()

    await expect.poll(() => calls.extra.setConfigSaves).toBe(1)

    const sent = JSON.parse(calls.extra.setConfigBody || '[]')
    expect(Array.isArray(sent)).toBe(true)
    expect(sent).toContainEqual({ configKey: 'sys_app_name', configValue: 'go-admin pro' })
    // Every key the page owns goes out, including the one the server omitted.
    // Assigning the response straight over the model drops it here, silently:
    // the setting simply stops being saved.
    expect(sent.map((e: { configKey: string }) => e.configKey)).toContain('sys_index_sideTheme')
  })

  test('a required field blocks the save', async({ page }) => {
    const { calls } = await installApiMocks(page)

    await page.goto('/#/admin/sys-config/set')
    await page.waitForSelector('.config-section')

    await page.getByPlaceholder('请输入系统名称').fill('')
    await page.getByRole('button', { name: '保存设置' }).click()

    await expect(page.getByText('请输入系统名称')).toBeVisible()
    await page.waitForTimeout(300)
    expect(calls.extra.setConfigSaves).toBe(0)
  })
})
