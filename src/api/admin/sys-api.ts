import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult } from '@/types/api'
import type { SysApi, SysApiQuery } from '@/types/admin'

/** Endpoints for the backend route registry shown under 接口管理. */

export function listSysApi(query: SysApiQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysApi>>>({
    url: '/api/v1/sys-api',
    method: 'get',
    params: query
  })
}

export function getSysApi(id: number) {
  return request<ApiResponse<SysApi>>({
    url: '/api/v1/sys-api/' + id,
    method: 'get'
  })
}

export function addSysApi(data: SysApi) {
  return request<ApiResponse<SysApi>>({
    url: '/api/v1/sys-api',
    method: 'post',
    data
  })
}

export function updateSysApi(data: SysApi) {
  return request<ApiResponse<SysApi>>({
    url: '/api/v1/sys-api/' + data.id,
    method: 'put',
    data
  })
}

export function delSysApi(data: { ids: number[] }) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys-api',
    method: 'delete',
    data
  })
}
