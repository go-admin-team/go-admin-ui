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

/**
 * Skipping keeps a UI-only checkout building; --require-models turns the skip
 * into a failure, which is what CI passes. Without it a broken checkout step
 * would leave this job green while it checked nothing at all.
 */
const required = process.argv.includes('--require-models')

if (!existsSync(join(GO, 'app/admin/models'))) {
  const where = `no Go repository at ${GO} (set GO_ADMIN_PATH to point at one)`
  if (required) {
    console.error(`cannot check the api contract: ${where}`)
    process.exit(1)
  }
  console.log(`skipped: ${where}`)
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
    if (embedded) {
      structs[current].push(['@embed', embedded[1].split('.').pop()])
    }
  }
  return structs
}

const goFiles = dir => readdirSync(dir).filter(f => f.endsWith('.go')).map(f => join(dir, f))

const MODEL_DIRS = [
  'common/models',
  'app/admin/models',
  'app/demo/models', // the reference module
  'app/jobs/models', // scheduled jobs
  'app/other/models/tools' // the code generator's own tables
]

const structs = {}
for (const dir of MODEL_DIRS) {
  const path = join(GO, dir)
  if (!existsSync(path)) continue
  for (const file of goFiles(path)) {
    for (const [name, fields] of Object.entries(parseStructs(readFileSync(file, 'utf8')))) {
      // First directory wins: common/models holds the embedded bases
      if (!(name in structs)) structs[name] = fields
    }
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
  for (const dir of DTO_DIRS) {
    const path = join(GO, dir, dtoFile)
    if (existsSync(path)) {
      return new Set([...readFileSync(path, 'utf8').matchAll(/form:"(\w+)"/g)].map(m => m[1]))
    }
  }
  return null
}

// ── What the front end claims ─────────────────────────────────────

/**
 * Frontend model name -> Go struct, for the few that cannot be matched by name.
 * Everything else is derived from the `useTable<Model, Query>` the page already
 * declares, so a page joining the composable layer is covered without anyone
 * remembering to add it here.
 */
const MODEL_ALIASES = {
  ConfigRow: 'SysConfig', // a local intersection type in sys-config
  Product: 'DemoProduct' // the demo module names its struct after its table
}

/** Where a resource's DTO may live. */
const DTO_DIRS = [
  'app/admin/service/dto',
  'app/demo/service/dto',
  'app/jobs/service/dto',
  'app/other/service/dto'
]

const snakeCase = name => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()

/** Every .vue under src/views, recursively. */
const vueFiles = function * (dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield * vueFiles(path)
    else if (entry.name.endsWith('.vue')) yield path
  }
}

