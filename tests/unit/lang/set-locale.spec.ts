import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setLocale, STORAGE_KEY } from '@/lang'

/**
 * What switching writes down, and what a pinned build must not.
 *
 * Storage is how a choice survives a reload, so it has to hold what the visitor
 * picked and nothing else. A pinned deployment calls setLocale once at boot
 * with a language nobody chose; recording that would quietly convert a build
 * flag into 200 personal preferences, and they would only surface when the flag
 * came off -- everyone still in the pinned language, switcher back on screen,
 * looking like it had been ignored.
 */
describe('setLocale', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllEnvs())

  it('remembers what the visitor picked', async() => {
    vi.stubEnv('VUE_APP_LOCALE', '')
    await setLocale('zh-CN')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('zh-CN')
  })

  it('writes nothing when the build is pinned', async() => {
    vi.stubEnv('VUE_APP_LOCALE', 'zh-CN')
    await setLocale('zh-CN')

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('leaves an earlier choice untouched when the build is pinned', async() => {
    // The pin overrides it for as long as it is set; it is not the pin's to
    // erase. Take the pin off and this visitor is back in English, which is
    // what they asked for the last time anyone asked them.
    localStorage.setItem(STORAGE_KEY, 'en-US')
    vi.stubEnv('VUE_APP_LOCALE', 'zh-CN')
    await setLocale('zh-CN')

    expect(localStorage.getItem(STORAGE_KEY)).toBe('en-US')
  })
})
