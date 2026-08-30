import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import zhCN from '@/lang/zh-CN'
import enUS from '@/lang/en-US'

/**
 * Every key the code asks for exists, in both languages.
 *
 * The parity spec next door compares the two packs against each other, so a key
 * missing from both passes it. vue-i18n's own missingWarn only fires on a t()
 * that actually executed, so a key on a page the test run never opened goes
 * unreported. This reads the calls out of the source instead, which does not
 * depend on coverage.
 *
 * A missing key renders as the key itself -- `admin.sysUser.nickName` sitting
 * in a table header -- which is ugly but survivable. An empty string renders as
 * nothing at all, which reads as a broken page, so both are failures here.
 */
const SOURCE_DIRS = ['src/views', 'src/components', 'src/layout', 'src/utils', 'src/composables']

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.(vue|ts|js)$/.test(entry.name) ? [path] : []
  })

/**
 * Matches `t('a.b')`, `$t('a.b')` and `i18n.global.t('a.b')`.
 *
 * The `\b` is load-bearing, however decorative it looks. Without it, `t\(`
 * also matches the tail of `useDict('sys_normal_disable')` -- the `t` of
 * "useDict" followed by its paren -- and every dictionary name in the fifteen
 * list pages gets collected as a missing key. The word boundary fails between
 * `c` and `t`, so those are skipped, while `$t(` and `i18n.global.t(` still
 * match because the character before the `t` is not a word character.
 *
 * Only literal keys. A key built at runtime -- t(`dict.${type}`) -- cannot be
 * checked this way, and those go through lang/backend.ts anyway, which falls
 * back to the database value by design.
 */
const CALL = /(?:\$|\bi18n\.global\.)?\bt\(\s*['"]([a-zA-Z][\w.]*)['"]/g

const usedKeys = (): Map<string, string> => {
  const found = new Map<string, string>()
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(dir)) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(CALL)) {
        if (!found.has(match[1])) found.set(match[1], file)
      }
    }
  }
  return found
}

const resolve = (pack: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>(
    (node, part) =>
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined,
    pack
  )

describe('the keys the code asks for', () => {
  const keys = usedKeys()

  it('finds calls to check, so this cannot pass vacuously', () => {
    // If the regex stops matching -- a refactor to a different helper name, say
    // -- every assertion below would pass while checking nothing.
    expect(keys.size).toBeGreaterThan(150)
  })

  for (const [language, pack] of [['zh-CN', zhCN], ['en-US', enUS]] as const) {
    it(`all resolve to a non-empty string in ${language}`, () => {
      const broken: string[] = []
      for (const [key, file] of keys) {
        const value = resolve(pack, key)
        if (typeof value !== 'string' || value === '') {
          broken.push(`${key} (${file}) -> ${JSON.stringify(value)}`)
        }
      }
      expect(broken).toEqual([])
    })
  }
})
