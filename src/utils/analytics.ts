/**
 * Google Analytics, in one place.
 *
 * Everything about the integration lives here and in the `googleAnalytics`
 * plugin in vite.config.mjs. To turn it off, clear VUE_APP_GA_ID -- the tag is
 * then not injected at all and nothing in this file does anything. To remove it
 * for good, delete those two and the afterEach call in permission.js.
 *
 * Two things about this application decide the shape of what follows.
 *
 * It is a single page. There is one index.html, so the tag is loaded once and
 * covers every route the login page included -- Google's "one tag per page"
 * instruction is about multi-page sites and is satisfied here by construction.
 *
 * And it routes on the hash. Every route shares the URL `https://host/`, with
 * the route sitting in `#/login`, `#/admin/sys-user` and so on. GA4 reads the
 * page a hit belongs to off `page_location`, and specifically off its *path* --
 * which for every route in this application is `/`. Left alone, the whole site
 * reports as one page. So the automatic page_view is turned off in the tag (see
 * `send_page_view: false`) and each navigation sends its own, with the route
 * lifted out of the hash and into the path where GA4 will look for it.
 */

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: Gtag
  }
}

/**
 * The URL to report a route under.
 *
 * `#/login` becomes `/login`, so GA4 sees a path per route rather than one `/`
 * for the whole site.
 *
 * Anything in the query *before* the hash is carried over. That is where utm_*
 * and gclid land when someone arrives from a campaign, and they never reach the
 * router -- vue-router only parses the query inside the hash. GA4 reads
 * attribution off page_location, so dropping them would quietly lose the source
 * of every campaign visit. A parameter the route already has wins, since that
 * one is about the route.
 */
export const virtualUrl = (fullPath: string, href: string): string => {
  const actual = new URL(href)
  const virtual = new URL(fullPath, actual.origin)

  actual.searchParams.forEach((value, key) => {
    if (!virtual.searchParams.has(key)) virtual.searchParams.set(key, value)
  })

  return virtual.href
}

/**
 * Reports one page view.
 *
 * Does nothing when the tag was not injected, which is every build without a
 * measurement id -- intranet and offline deployments among them. `window.gtag`
 * is defined synchronously by the inline half of the tag, so it is there long
 * before googletagmanager.com answers, and calls made in between are queued.
 */
export function trackPageView(fullPath: string): void {
  window.gtag?.('event', 'page_view', {
    page_title: document.title,
    page_location: virtualUrl(fullPath, window.location.href)
  })
}