/** Derives page -> model from the useTable generic each migrated page states. */
const migratedPages = () => {
  const found = {}
  for (const path of vueFiles(join(UI, 'src/views'))) {
    const text = readFileSync(path, 'utf8')
    const declared = text.match(/useTable<\s*(\w+)\s*,/)
    if (!declared) continue
    const name = declared[1]
    found[path.slice(join(UI, 'src/views').length + 1)] = MODEL_ALIASES[name] ?? name
  }
  return found
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
  'dev-tools/gen/editTable.vue': ['SysTables', 'SysColumns'],
  'dev-tools/gen/genInfoForm.vue': ['SysTables'],
  'dev-tools/gen/basicInfoForm.vue': ['SysTables']
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

/**
 * Fields a type may declare that its Go struct does not, with the reason.
 *
 * Keep this short. Every entry is a place the front end and the server disagree
 * on purpose, and an entry added to silence the check rather than to record a
 * decision is how the check stops being worth running.
 */
const TYPE_EXCEPTIONS = {
  // The list endpoint answers with the tree nested under each node
  '*': ['children'],
  // Tagged `json:"-"` on the model: the create form sends it, nothing reads it
  // back, and this check only compares against what Go serialises out
  // Tagged `json:"-"` on the model: the create form sends it, nothing reads it
  // back, and this check only compares against what Go serialises out
  SysUser: ['password', 'postIds', 'roleIds'],
  // Assembled by the page from two endpoints, never sent by either
  SysMenu: ['apis', 'sysApi'],
  SysRole: ['menuIds', 'deptIds']
}

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

const PAGES = migratedPages()

for (const [page, model] of Object.entries(PAGES)) {
  const text = readFileSync(join(UI, 'src/views', page), 'utf8')
  const fields = fieldsOf(model)
  if (!Object.keys(fields).length) {
    // Loud rather than silently uncovered: either the struct moved, or the page
    // names its rows something new and MODEL_ALIASES needs an entry.
    problems.push(`${page}\n    useTable declares ${model}, which matches no Go struct`)
    continue
  }

  note(`${page} -> ${model}`, 'read but not on the model',
    [...rowFieldsIn(text)].filter(k => !(k in fields) && !ALLOWED.has(k)))

  const accepted = formTagsOf(`${snakeCase(model)}.go`)
  if (!accepted) continue // no DTO for this resource; the row check still ran

  const sent = new Set([...text.matchAll(/\btable\.query\.(\w+)/g)].map(m => m[1]))
  const defaults = text.match(/defaultQuery:\s*\(\)\s*=>\s*\(\{(.*?)\}\)/s)
  if (defaults) for (const m of defaults[1].matchAll(/(\w+):/g)) sent.add(m[1])
  const sort = text.match(/defaultSort:\s*\{\s*prop:\s*'(\w+)'/)
  if (sort) sent.add(`${sort[1]}Order`)

  note(`${page} -> ${snakeCase(model)}.go`, 'sent but not bound by the DTO',
    [...sent].filter(k => !accepted.has(k) && !ALLOWED.has(k)))
}

for (const page of Object.keys(OPTIONS_PAGES)) {
  // A page that has migrated is covered by the derived list; leaving it here too
  // means its query check silently never runs
  if (page in PAGES) problems.push(`${page}\n    migrated -- remove it from OPTIONS_PAGES`)
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

/**
 * The third direction: what src/types/admin.ts claims, against what Go sends.
 *
 * The page and fixture checks are usage heuristics -- they see a field only if
 * some page happens to read it through a name the regex recognises. Two field
 * names this round (DictType.dictId, SysJob.entryId) lived in the declarations
 * and were read as `item.dictId` in a v-for, which no heuristic here would have
 * caught. Comparing the declarations directly is complete rather than lucky.
 *
 * Only interfaces whose name matches a Go struct are checked; the rest are
 * front-end shapes with no counterpart, and saying so is not this file's job.
 */
const declaredTypes = readFileSync(join(UI, 'src/types/admin.ts'), 'utf8')

for (const block of declaredTypes.matchAll(/export interface (\w+) \{([^}]*)\}/g)) {
  const [, name, body] = block
  const fields = fieldsOf(name)
  if (!Object.keys(fields).length) continue // no Go struct by that name

  const declared = [...body.matchAll(/^\s{2}(\w+)\??:/gm)].map(m => m[1])
  const allowed = new Set([...(TYPE_EXCEPTIONS['*'] ?? []), ...(TYPE_EXCEPTIONS[name] ?? [])])

  note(`src/types/admin.ts ${name}`, 'declared but not on the model',
    declared.filter(f => !(f in fields) && !allowed.has(f) && !ALLOWED.has(f)))
}

if (problems.length) {
  console.error(`API contract mismatch (${problems.length}):\n`)
  for (const p of problems) console.error(`  ${p}\n`)
  console.error('Each of these is a field the server never sends, never reads, or a model this cannot resolve.')
  process.exit(1)
}
console.log(
  `API contract ok: ${Object.keys(FIXTURES).length} fixtures, ` +
  `${Object.keys(PAGES).length} migrated pages, ${Object.keys(OPTIONS_PAGES).length} Options-API pages, ` +
  'and the declarations in types/admin.ts'
)
