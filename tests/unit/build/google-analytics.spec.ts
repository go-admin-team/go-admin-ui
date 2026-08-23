import { describe, it, expect } from 'vitest'
import viteConfig from '../../../vite.config.mjs'

/**
 * Guards the rule in CLAUDE.md that this project pulls nothing from an external
 * CDN, because intranet and offline deployments are a normal way to run it.
 *
 * The analytics tag is the one thing in the build that would, so it is gated on
 * a measurement id being configured. That gate is a single `if` in a plugin
 * nobody reads twice, and losing it fails in the worst direction: every offline
 * deployment starts asking googletagmanager.com for a script it cannot reach,
 * and the build stays green while doing it.
 */

interface HtmlTag {
  tag: string
  injectTo: string
  attrs?: Record<string, unknown>
  children?: string
}

type Transformed = string | { html: string, tags: HtmlTag[] }

interface Plugin {
  name: string
  transformIndexHtml?: { handler: (html: string) => Transformed }
}

type ConfigFactory = (env: { mode: string, command: string }) => Promise<{ plugins: Plugin[] }>

/**
 * src/env.d.ts declares a browser-shaped `process` carrying only the keys vite's
 * `define` injects, and deliberately leaves VUE_APP_GA_ID out of it -- the id is
 * read in vite.config.mjs at build time and never reaches application code.
 * These tests run in Node, where the real process.env is, so they reach it here
 * rather than by widening a declaration that is right as it stands.
 */
const nodeEnv = process.env as unknown as Record<string, string | undefined>

const transformHtml = async(measurementId?: string): Promise<Transformed> => {
  const saved = nodeEnv.VUE_APP_GA_ID
  if (measurementId === undefined) delete nodeEnv.VUE_APP_GA_ID
  else nodeEnv.VUE_APP_GA_ID = measurementId

  try {
    const config = await (viteConfig as unknown as ConfigFactory)({ mode: 'production', command: 'build' })
    const plugin = config.plugins.flat().find(candidate => candidate?.name === 'google-analytics')
    if (!plugin?.transformIndexHtml) {
      throw new Error('the google-analytics plugin is not registered in vite.config.mjs')
    }

    return plugin.transformIndexHtml.handler('<html><head></head><body></body></html>')
  } finally {
    if (saved === undefined) delete nodeEnv.VUE_APP_GA_ID
    else nodeEnv.VUE_APP_GA_ID = saved
  }
}

describe('the google-analytics build plugin', () => {
  it('injects nothing when no measurement id is configured', async() => {
    // What .env.production ships, and so what every self-hosted build produces.
    const result = await transformHtml('')

    expect(typeof result).toBe('string')
    expect(result).not.toContain('googletagmanager')
    expect(result).not.toContain('gtag')
  })

  it('injects nothing when the variable is absent entirely', async() => {
    const result = await transformHtml()

    expect(typeof result).toBe('string')
    expect(result).not.toContain('googletagmanager')
  })

  it('puts the tag at the top of head when an id is configured', async() => {
    const result = await transformHtml('G-TESTID0001') as { tags: HtmlTag[] }

    expect(result.tags).toHaveLength(2)
    // Google asks for the tag immediately after the opening <head>
    expect(result.tags.every(tag => tag.injectTo === 'head-prepend')).toBe(true)

    const [remote, inline] = result.tags
    expect(remote.attrs).toMatchObject({
      async: true,
      src: 'https://www.googletagmanager.com/gtag/js?id=G-TESTID0001'
    })
    expect(inline.children).toContain("gtag('js', new Date())")
    expect(inline.children).toContain("gtag('config', 'G-TESTID0001'")
  })

  it('turns off the automatic page view, which a hash-routed app reports wrong', async() => {
    const result = await transformHtml('G-TESTID0001') as { tags: HtmlTag[] }

    // Without this the whole site reports as one page, "/", and each navigation
    // that src/utils/analytics.ts reports would be a second hit on top.
    expect(result.tags[1].children).toContain('send_page_view: false')
  })
})
