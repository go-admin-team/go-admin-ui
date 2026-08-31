import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Interface copy that is still a Chinese literal in the source.
 *
 * AGENTS.md says new code does not write Chinese literals, and until now
 * nothing enforced it: the migration was driven off a list of pages under
 * src/views, so anything outside that list was never looked at. That is how
 * importTable.vue -- thirteen literals, no useI18n, opened from an
 * already-migrated page -- survived four batches, and how the form designer
 * under src/utils/generator is still entirely untranslated.
 *
 * This is a ratchet, not a gate. The remaining files are listed with their
 * current counts, so the suite fails on a file that grows, on a new file that
 * appears, and on a file cleared without being removed from the list. Bringing
 * a number down means editing it here, which is the point: the number only ever
 * moves deliberately.
 */
const SOURCE_DIRS = ['src']

/** Language packs are Chinese by definition; so is the seed data they check. */
const EXCLUDED = [/^src\/lang\//]

/**
 * Files that still hold Chinese, and how many lines of it.
 *
 * A count rather than a boolean so that adding to an untranslated file is a
 * failure too -- the debt is allowed to stay, not to grow. Notes say what the
 * Chinese is, because "9 lines in utils/index.js" is not something anyone will
 * want to re-derive.
 */
const KNOWN: Record<string, number> = {
  // The form designer, which no batch has touched: the largest piece of
  // untranslated interface left, and what dev-tools/build renders.
  'src/utils/generator/config.js': 40,
  'src/utils/generator/html.js': 11,
  'src/utils/generator/js.js': 4,
  'src/utils/generator/drawingDefalut.js': 3,
  'src/utils/generator/render.js': 1,
  'src/components/FormGenParser/Parser.vue': 5,
  'src/components/FormGenRender/slots/el-upload.js': 1,

  // Ships its own utils/language.js and was always meant to be configurable --
  // wiring that file to the language pack is the whole job.
  'src/components/ImageCropper/utils/language.js': 36,
  'src/components/ImageCropper/index.vue': 20,
  'src/components/ImageCropper/utils/effectRipple.js': 3,

  // Weekday names -- date localisation rather than copy.
  'src/utils/index.js': 9,
  'src/utils/costum.js': 1,

  // The application title, which ends up in the browser tab.
  'src/settings.js': 1,
  'src/utils/get-page-title.js': 1,

  // Fallback titles for the fixed routes. Both already carry a titleKey, so
  // these render only when the pack is missing the key.
  'src/router/index.js': 3,
  'src/components/Breadcrumb/index.vue': 2,

  // Not user-facing: a console banner, a developer-facing throw, and comments
  // the stripper below does not reach (see its note).
  'src/main.js': 4,
  'src/directive/permission/permisaction.js': 1,
  'src/directive/waves/waves.js': 3,
  'src/utils/request.ts': 2,

  // Trailing `//` comments, mostly: SCSS design notes on the login page and
  // Chinese notes after code elsewhere. Overcounted rather than missed, which
  // is the safe direction for a ratchet.
  'src/views/login/index.vue': 11,
  'src/views/profile/userAvatar.vue': 5,
  'src/layout/components/Settings/index.vue': 2,
  'src/components/Share/DropdownMenu.vue': 1
}

const CJK = /[一-鿿]/

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return walk(path)
    return /\.(vue|ts|js)$/.test(entry.name) ? [path] : []
  })

/**
 * Comments removed before counting.
 *
 * Not optional: this repository comments heavily and in Chinese in places, and
 * the login page's forty lines of design notes would otherwise put a fully
 * translated page at the top of the list. Order matters -- block comments go
 * first, so a `//` inside one is not mistaken for a line comment.
 */
const stripComments = (source: string): string => source
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

const chineseLines = (file: string): number =>
  stripComments(readFileSync(file, 'utf8'))
    .split('\n')
    .filter(line => CJK.test(line))
    .length

const scan = (): Map<string, number> => {
  const found = new Map<string, number>()
  for (const dir of SOURCE_DIRS) {
    for (const file of walk(dir)) {
      if (EXCLUDED.some(pattern => pattern.test(file))) continue
      const count = chineseLines(file)
      if (count > 0) found.set(file, count)
    }
  }
  return found
}

describe('Chinese literals outside the language packs', () => {
  it('does not appear in a file that had none', () => {
    const unexpected = [...scan().keys()].filter(file => !(file in KNOWN))
    expect(unexpected, 'new Chinese literals -- read them from the language pack instead').toEqual([])
  })

  it('does not grow in a file that has some', () => {
    const grown = [...scan()]
      .filter(([file, count]) => file in KNOWN && count > KNOWN[file])
      .map(([file, count]) => `${file}: ${KNOWN[file]} -> ${count}`)
    expect(grown, 'existing debt grew').toEqual([])
  })

  it('lists no file that is already clean', () => {
    // Keeps the list honest: a file cleared but left here would go on claiming
    // debt that no longer exists, and the next reader would go looking for it.
    const found = scan()
    const stale = Object.keys(KNOWN).filter(file => !found.has(file))
    expect(stale, 'listed as untranslated but is clean -- remove the entry').toEqual([])
  })

  it('reports the total, so the number is visible in review', () => {
    const total = [...scan().values()].reduce((sum, n) => sum + n, 0)
    expect(total).toBe(Object.values(KNOWN).reduce((sum, n) => sum + n, 0))
  })
})
