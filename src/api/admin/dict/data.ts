import request from '@/utils/request'
import type { ApiResponse, DictOption, PageQuery, PageResult, Id } from '@/types/api'
import type { DictData, DictDataQuery } from '@/types/admin'

/** Dictionary entry endpoints. */

/** dictType is repeated in the path because the endpoint reads it from there. */
export function listData(query: DictDataQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<DictData>>>({
    url: '/api/v1/dict/data?dictType=' + query.dictType,
    method: 'get',
    params: query
  })
}

export function getData(dictCode: number) {
  return request<ApiResponse<DictData>>({
    url: '/api/v1/dict/data/' + dictCode,
    method: 'get'
  })
}

/** The label/value pairs a dictionary offers. Cached by useDict. */
export function getDicts(dictType: string) {
  return request<ApiResponse<DictOption[]>>({
    url: '/api/v1/dict-data/option-select?dictType=' + dictType,
    method: 'get'
  })
}

export function addData(data: DictData) {
  return request<ApiResponse<DictData>>({
    url: '/api/v1/dict/data',
    method: 'post',
    data
  })
}

export function updateData(data: DictData) {
  return request<ApiResponse<DictData>>({
    url: '/api/v1/dict/data/' + data.dictCode,
    method: 'put',
    data
  })
}

export function delData(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dict/data',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

export function exportData(query: DictDataQuery) {
  return request<ApiResponse<{ path?: string }>>({
    url: '/api/v1/dict/data/export',
    method: 'get',
    params: query
  })
}
