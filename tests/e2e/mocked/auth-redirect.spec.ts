import { test, expect } from '@playwright/test'

/**
 * The OAuth popup landing page, in a real browser and without a session.
 *
 * Two things only a browser can show. The route is on the whitelist in
 * src/permission.js, so it has to render for a visitor who is not signed in --
 * a popup coming back from a provider is exactly that. And the application
 * routes on the hash, which is what decides where the provider's parameters
 * end up: the unit test can drive either shape, but only this says which one
 * the router actually produces.
 *
 * This page used Vue 2's `render: function(h)` until it was rewritten, so
 * opening it threw. Nothing reported that, because nothing linked to it.
 */
test('the OAuth landing page opens without a session and keeps the code', async({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto('/#/auth-redirect?code=abc123&state=xyz')

  // Not bounced to the login page: the whitelist entry is still doing its job.
  await expect(page).toHaveURL(/#\/auth-redirect/)

  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('x-admin-oauth-code')))
    .toBe('code=abc123&state=xyz')

  expect(errors, `an exception escaped: ${errors[0] ?? ''}`).toEqual([])
})
