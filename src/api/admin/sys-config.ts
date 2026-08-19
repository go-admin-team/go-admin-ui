import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysConfig, SysConfigQuery } from '@/types/admin'

/** Configuration endpoints. */

export function listConfig(query: SysConfigQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysConfig>>>({
    url: '/api/v1/config',
    method: 'get',
    params: query
  })
}

export function getConfig(configId: number) {
  return request<ApiResponse<SysConfig>>({
    url: '/api/v1/config/' + configId,
    method: 'get'
  })
}

/** Looks up a single value by key -- how pages read a setting. */
export function getConfigKey(configKey: string) {
  return request<ApiResponse<{ configValue: string }>>({
    url: '/api/v1/configKey/' + configKey,
    method: 'get'
  })
}

export function addConfig(data: SysConfig) {
  return request<ApiResponse<SysConfig>>({
    url: '/api/v1/config',
    method: 'post',
    data
  })
}

/** Reads the id off the body, unlike its siblings which take it separately. */
export function updateConfig(data: SysConfig & { id?: number }) {
  return request<ApiResponse<SysConfig>>({
    url: '/api/v1/config/' + data.id,
    method: 'put',
    data
  })
}

export function delConfig(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/config',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

/** The application-wide settings block behind the 系统配置 screen. */
export function getSetConfig(query?: Record<string, unknown>) {
  return request<ApiResponse<Record<string, string>>>({
    url: '/api/v1/set-config',
    method: 'get',
    params: query
  })
}

/** One setting, as the endpoint's body element. */
export interface SetConfigEntry {
  configKey: string
  configValue: string
}

/**
 * Takes a list, not an object. Update2Set binds `[]dto.GetSetSysConfigReq`, and
 * the type here used to say Record<string, unknown> while its only caller sent
 * an array all along.
 */
export function updateSetConfig(data: SetConfigEntry[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/set-config',
    method: 'put',
    data
  })
}
