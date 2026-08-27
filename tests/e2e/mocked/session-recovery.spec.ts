import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

/**
 * What the application does when the backend is down but the session is not.
 *
 * A token in the cookie says "signed in"; the roles that decide which routes
 * exist come from GET /api/v1/getinfo. When that call fails, the guard has a
 * token it cannot use, and every path out of that state has to end somewhere.
 * The one it must not take is back into itself.
 */
test.describe('a failing session lookup', () => {
  test('stops asking instead of hammering the endpoint', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    // Counted here rather than through the fixture: this route overrides the
    // fixture's, so its counter stops moving.
    let attempts = 0
    // 502 is what a restarting or crash-looping backend returns through nginx,
    // and it is the case that used to loop: unlike a 401, nothing in the
    // response tells the client its session is finished.
    await page.route(/\/api\/v1\/getinfo/, route => {
      attempts++
      return route.fulfill({
        status: 502,
        contentType: 'text/html',
        body: '<html><body><h1>502 Bad Gateway</h1></body></html>'
      })
    })

    await page.goto('/#/admin/sys-user')
    await page.waitForURL(/#\/login/, { timeout: 15_000 })
    await page.waitForSelector('form')

    // Settle, then measure. A loop shows up as a count that keeps climbing;
    // the fix shows up as one that does not. Before the fix this reached the
    // hundreds and the page never arrived at /login at all.
    const afterArrival = attempts
    await page.waitForTimeout(3000)

    expect(attempts, 'getinfo is not retried in a loop').toBe(afterArrival)
    // One attempt is expected. A handful would mean a slower loop rather than
    // no loop, which is why this is not a "fewer than fifty" check.
    expect(afterArrival).toBeLessThanOrEqual(2)
  })

  test('leaves the user on the login page, not bouncing off it', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.route(/\/api\/v1\/getinfo/, route => route.fulfill({
      status: 502, contentType: 'text/html', body: '502'
    }))

    await page.goto('/#/admin/sys-user')
    await page.waitForURL(/#\/login/, { timeout: 15_000 })
    await page.waitForSelector('form')

    // The stale token has to go. While it is there the guard reads the session
    // as live, sends /login back to /, and the whole thing starts again.
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('#/login')

    const token = (await context.cookies()).find(c => c.name === 'Admin-Token')
    expect(token?.value ?? '', 'the unusable token is cleared').toBe('')
  })

  test('leaves no half-built session behind', async({ page, context }) => {
    await authenticate(context)
    await installApiMocks(page)

    await page.route(/\/api\/v1\/getinfo/, route => route.fulfill({
      status: 502, contentType: 'text/html', body: '502'
    }))

    await page.goto('/#/admin/sys-user')
    await page.waitForURL(/#\/login/, { timeout: 15_000 })
    await page.waitForSelector('form')

    // The guard treats `roles.length > 0` as "this session is ready". A failure
    // that cleared the token but kept the profile would let the next pass
    // through to a page with no permissions loaded, so the reset clears both.
    // Read through the DOM: the sidebar is built from the roles, so an empty one
    // is the observable form of "no profile left over".
    expect(await page.locator('.el-menu-item').count(), 'no menu built from stale roles').toBe(0)
  })
})
