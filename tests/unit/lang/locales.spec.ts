import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  LOCALES, DEFAULT_LOCALE, STORAGE_KEY,
  isLocale, matchLocale, storedLocale, rememberLocale, initialLocale
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

  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

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
