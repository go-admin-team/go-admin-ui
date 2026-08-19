import type { Page, Route } from '@playwright/test'

/**
 * Mocks one CRUD resource.
 *
 * Two things this exists to fix, both of which showed up once five pages shared
 * a single install function.
 *
 * The routes are RegExps, not globs. A glob like `**\/api\/v1\/config*` also
 * matches `/api/v1/configKey/...`, so resources that share a prefix -- config
 * and configKey, role and roleMenuTreeselect, dept and deptTree -- collided, and
 * the only thing keeping them apart was registration order, since Playwright
 * matches in reverse. That made every new resource's correctness depend on where
 * it sat relative to every earlier one. An anchored RegExp cannot bleed, so
 * order stops mattering.
 *
 * The counters are per resource. One flat object across all of them was already
 * thirty fields at five pages, with names like postUpdate and updatePost only a
 * typo apart.
 */

export interface CrudCalls {
  list: number
  create: number
  update: number
  remove: number
  /** Query string of each list request, in order. */
  listQueries: string[]
}

export interface CrudOptions<TRow> {
  /** Path segment after /api/v1 -- 'post', 'sys-user', 'dict/type'. */
  base: string
  rows: TRow[]
  idKey: keyof TRow & string
  /**
   * Answer the list with `{ list, count }`. Turn off for the endpoints that
   * return the whole collection as the body -- the department and menu trees.
   */
  paginated?: boolean
  /**
   * Field holding nested rows, for a tree resource. The detail lookup walks it,
   * so a request for a child finds the child rather than falling back to the
   * first root -- which is silent, and looks like the endpoint working.
   */
  childrenKey?: keyof TRow & string
  /** Shape the detail response, e.g. to add fields the list omits. */
  detail?: (row: TRow) => unknown
  /** Milliseconds to hold a write open, so a test can submit again mid-flight. */
  delays?: { write?: number }
}

export const json = (body: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body)
})

/** Escapes a base that contains a slash, e.g. 'dict/type'. */
const escape = (base: string) => base.replace(/[/\-]/g, '\\$&')

export async function mockCrud<TRow extends Record<string, unknown>>(
  page: Page,
  options: CrudOptions<TRow>
): Promise<CrudCalls> {
  const { base, rows, idKey, paginated = true, childrenKey, detail, delays = {}} = options

  const calls: CrudCalls = { list: 0, create: 0, update: 0, remove: 0, listQueries: [] }

  const body = () => paginated
    ? { code: 200, data: { list: rows, count: rows.length }}
    : { code: 200, data: rows }

  const hold = async() => {
    if (delays.write) await new Promise(resolve => setTimeout(resolve, delays.write))
  }

  // The collection: /api/v1/<base>, with or without a query string
  await page.route(new RegExp(`/api/v1/${escape(base)}(\\?|$)`), async(route: Route) => {
    const method = route.request().method()
    if (method === 'GET') {
      calls.list++
      calls.listQueries.push(new URL(route.request().url()).search)
      await route.fulfill(json(body()))
      return
    }
    if (method === 'POST') calls.create++
    if (method === 'PUT') calls.update++
    if (method === 'DELETE') calls.remove++
    await hold()
    await route.fulfill(json({ code: 200, msg: 'ok' }))
  })

  // One record: /api/v1/<base>/<id>
  await page.route(new RegExp(`/api/v1/${escape(base)}/([^/?]+)(\\?|$)`), async(route: Route) => {
    if (route.request().method() === 'PUT') {
      calls.update++
      await hold()
      await route.fulfill(json({ code: 200, msg: 'ok' }))
      return
    }
    const id = route.request().url().split('?')[0].split('/').pop()
    const flatten = (list: TRow[]): TRow[] => list.flatMap(r =>
      childrenKey ? [r, ...flatten((r[childrenKey] as TRow[]) ?? [])] : [r]
    )
    const row = flatten(rows).find(r => String(r[idKey]) === id) ?? rows[0]
    await route.fulfill(json({ code: 200, data: detail ? detail(row) : row }))
  })

  return calls
}

/**
 * Records the bodies a page sends, without taking over the response.
 *
 * A mock that only counts calls cannot tell a working write from a silent
 * no-op -- that is how a page keyed on a field the endpoint never sends passed
 * its delete test. Register it after installApiMocks so it wins (routes match
 * in reverse registration order); it falls through to whatever mock answers.
 */
export async function captureBodies(
  page: Page,
  url: string | RegExp,
  method: 'POST' | 'PUT' | 'DELETE'
): Promise<string[]> {
  const bodies: string[] = []
  await page.route(url, async(route: Route) => {
    if (route.request().method() === method) bodies.push(route.request().postData() ?? '')
    await route.fallback()
  })
  return bodies
}
