import type { ApiResponse, PageResult } from '@/types/api'

/**
 * Helpers for turning a list endpoint into picker options.
 *
 * Not endpoints themselves -- they wrap one. They live under api/ for historical
 * reasons and are registered on globalProperties in main.js as $getItems and
 * $setItems, which is how the Options API pages reach them.
 */

/** Calls a list endpoint asking for everything rather than a page. */
export function getItems<T>(
  fetch: (query: { pageSize: number }) => Promise<ApiResponse<PageResult<T>>>,
  query?: { pageSize: number }
) {
  return fetch(query || { pageSize: 10000 })
}

/**
 * Reduces a page of rows to `{ key, value }` pairs.
 *
 * Returns undefined for an empty list rather than an empty array -- callers
 * depend on that, so it is preserved rather than tidied.
 */
export function setItems<T extends Record<string, unknown>>(
  response: ApiResponse<PageResult<T>>,
  k = 'id',
  v = 'name'
): Array<{ key: string, value: string }> | undefined {
  const rows = response.data?.list
  if (!rows || rows.length === 0) return undefined
  return rows.map(row => ({
    key: String(row[k]),
    value: String(row[v])
  }))
}
