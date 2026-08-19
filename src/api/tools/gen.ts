import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'

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
/**
 * A table the generator holds a configuration for. Mirrors tools.SysTables,
 * naming the fields the list page reads; the edit page works with far more of
 * it and still goes through GenTable.
 */
export interface SysTables {
  tableId?: number
  tableName?: string
  tableComment?: string
  className?: string
  createdAt?: string
}

/**
 * A table the database actually has, read from INFORMATION_SCHEMA -- which is
 * why the timestamps are createTime and updateTime rather than createdAt.
 */
export interface DBTables {
  tableName?: string
  tableComment?: string
  engine?: string
  tableRows?: string
  tableCollation?: string
  createTime?: string
  updateTime?: string
}

/** The generator's own record, whose shape depends on the template in play. */
export type GenTable = Record<string, unknown>

/** Filters the table list accepts. */
export interface GenTableQuery {
  tableName?: string
  tableComment?: string
}

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

export function listTable(query: GenTableQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysTables>>>({
    url: '/api/v1/sys/tables/page',
    method: 'get',
    params: query
  })
}

/** Tables present in the database but not yet imported. */
export function listDbTable(query: GenTableQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<DBTables>>>({
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

/**
 * Takes one id or several: the handler reads the path segment through
 * IdsStrToIdsIntGroup, which splits on commas. Shaped as `Id[]` so useRemove
 * can call it for a row and for a selection alike.
 */
export function delTable(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys/tables/info/' + ids.map(Number).join(','),
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
