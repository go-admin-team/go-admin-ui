import { test, expect } from '@playwright/test'
import { installLoginMocks, CAPTCHA_ANSWER } from './fixtures'

/**
 * Signing in.
 *
 * 91% of the people who open this deployment land here, and until now nothing
 * executed it: every other spec starts by planting a cookie, which skips the
 * page entirely. The gap was invisible because the suite was green -- it was
 * green about everything except the one screen most visitors see.
 *
 * These tests deliberately do NOT call authenticate(). A token in the jar sends
 * the guard straight to '/', so a signed-in fixture cannot reach this page.
 */
test.describe('signing in', () => {
  test.beforeEach(async({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('the form arrives filled in, with a captcha to solve', async({ page }) => {
    const calls = await installLoginMocks(page)
    await page.goto('/#/login')

    // Demo credentials are pre-filled on purpose; the captcha is the only field
    // a visitor has to supply.
    await expect(page.locator('input[name=username]')).toHaveValue('admin')
    await expect(page.locator('input[name=password]')).toHaveValue('123456')
    await expect(page.locator('input[name=code]')).toHaveValue('')

    // Rendered, not merely requested: the page binds the payload to <img src>,
    // so a broken response leaves an element that exists but shows nothing.
    const image = page.locator('.captcha-img')
    await expect(image).toBeVisible()
    expect(await image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
    expect(calls.captcha).toBe(1)
  })

  test('clicking the captcha issues a new challenge', async({ page }) => {
    const calls = await installLoginMocks(page)
    await page.goto('/#/login')
    await expect(page.locator('.captcha-img')).toBeVisible()

    await page.locator('.captcha-wrap').click()
    await expect.poll(() => calls.captcha).toBe(2)

    // A refresh that reuses the previous id would look identical on screen and
    // fail on the server, so the id is what this checks.
    await page.locator('input[name=code]').fill(CAPTCHA_ANSWER)
    await page.locator('.submit-btn').click()
    await expect.poll(() => calls.lastLogin?.uuid).toBe('e2e-captcha-2')
  })

  test('the attempt carries the captcha id the image was issued under', async({ page }) => {
    const calls = await installLoginMocks(page)
    await page.goto('/#/login')
    await expect(page.locator('.captcha-img')).toBeVisible()

    await page.locator('input[name=code]').fill(CAPTCHA_ANSWER)
    await page.locator('.submit-btn').click()

    await expect.poll(() => calls.login).toBe(1)
    // Dropping uuid is the classic way this breaks: the request still looks
    // well-formed and the server rejects every attempt.
    expect(calls.lastLogin).toMatchObject({
      username: 'admin',
      password: '123456',
      code: CAPTCHA_ANSWER,
      uuid: 'e2e-captcha-1'
    })
  })

  test('a good attempt lands on the dashboard', async({ page }) => {
    const calls = await installLoginMocks(page)
    await page.goto('/#/login')
    await expect(page.locator('.captcha-img')).toBeVisible()

    await page.locator('input[name=code]').fill(CAPTCHA_ANSWER)
    await page.locator('.submit-btn').click()

    // Through the guard, which fetches the profile and builds the routes.
    await expect(page).toHaveURL(/#\/(dashboard)?$/)
    await expect(page.locator('.sidebar-container')).toBeVisible()

    // Exactly once each: the guard reads roles off the store after the first
    // call, so a second fetch would mean the session was rebuilt -- the shape
    // the 502 loop took, where a token survived a failed profile lookup.
    expect(calls.getinfo, 'profile fetched once').toBe(1)
    expect(calls.menurole, 'routes built once').toBe(1)
  })

  test('a redirect is honoured after signing in', async({ page }) => {
    await installLoginMocks(page)
    // The shape the guard produces when an unauthenticated visitor asks for a
    // page: next(`/login?redirect=${to.path}`).
    await page.goto('/#/login?redirect=/admin/sys-user')
    await expect(page.locator('.captcha-img')).toBeVisible()

    await page.locator('input[name=code]').fill(CAPTCHA_ANSWER)
    await page.locator('.submit-btn').click()

    await expect(page).toHaveURL(/#\/admin\/sys-user/)
  })

  test('a rejected attempt stays put and re-issues the captcha', async({ page }) => {
    const calls = await installLoginMocks(page)
    await page.goto('/#/login')
    await expect(page.locator('.captcha-img')).toBeVisible()

    await page.locator('input[name=code]').fill('0000')
    await page.locator('.submit-btn').click()

    await expect.poll(() => calls.login).toBe(1)
    // A spent captcha cannot be retried, so the page must fetch another one --
    // otherwise the second attempt fails for a reason the user cannot see.
    await expect.poll(() => calls.captcha).toBe(2)
    await expect(page).toHaveURL(/#\/login/)

    // And the button has to come back, or the form is dead after one mistake.
    await expect(page.locator('.submit-btn')).toBeEnabled()
    await expect(page.locator('.submit-btn')).toHaveText('登录')
  })
})
