import { describe, it, expect } from 'vitest'
import zhCN from '@/lang/zh-CN'
import enUS from '@/lang/en-US'

/**
 * The two language packs describe the same interface.
 *
 * A key present in one and missing in the other renders the fallback language
 * mid-sentence, and nothing reports it -- vue-i18n's missingWarn only fires on
 * a `t()` that actually executed, so a key on a page nobody opened in the test
 * run stays unreported. This compares the trees themselves.
 */
const flatten = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) return [prefix]
  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
}

/**
 * menu and dict are excluded, and that is not a loophole.
 *
 * Their correct shape IS asymmetric: en-US has them, zh-CN does not, because
 * Chinese falls through to the database value. Including them would report the
 * design as 57 missing keys. Their keys are checked against the backend's own
 * seed data instead -- scripts/check-i18n-data.mjs.
 */
const DATABASE_BACKED = ['menu', 'dict']

const keysOf = (pack: Record<string, unknown>) =>
  Object.entries(pack)
    .filter(([name]) => !DATABASE_BACKED.includes(name))
    .flatMap(([name, value]) => flatten(value, name))
    .sort()

describe('the language packs', () => {
  it('carry the same keys', () => {
    const zh = keysOf(zhCN as Record<string, unknown>)
    const en = keysOf(enUS as Record<string, unknown>)

    expect(en.filter(key => !zh.includes(key)), 'in en-US but not zh-CN').toEqual([])
    expect(zh.filter(key => !en.includes(key)), 'in zh-CN but not en-US').toEqual([])
  })

  it('has no blank values', () => {
    // A key that exists with an empty value passes the check above and renders
    // nothing at all -- worse than an untranslated string, because there is no
    // sign anything is missing.
    const blanks: string[] = []
    const walk = (value: unknown, path: string) => {
      if (typeof value === 'string') {
        if (value.trim() === '') blanks.push(path)
        return
      }
      if (typeof value !== 'object' || value === null) return
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        walk(child, path ? `${path}.${key}` : key)
      }
    }
    walk(zhCN, '')
    walk(enUS, '')

    expect(blanks).toEqual([])
  })

  it('ships menu and dict only in the languages that need them', () => {
    // Guards the asymmetry above from being "fixed" by someone who reads the
    // exclusion as an oversight: a zh-CN menu.ts would become a second source
    // of truth for titles the database already holds.
    expect(Object.keys(zhCN)).not.toContain('menu')
    expect(Object.keys(zhCN)).not.toContain('dict')
    expect(Object.keys(enUS)).toContain('menu')
    expect(Object.keys(enUS)).toContain('dict')
  })
})
