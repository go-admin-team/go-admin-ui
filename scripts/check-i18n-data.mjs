/**
 * Checks the menu and dictionary language packs against the backend's seed data.
 *
 * These two files are the only ones whose keys are not chosen by this
 * repository: they are `sys_menu.menu_name` and `dict_type`/`dict_value` as the
 * Go project seeds them. A typo in a key is invisible at runtime -- the lookup
 * misses and the interface falls back to Chinese, which is also what a menu the
 * user created does, so nothing looks wrong.
 *
 * tests/unit/lang/parity.spec.ts deliberately skips these files because their
 * correct shape is asymmetric (en-US has them, zh-CN does not). This is the
 * check that covers them instead.
 *
 * A key with no row behind it is an error: it is either a typo or a menu the
 * backend dropped. A row with no key is only a notice -- that is an
 * untranslated menu, which the fallback handles, and it is the normal state
 * while a new language is being filled in.
 *
 * Needs the Go repository beside this one (or GO_ADMIN_PATH), and skips without
 * it so a UI-only checkout still builds. --require-seed turns the skip into a
 * failure, which is what CI passes.
 *
 * Run: node scripts/check-i18n-data.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const UI = join(dirname(fileURLToPath(import.meta.url)), '..')
const GO = process.env.GO_ADMIN_PATH ?? join(UI, '..', 'go-admin')
const SEED = join(GO, 'config/db.sql')

const required = process.argv.includes('--require-seed')

if (!existsSync(SEED)) {
  const where = `no seed data at ${SEED} (set GO_ADMIN_PATH to point at the Go repository)`
  if (required) {
    console.error(`cannot check the i18n data: ${where}`)
    process.exit(1)
  }
  console.log(`skipped: ${where}`)
  process.exit(0)
}

// ── The SQL side ──────────────────────────────────────────────────

/** Splits one VALUES tuple, respecting quoted strings and doubled quotes. */
const splitTuple = row => {
  const values = []
  let current = ''
  let quoted = false
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    if (quoted) {
      if (char === "'" && row[i + 1] === "'") { current += "'"; i++; continue }
      if (char === "'") { quoted = false; continue }
      current += char
      continue
    }
    if (char === "'") { quoted = true; continue }
    if (char === ',') { values.push(current.trim()); current = ''; continue }
    current += char
  }
  values.push(current.trim())
  return values
}

const sql = readFileSync(SEED, 'utf8')

/**
 * The `(?![\w])` matters: without it `sys_menu` also matches the 67
 * `sys_menu_api_rule` inserts, which have two columns and would be read as
 * menus with no name.
 */
const rowsOf = table => [
  ...sql.matchAll(new RegExp(
    String.raw`INSERT INTO [\`"]?${table}[\`"]?(?![\w])[^(]*VALUES\s*\((.*?)\);`, 'gis'
  ))
].map(match => splitTuple(match[1]))

// Column order is positional in these inserts; the indexes are the seed's own.
const MENU_NAME = 1; const MENU_TITLE = 2; const MENU_TYPE = 6
const DICT_LABEL = 2; const DICT_VALUE = 3; const DICT_TYPE = 4
const TYPE_NAME = 1; const TYPE_KEY = 2

// menu_type 'F' is a button: a permission point that never renders a title.
const menus = rowsOf('sys_menu').filter(row => row[MENU_TYPE] !== 'F')
const dictData = rowsOf('sys_dict_data')
const dictTypes = rowsOf('sys_dict_type')

if (!menus.length || !dictData.length || !dictTypes.length) {
  console.error('parsed no rows out of db.sql -- the insert format has changed, and this check would pass vacuously')
  process.exit(1)
}

// ── The language-pack side ────────────────────────────────────────

/**
 * Loads a language pack by transpiling it, not by regex.
 *
 * Regex would be lighter, but the thing this script exists to catch is a key
 * that does not match the database -- and a key written in a shape the regex
 * did not anticipate would simply not be seen, which fails in the same
 * direction as the bug. typescript is already a dependency of this repository.
 */
const load = async path => {
  const source = readFileSync(path, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  })
  const module = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  return module.default
}

// Every language except the default, which falls through to the database.
const LANG_DIR = join(UI, 'src/lang')
const languages = readdirSync(LANG_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(LANG_DIR, entry.name, 'menu.ts')))
  .map(entry => entry.name)

if (!languages.length) {
  console.error('found no language with a menu.ts -- this check would pass vacuously')
  process.exit(1)
}

let failed = false

for (const language of languages) {
  const menu = await load(join(LANG_DIR, language, 'menu.ts'))
  const dict = await load(join(LANG_DIR, language, 'dict.ts'))

  const report = (label, keys, rows, describe) => {
    const known = new Set(rows.map(describe))
    const unknown = keys.filter(key => !known.has(key))
    const untranslated = [...known].filter(key => !keys.includes(key))

    if (unknown.length) {
      failed = true
      console.error(`${language}/${label}: ${unknown.length} key(s) with no row in db.sql -- ${unknown.join(', ')}`)
    }
    if (untranslated.length) {
      console.log(`${language}/${label}: ${untranslated.length} untranslated, falls back to Chinese -- ${untranslated.join(', ')}`)
    }
    if (!unknown.length && !untranslated.length) {
      console.log(`${language}/${label}: ${keys.length} key(s), all matched`)
    }
  }

  report('menu', Object.keys(menu), menus, row => row[MENU_NAME])
  report('dict.types', Object.keys(dict.types ?? {}), dictTypes, row => row[TYPE_KEY])
  report(
    'dict.values',
    Object.entries(dict.values ?? {}).flatMap(([type, values]) =>
      Object.keys(values).map(value => `${type}.${value}`)),
    dictData,
    row => `${row[DICT_TYPE]}.${row[DICT_VALUE]}`
  )

  /**
   * A translation identical to the Chinese is almost always a copy-paste that
   * was never translated -- the fallback would have produced it for free.
   *
   * A notice rather than an error: ScheduleManage's stored title really is the
   * English word "Schedule", so an entry here can be legitimately equal. See
   * 术语表.md.
   */
  const echoes = [
    ...menus
      .filter(row => menu[row[MENU_NAME]] === row[MENU_TITLE])
      .map(row => `menu.${row[MENU_NAME]}`),
    ...dictTypes
      .filter(row => dict.types?.[row[TYPE_KEY]] === row[TYPE_NAME])
      .map(row => `dict.types.${row[TYPE_KEY]}`),
    ...dictData
      .filter(row => dict.values?.[row[DICT_TYPE]]?.[row[DICT_VALUE]] === row[DICT_LABEL])
      .map(row => `dict.values.${row[DICT_TYPE]}.${row[DICT_VALUE]}`)
  ]
  if (echoes.length) {
    console.log(`${language}: ${echoes.length} translation(s) identical to the Chinese -- ${echoes.join(', ')}`)
  }
}

process.exit(failed ? 1 : 0)
