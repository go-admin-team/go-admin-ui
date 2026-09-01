import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthRedirect from '@/views/login/auth-redirect.vue'

/**
 * The OAuth popup landing page, which had no coverage at all while it was
 * broken: it used Vue 2's `render: function(h)`, which throws under Vue 3, and
 * nothing pointed a visitor at it. Rewritten for Vue 3, it needs a test that
 * would notice the next time it silently stops working -- the route is on the
 * router's whitelist and stays reachable whether or not anyone links to it.
 */
describe('views/login/auth-redirect', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const spies = () => ({
    setItem: vi.spyOn(Storage.prototype, 'setItem'),
    close: vi.spyOn(window, 'close').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('hands a real query string to the opener and closes the popup', () => {
    const { setItem, close, warn } = spies()
    window.history.pushState({}, '', '/auth-redirect?code=abc123&state=xyz')

    mount(AuthRedirect)

    // The whole query string, not a parsed code: the opener owns the exchange,
    // and this page has no idea which parameters that provider needs.
    expect(setItem).toHaveBeenCalledWith('x-admin-oauth-code', 'code=abc123&state=xyz')
    expect(close).toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  /**
   * The shape this application's own router produces.
   *
   * src/router uses createWebHashHistory, so a provider sent to
   * "https://host/#/auth-redirect?code=..." leaves location.search empty and
   * puts everything after the route inside the hash. The Vue 2 version read
   * location.search alone and stored an empty string here -- no error, no
   * warning, and an opener that waits forever for a code that never arrives.
   */
  it('reads the parameters out of the hash when the route carries them', () => {
    const { setItem, close } = spies()
    window.history.pushState({}, '', '/#/auth-redirect?code=abc123&state=xyz')

    mount(AuthRedirect)

    expect(setItem).toHaveBeenCalledWith('x-admin-oauth-code', 'code=abc123&state=xyz')
    expect(close).toHaveBeenCalled()
  })

  it('says so rather than storing an empty code in silence', () => {
    const { setItem, warn } = spies()
    window.history.pushState({}, '', '/#/auth-redirect')

    mount(AuthRedirect)

    expect(setItem).toHaveBeenCalledWith('x-admin-oauth-code', '')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[auth-redirect]'))
  })

  it('renders without throwing, which the Vue 2 render function did not', () => {
    spies()
    window.history.pushState({}, '', '/#/auth-redirect')

    expect(() => mount(AuthRedirect)).not.toThrow()
  })
})
