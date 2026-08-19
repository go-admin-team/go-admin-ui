/**
 * Checks the front end's field names against the Go structs that produce them.
 *
 * Two bugs of exactly this shape shipped green: the login log keyed rows on
 * `infoId` and the department page tested `row.p_id`, neither of which any Go
 * struct declares. Both were invisible because the e2e fixtures had been written
 * from the front end's assumption rather than from the model, so the mock and
 * the page agreed with each other and disagreed with the server.
 *
 * Three directions are checked:
 *   1. fixture row keys      -> model json tags
 *   2. `row.x` / column prop -> model json tags
 *   3. query keys sent       -> DTO `form:` tags
 *
 * Needs the Go repository beside this one (or GO_ADMIN_PATH). Skips with a
 * notice when it is absent, so a UI-only checkout still installs and builds.
 *
 * Run: node scripts/check-api-contract.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const UI = join(dirname(fileURLToPath(import.meta.url)), '..')
const GO = process.env.GO_ADMIN_PATH ?? join(UI, '..', 'go-admin')

if (!existsSync(join(GO, 'app/admin/models'))) {
  console.log(`skipped: no Go repository at ${GO} (set GO_ADMIN_PATH to point at one)`)
  process.exit(0)
}

// ── Parsing the Go side ───────────────────────────────────────────

/** struct name -> [[jsonName, goType]], with embedded structs kept as markers. */
const parseStructs = source => {
  const structs = {}
  let current = null
  for (const line of source.split('\n')) {
    const open = line.match(/^type (\w+) struct \{/)
    if (open) { current = open[1]; structs[current] = []; continue }
    if (!current) continue
    if (line.startsWith('}')) { current = null; continue }

    const field = line.match(/^\s*(\w+)\s+([\w.[\]*]+)\s+`([^`]*)`/)
    if (field) {
      const tag = field[3].match(/json:"([^",]+)/)
      if (tag && tag[1] !== '-') structs[current].push([tag[1], field[2]])
      continue
    }
    const embedded = line.match(/^\s*((?:\w+\.)?\w+)\s*$/)
    if (embedded && !line.trim().startsWith('//')) {
      structs[current].push(['@embed', embedded[1].split('.').pop()])
    }
  }
  return structs
}

const goFiles = dir => readdirSync(dir).filter(f => f.endsWith('.go')).map(f => join(dir, f))

const MODEL_DIRS = [
  'common/models',
  'app/admin/models',
  'app/jobs/models', // scheduled jobs
  'app/other/models/tools' // the code generator's own tables
]

const structs = {}
for (const dir of MODEL_DIRS) {
  const path = join(GO, dir)
  if (!existsSync(path)) continue
  for (const file of goFiles(path)) {
    Object.assign(structs, parseStructs(readFileSync(file, 'utf8')), structs)
  }
}

/** Flattens a struct's own and embedded fields into jsonName -> goType. */
const fieldsOf = (name, seen = new Set()) => {
  if (seen.has(name) || !structs[name]) return {}
  seen.add(name)
  const out = {}
  for (const [json, type] of structs[name]) {
    if (json === '@embed') Object.assign(out, fieldsOf(type, seen))
    else out[json] = type
  }
  return out
}

const formTagsOf = dtoFile => {
  const path = join(GO, 'app/admin/service/dto', dtoFile)
  if (!existsSync(path)) return null
  return new Set([...readFileSync(path, 'utf8').matchAll(/form:"(\w+)"/g)].map(m => m[1]))
}

// ── What the front end claims ─────────────────────────────────────

/** page -> [model, dto file]. Add a row when a page joins the composable layer. */
const PAGES = {
  'admin/sys-user/index.vue': ['SysUser', 'sys_user.go'],
  'admin/sys-dept/index.vue': ['SysDept', 'sys_dept.go'],
  'admin/sys-menu/index.vue': ['SysMenu', 'sys_menu.go'],
  'admin/sys-role/index.vue': ['SysRole', 'sys_role.go'],
  'admin/sys-post/index.vue': ['SysPost', 'sys_post.go'],
  'admin/sys-config/index.vue': ['SysConfig', 'sys_config.go'],
  'admin/sys-login-log/index.vue': ['SysLoginLog', 'sys_login_log.go'],
  'admin/sys-oper-log/index.vue': ['SysOperaLog', 'sys_opera_log.go']
}

/**
 * Pages still on the Options API that render backend rows.
 *
 * They get the row check only: their queries go through `this.queryParams` and
 * several run through addDateRange, which attaches keys of its own -- comparing
 * those against a DTO would report noise rather than defects. Move a page into
 * PAGES when it migrates, and it picks up the query check too.
 *
 * Pages with no backend rows at all (dashboard, profile, login, error pages)
 * are deliberately absent: there is no contract to check.
 */
const OPTIONS_PAGES = {
  'admin/sys-api/index.vue': ['SysApi'],
  'admin/dict/index.vue': ['SysDictType'],
  'admin/dict/data.vue': ['SysDictData'],
  'schedule/index.vue': ['SysJob'],
  'dev-tools/gen/index.vue': ['SysTables', 'DBTables'],
  'dev-tools/gen/editTable.vue': ['SysTables', 'SysColumns'],
  'dev-tools/gen/genInfoForm.vue': ['SysTables'],
  'dev-tools/gen/basicInfoForm.vue': ['SysTables'],
  'dev-tools/gen/importTable.vue': ['DBTables']
}

/** fixture export -> model. */
const FIXTURES = {
  userRows: 'SysUser',
  deptRows: 'SysDept',
  menuRows: 'SysMenu',
  roleRows: 'SysRole',
  postRows: 'SysPost',
  configRows: 'SysConfig',
  loginLogRows: 'SysLoginLog',
  operLogRows: 'SysOperaLog'
}

/**
 * Keys the front end may use that no model declares.
 * `children` is assembled by the tree endpoints; paging is the shared request
 * struct rather than any one DTO.
 */
const ALLOWED = new Set(['children', 'pageIndex', 'pageSize'])

// ── The three comparisons ─────────────────────────────────────────

const problems = []
const note = (where, kind, keys) => {
  if (keys.length) problems.push(`${where}\n    ${kind}: ${keys.join(', ')}`)
}

/** Every field name a page reads off a row, in either API style. */
const rowFieldsIn = text => new Set([
  ...[...text.matchAll(/\b(?:scope\.row|row)\??\.(\w+)/g)].map(m => m[1]),
  ...[...text.matchAll(/<el-table-column[^>]*?\bprop="(\w+)"/gs)].map(m => m[1])
])

const fixtures = readFileSync(join(UI, 'tests/e2e/mocked/fixtures.ts'), 'utf8')

/** The bracketed body of `export const <name> = [...]`. */
const arrayBody = name => {
  const start = fixtures.indexOf(`export const ${name} = [`)
  if (start < 0) return null
  const i = fixtures.indexOf('[', start)
  let depth = 0
  for (let j = i; j < fixtures.length; j++) {
    if (fixtures[j] === '[') depth++
    else if (fixtures[j] === ']' && --depth === 0) return fixtures.slice(i, j + 1)
  }
  return null
}

for (const [name, model] of Object.entries(FIXTURES)) {
  const body = arrayBody(name)
  if (body === null) { problems.push(`fixtures.ts\n    no export named ${name}`); continue }
  const fields = fieldsOf(model)
  const keys = [...new Set([...body.matchAll(/^\s*'?(\w+)'?:/gm)].map(m => m[1]))]
  note(`fixtures.ts ${name} -> ${model}`, 'not on the model',
    keys.filter(k => !(k in fields) && !ALLOWED.has(k)))
}

for (const [page, [model, dto]] of Object.entries(PAGES)) {
  const path = join(UI, 'src/views', page)
  if (!existsSync(path)) { problems.push(`${page}\n    file not found`); continue }
  const text = readFileSync(path, 'utf8')
  const fields = fieldsOf(model)

  const read = rowFieldsIn(text)
  note(`${page} -> ${model}`, 'read but not on the model',
    [...read].filter(k => !(k in fields) && !ALLOWED.has(k)))

  const accepted = formTagsOf(dto)
  if (!accepted) { problems.push(`${page}\n    no dto file ${dto}`); continue }
  const sent = new Set([...text.matchAll(/\btable\.query\.(\w+)/g)].map(m => m[1]))
  const defaults = text.match(/defaultQuery:\s*\(\)\s*=>\s*\(\{(.*?)\}\)/s)
  if (defaults) for (const m of defaults[1].matchAll(/(\w+):/g)) sent.add(m[1])
  const sort = text.match(/defaultSort:\s*\{\s*prop:\s*'(\w+)'/)
  if (sort) sent.add(`${sort[1]}Order`)

  note(`${page} -> dto/${dto}`, 'sent but not bound by the DTO',
    [...sent].filter(k => !accepted.has(k) && !ALLOWED.has(k)))
}

for (const [page, models] of Object.entries(OPTIONS_PAGES)) {
  const path = join(UI, 'src/views', page)
  if (!existsSync(path)) { problems.push(`${page}\n    file not found`); continue }
  const known = Object.assign({}, ...models.map(m => fieldsOf(m)))
  if (!Object.keys(known).length) {
    problems.push(`${page}\n    no Go struct named ${models.join(' or ')}`); continue
  }
  note(`${page} -> ${models.join('+')}`, 'read but not on the model',
    [...rowFieldsIn(readFileSync(path, 'utf8'))].filter(k => !(k in known) && !ALLOWED.has(k)))
}

if (problems.length) {
  console.error(`API contract mismatch (${problems.length}):\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  console.error('Each of these is a field the server never sends or never reads.')
  process.exit(1)
}
console.log(
  `API contract ok: ${Object.keys(FIXTURES).length} fixtures, ` +
  `${Object.keys(PAGES).length} migrated pages, ${Object.keys(OPTIONS_PAGES).length} Options-API pages`
)
