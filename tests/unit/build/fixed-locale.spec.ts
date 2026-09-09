import { describe, it, expect } from 'vitest'
import viteConfig from '../../../vite.config.mjs'

/**
 * Pinning a deployment to one language, and what happens when the value is
 * misspelled.
 *
 * VUE_APP_LOCALE is read at build time and reaches the application through
 * `define`, so a typo cannot fail at runtime -- there is nothing left to fail:
 * `isLocale` rejects it, the app follows the browser exactly as before, and the
 * interface looks completely normal. The only person who would ever notice is
 * the operator who believed they had pinned it, and they would notice from a
 * user report weeks later.
 *
 * So the build refuses. These tests are that refusal, and the empty case that
 * every .env in the repository ships.
 */
type ConfigFactory = (env: { mode: string, command: string }) => Promise<{
  define: Record<string, string>
}>

/** Node's own env, which loadEnv merges over the .env files. See google-analytics.spec.ts. */
const nodeEnv = process.env as unknown as Record<string, string | undefined>

const buildWith = async(locale?: string) => {
  const saved = nodeEnv.VUE_APP_LOCALE
  if (locale === undefined) delete nodeEnv.VUE_APP_LOCALE
  else nodeEnv.VUE_APP_LOCALE = locale

  try {
    const config = await (viteConfig as unknown as ConfigFactory)({ mode: 'production', command: 'build' })
    return config.define['process.env.VUE_APP_LOCALE']
  } finally {
    if (saved === undefined) delete nodeEnv.VUE_APP_LOCALE
    else nodeEnv.VUE_APP_LOCALE = saved
  }
}

describe('VUE_APP_LOCALE', () => {
  it('injects an empty string when nothing is pinned', async() => {
    // What .env.production ships, and so what every self-hosted build produces:
    // the visitor decides.
    expect(await buildWith('')).toBe('""')
  })

  it('injects an empty string when the variable is absent entirely', async() => {
    expect(await buildWith()).toBe('""')
  })

  it('injects the language when one is pinned', async() => {
    expect(await buildWith('zh-CN')).toBe('"zh-CN"')
    expect(await buildWith('en-US')).toBe('"en-US"')
  })

  it('treats a value of only whitespace as unpinned', async() => {
    expect(await buildWith('   ')).toBe('""')
  })

  it('fails the build on a language it does not ship', async() => {
    // The three spellings someone actually reaches for.
    for (const wrong of ['zh_CN', 'zh', 'cn']) {
      await expect(buildWith(wrong)).rejects.toThrow(`"${wrong}"`)
    }
  })

  it('says which languages are available when it refuses', async() => {
    // A refusal that does not name the alternatives sends the operator to the
    // source to find out what to write instead.
    await expect(buildWith('fr-FR')).rejects.toThrow(/zh-CN/)
    await expect(buildWith('fr-FR')).rejects.toThrow(/en-US/)
  })
})
