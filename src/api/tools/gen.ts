import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult } from '@/types/api'

/**
 * Code generator endpoints.
 *
 * The generator's own shapes are wide and change with its templates, so the
 * table and column records stay loose rather than pretending to a precision the
 * backend does not hold to.
 */

/**
 * A generator table row, as the list endpoints send it.
 *
 * Left open rather than enumerated: the generator's shapes track its templates
 * and both consuming pages are still Options API with no type checking, so named
 * fields here would be guesses nothing verifies. Narrow this when those pages
 * are migrated and the real shape can be read off working code.
 */
export type GenTable = Record<string, unknown>

/**
 * What the detail endpoint answers with -- the table's own settings under
 * `info`, its columns under `list`. Not a GenTable: the detail response is
 * shaped differently from a list row, which is easy to miss because an open
 * record type would have absorbed the difference silently.
 */
export interface GenTableDetail {
  info: Record<string, unknown>
  list: Array<Record<string, unknown>>
}

export function listTable(query: Partial<PageQuery> & Record<string, unknown>) {
  return request<ApiResponse<PageResult<GenTable>>>({
    url: '/api/v1/sys/tables/page',
    method: 'get',
    params: query
  })
}

/** Tables present in the database but not yet imported. */
export function listDbTable(query: Partial<PageQuery> & Record<string, unknown>) {
  return request<ApiResponse<PageResult<GenTable>>>({
    url: '/api/v1/db/tables/page',
    method: 'get',
    params: query
  })
}

export function getGenTable(tableId: number) {
  return request<ApiResponse<GenTableDetail>>({
    url: '/api/v1/sys/tables/info/' + tableId,
    method: 'get'
  })
}

export function getGenTableInfo(tableName: string) {
  return request<ApiResponse<GenTable>>({
    url: '/api/v1/sys/tables?tableName=' + tableName,
    method: 'get'
  })
}

export function updateGenTable(data: GenTable) {
  return request<ApiResponse<GenTable>>({
    url: '/api/v1/sys/tables/info',
    method: 'put',
    data
  })
}

/** Registers database tables with the generator. */
export function importTable(data: { tables: string; [key: string]: unknown }) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys/tables/info',
    method: 'post',
    data
  })
}

/** Generated sources, keyed by template name. */
export function previewTable(tableId: number) {
  return request<ApiResponse<Record<string, string>>>({
    url: '/api/v1/gen/preview/' + tableId,
    method: 'get'
  })
}

export function delTable(tableId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys/tables/info/' + tableId,
    method: 'delete'
  })
}

/** Writes the generated sources into the project on disk. */
export function toProjectTable(tableId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/gen/toproject/' + tableId,
    method: 'get'
  })
}

export function apiToFile(tableId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/gen/apitofile/' + tableId,
    method: 'get'
  })
}

/** Same as toProjectTable, with the permission scaffolding switched on or off. */
export function toProjectTableCheckRole(tableId: number, ischeckrole: string | number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/gen/toproject/' + tableId + '?ischeckrole=' + ischeckrole,
    method: 'get'
  })
}

/** Applies the generated migration to the database. */
export function toDBTable(tableId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/gen/todb/' + tableId,
    method: 'get'
  })
}

export function getTableTree() {
  return request<ApiResponse<Array<Record<string, unknown>>>>({
    url: '/api/v1/gen/tabletree',
    method: 'get'
  })
}
