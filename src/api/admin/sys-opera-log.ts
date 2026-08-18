import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysOperaLog } from '@/types/admin'

/** Operation audit endpoints. Read and delete only. */

/** Empties the log. */
export function cleanOperlog() {
  return request<ApiResponse<null>>({
    url: '/api/v1/operlog/clean',
    method: 'delete'
  })
}

export function listSysOperlog(query: Partial<PageQuery> & Record<string, unknown>) {
  return request<ApiResponse<PageResult<SysOperaLog>>>({
    url: '/api/v1/sys-opera-log',
    method: 'get',
    params: query
  })
}

export function delSysOperlog(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys-opera-log',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
