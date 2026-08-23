import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { virtualUrl, trackPageView } from '@/utils/analytics'

/**
 * Analytics fails silently by nature: the site works, the numbers are just
 * wrong or missing, and nobody finds out until someone opens a report months
 * later. So the parts with a right answer are pinned here, and the wiring --
 * that a navigation reaches this at all, exactly once -- in
 * tests/e2e/mocked/analytics.spec.ts.
 */

describe('virtualUrl', () => {
  it('lifts the route out of the hash and into the path', () => {
    // The whole reason this function exists: GA4 takes the page from the path,
    // and every route in a hash-routed application shares the path "/".
    expect(virtualUrl('/login', 'https://demo.go-admin.dev/#/login'))
      .toBe('https://demo.go-admin.dev/login')

    expect(virtualUrl('/admin/sys-user', 'https://demo.go-admin.dev/#/admin/sys-user'))
      .toBe('https://demo.go-admin.dev/admin/sys-user')
  })

  it('keeps the route query, which says which page this is', () => {
    expect(virtualUrl('/login?redirect=/admin/sys-user', 'https://demo.go-admin.dev/#/login?redirect=/admin/sys-user'))
      .toBe('https://demo.go-admin.dev/login?redirect=/admin/sys-user')
  })

  it('carries over campaign parameters the router never sees', () => {
    // utm_* sits before the hash, so vue-router does not parse it and it is
    // absent from fullPath. GA4 reads attribution off page_location, so leaving
    // it behind would report every campaign visit as direct traffic.
    expect(virtualUrl('/login', 'https://demo.go-admin.dev/?utm_source=github&utm_medium=readme#/login'))
      .toBe('https://demo.go-admin.dev/login?utm_source=github&utm_medium=readme')
  })

  it('lets the route keep a parameter the outer query also has', () => {
    expect(virtualUrl('/login?redirect=/a', 'https://demo.go-admin.dev/?redirect=/b#/login?redirect=/a'))
      .toBe('https://demo.go-admin.dev/login?redirect=/a')
  })

  it('keeps the port and the scheme it was given', () => {
    expect(virtualUrl('/dashboard', 'http://localhost:9527/#/dashboard'))
      .toBe('http://localhost:9527/dashboard')
  })
})

describe('trackPageView', () => {
  const href = 'https://demo.go-admin.dev/#/login'

  beforeEach(() => {
    vi.stubGlobal('location', new URL(href))
    document.title = '登录 - go-admin'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete window.gtag
  })

  it('does nothing at all when the tag was never injected', () => {
    // Every build without a measurement id, which is how the repository ships:
    // intranet and offline deployments must not depend on this working.
    expect(window.gtag).toBeUndefined()
    expect(() => trackPageView('/login')).not.toThrow()
  })

  it('reports the route under a path GA4 can tell apart', () => {
    const gtag = vi.fn()
    window.gtag = gtag

    trackPageView('/login')

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_title: '登录 - go-admin',
      page_location: 'https://demo.go-admin.dev/login'
    })
  })

  it('reports the title the user is looking at', () => {
    const gtag = vi.fn()
    window.gtag = gtag
    document.title = '用户管理 - go-admin'

    trackPageView('/admin/sys-user')

    expect(gtag.mock.calls[0][2]).toMatchObject({ page_title: '用户管理 - go-admin' })
  })
})
