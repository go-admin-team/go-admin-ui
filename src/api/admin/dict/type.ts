import request from '@/utils/request'
import type { ApiResponse, DictOption, PageQuery, PageResult, Id } from '@/types/api'
import type { DictType, DictTypeQuery } from '@/types/admin'

/** Dictionary type endpoints. */

export function listType(query: DictTypeQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<DictType>>>({
    url: '/api/v1/dict/type',
    method: 'get',
    params: query
  })
}

export function getType(dictId: number) {
  return request<ApiResponse<DictType>>({
    url: '/api/v1/dict/type/' + dictId,
    method: 'get'
  })
}

export function addType(data: DictType) {
  return request<ApiResponse<DictType>>({
    url: '/api/v1/dict/type',
    method: 'post',
    data
  })
}

/** Reads the id off the body, and it is `id` here rather than `dictId`. */
export function updateType(data: DictType & { id?: number }) {
  return request<ApiResponse<DictType>>({
    url: '/api/v1/dict/type/' + data.id,
    method: 'put',
    data
  })
}

export function delType(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dict/type',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

export function exportType(query: DictTypeQuery) {
  return request<ApiResponse<{ path?: string }>>({
    url: '/api/v1/dict/type/export',
    method: 'get',
    params: query
  })
}

/** Every dictionary type as label/value pairs, for a picker. */
export function optionselect() {
  return request<ApiResponse<DictOption[]>>({
    url: '/api/v1/dict/type-option-select',
    method: 'get'
  })
}
