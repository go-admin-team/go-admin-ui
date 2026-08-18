/**
 * Shapes the backend returns, and what utils/request hands back after the
 * interceptor has run.
 *
 * READ THIS BEFORE WRITING A CALLER. The response interceptor in
 * utils/request.js unwraps the axios envelope and rejects on any code other
 * than 200, after showing an ElMessage itself. Two consequences follow, and
 * most of the existing pages get both of them wrong:
 *
 *   1. A resolved response ALWAYS means code === 200. The `if (res.code === 200)`
 *      checks scattered through the views are dead branches -- their `else` can
 *      never run.
 *   2. A failed call arrives as a rejection that has ALREADY been reported to
 *      the user. Callers must catch it to restore their own state (loading,
 *      submitting), but must not show a second message. Such errors carry
 *      `reported: true`, so a catch block that also handles client-side
 *      failures can tell which of the two it is holding.
 *
 * The composables in src/composables encode both rules so pages do not have to,
 * and tests/unit/utils/request.spec.ts pins them.
 */

/** Envelope every endpoint responds with. */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

/**
 * Body of a paginated list response.
 *
 * `count` is the total row count across all pages, not the length of `list`.
 * The name comes from the Go side and is kept as-is.
 */
export interface PageResult<T> {
  list: T[]
  count: number
  pageIndex?: number
  pageSize?: number
}

/**
 * A primary key. Every table in this schema keys on an integer, but a few
 * endpoints echo it back as a string, so both are accepted.
 */
export type Id = string | number

/** Paging parameters every list endpoint accepts. */
export interface PageQuery {
  pageIndex: number
  pageSize: number
}

/** A list endpoint: takes a query object, resolves to a page of rows. */
export type ListApi<TRow, TQuery = Record<string, unknown>> = (
  query: TQuery & PageQuery
) => Promise<ApiResponse<PageResult<TRow>>>

/** An option as returned by the dictionary endpoints. */
export interface DictOption {
  label: string
  value: string
  [key: string]: unknown
}
