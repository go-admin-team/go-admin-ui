import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysLoginLog, SysLoginLogQuery } from '@/types/admin'

/** Login audit endpoints. Read and delete only -- nothing writes these. */

export function listSysLoginlog(query: SysLoginLogQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysLoginLog>>>({
    url: '/api/v1/sys-login-log',
    method: 'get',
    params: query
  })
}

export function getSysLoginlog(id: number) {
  return request<ApiResponse<SysLoginLog>>({
    url: '/api/v1/sys-login-log/' + id,
    method: 'get'
  })
}

export function delSysLoginlog(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys-login-log',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
