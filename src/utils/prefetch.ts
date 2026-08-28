/**
 * Warms the chunks the next screen needs, while the current one is idle.
 *
 * Signing in is the one moment in this app where the next destination is
 * known in advance and the user is busy for a few seconds. The dashboard is
 * the heaviest route -- it pulls echarts, 216 kB gzipped -- so fetching it
 * while someone reads the captcha turns a visible wait into no wait at all.
 *
 * Deliberately fire-and-forget. A prefetch that fails, or that a browser
 * declines to run, must not affect signing in; the import simply happens
 * again, for real, on navigation.
 */
export function prefetchOnIdle(load: () => Promise<unknown>): void {
  const run = () => { void load().catch(() => { /* the real navigation will retry */ }) }

  // requestIdleCallback is still unimplemented in Safari. The timeout fallback
  // is not equivalent -- it can land while the page is still busy -- but it is
  // late enough that the first paint is done.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 3000 })
    return
  }
  window.setTimeout(run, 1200)
}
