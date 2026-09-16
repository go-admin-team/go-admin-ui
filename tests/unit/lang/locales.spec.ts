import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  LOCALES, DEFAULT_LOCALE, STORAGE_KEY,
  isLocale, matchLocale, storedLocale, rememberLocale, initialLocale, fixedLocale
} from '@/lang/locales'

/**
 * Which language a visitor lands in.
 *
 * All of this fails quietly when it is wrong -- someone gets the wrong
 * language, or loses the one they picked, and nothing throws.
 */
describe('matchLocale', () => {
  it('matches on the language subtag, not the whole tag', () => {
    // en-GB, en-AU and bare en all have to reach en-US. Comparing whole tags
    // would send every English speaker outside the US to Chinese.
    expect(matchLocale('en')).toBe('en-US')
    expect(matchLocale('en-GB')).toBe('en-US')
    expect(matchLocale('EN-au')).toBe('en-US')
    expect(matchLocale('zh')).toBe('zh-CN')
    expect(matchLocale('zh-TW')).toBe('zh-CN')
  })

  it('returns nothing for a language we do not ship', () => {
    expect(matchLocale('ja-JP')).toBeUndefined()
    expect(matchLocale('')).toBeUndefined()
    expect(matchLocale(undefined)).toBeUndefined()
  })
})

describe('isLocale', () => {
  it('accepts exactly the shipped values', () => {
    expect(LOCALES.map(l => l.value).every(isLocale)).toBe(true)
    expect(isLocale('en')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips a choice', () => {
    rememberLocale('en-US')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en-US')
    expect(storedLocale()).toBe('en-US')
  })

  it('ignores a stored value that is no longer a language we ship', () => {
    // Someone downgrades, or a language is dropped. Returning it would make
    // setLocale ask for a chunk that does not exist.
    localStorage.setItem(STORAGE_KEY, 'ja-JP')
    expect(storedLocale()).toBeUndefined()
  })

  it('survives storage throwing', () => {
    // Safari in private mode. A language preference is not worth a crash.
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(storedLocale()).toBeUndefined()
    spy.mockRestore()

    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => rememberLocale('en-US')).not.toThrow()
    setSpy.mockRestore()
  })
})

describe('initialLocale', () => {
  const stub = (languages: string[]) => {
    vi.stubGlobal('navigator', { languages, language: languages[0] })
  }

  beforeEach(() => {
    localStorage.clear()
    // These cases are about the visitor, so the deployment must not be pinned.
    // Left to the real environment, a shell with VUE_APP_LOCALE exported would
    // make every one of them pass for the wrong reason.
    vi.stubEnv('VUE_APP_LOCALE', '')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('prefers what the visitor chose over what the browser says', () => {
    localStorage.setItem(STORAGE_KEY, 'zh-CN')
    stub(['en-US'])
    expect(initialLocale()).toBe('zh-CN')
  })

  it('falls back to the browser when nothing was chosen', () => {
    stub(['en-GB', 'fr'])
    expect(initialLocale()).toBe('en-US')
  })

  it('walks past languages it does not ship', () => {
    // A visitor whose first preference is Japanese but who also reads English
    // should get English, not the zh-CN default.
    stub(['ja-JP', 'en-US'])
    expect(initialLocale()).toBe('en-US')
  })

  it('falls back to zh-CN when nothing matches', () => {
    stub(['ja-JP'])
    expect(initialLocale()).toBe(DEFAULT_LOCALE)
  })
})

/**
 * A deployment that ships in one language.
 *
 * The whole point is that the visitor cannot end up somewhere else, so what
 * matters is the order: this has to beat both the stored choice and the
 * browser. The deployments that want it have usually been running long enough
 * that someone has already used the switcher.
 */
describe('fixedLocale', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is nothing when the build was not pinned', () => {
    vi.stubEnv('VUE_APP_LOCALE', '')
    expect(fixedLocale()).toBeUndefined()
  })

  it('is the language the build was pinned to', () => {
    vi.stubEnv('VUE_APP_LOCALE', 'en-US')
    expect(fixedLocale()).toBe('en-US')
  })

  it('ignores a value that is not a language we ship', () => {
    // vite.config.mjs fails the build on this, so it should never arrive. The
    // guard is here so that a value which somehow does cannot be handed to
    // setLocale, which would ask for a chunk that does not exist.
    vi.stubEnv('VUE_APP_LOCALE', 'zh_CN')
    expect(fixedLocale()).toBeUndefined()
  })
})

describe('initialLocale on a pinned build', () => {
  const stub = (languages: string[]) => {
    vi.stubGlobal('navigator', { languages, language: languages[0] })
  }

  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('outranks a choice the visitor made earlier', () => {
    // The upgrade case: this deployment ran without the switcher, then with it,
    // and now wants one language again. Someone who switched to English in
    // between still has 'en-US' in localStorage.
    localStorage.setItem(STORAGE_KEY, 'en-US')
    vi.stubEnv('VUE_APP_LOCALE', 'zh-CN')
    expect(initialLocale()).toBe('zh-CN')
  })

  it('outranks the browser', () => {
    stub(['en-GB'])
    vi.stubEnv('VUE_APP_LOCALE', 'zh-CN')
    expect(initialLocale()).toBe('zh-CN')
  })

  it('can pin a language that is not the default', () => {
    stub(['zh-CN'])
    vi.stubEnv('VUE_APP_LOCALE', 'en-US')
    expect(initialLocale()).toBe('en-US')
  })
})

/**
 * vite.config.mjs decides whether VUE_APP_LOCALE is a language this build ships
 * by looking for a directory under src/lang, because a config file cannot
 * import this module. That is only a sound test if the two agree, and the way
 * they stop agreeing is the ordinary one: a language is added as a directory
 * and the LOCALES line is forgotten, or the other way round. Either half alone
 * fails quietly -- a build that accepts a language the app will not honour, or
 * a language the app offers and the build rejects.
 */
describe('LOCALES and the packs on disk', () => {
  it('name the same languages', () => {
    const packs = readdirSync(resolve(import.meta.dirname, '../../../src/lang'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)

    expect(packs.sort()).toEqual(LOCALES.map(locale => locale.value).sort())
  })
})
