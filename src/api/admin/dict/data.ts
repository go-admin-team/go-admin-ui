import request from '@/utils/request'
import type { ApiResponse, DictOption, PageQuery, PageResult, Id } from '@/types/api'
import type { SysDictData, SysDictDataQuery } from '@/types/admin'
import { statusToWire, statusToForm } from '@/api/status'

/** Dictionary entry endpoints. */

/**
 * dictType used to be spliced into the url as well as passed in params, which
 * put it in the query string twice. SysDictDataGetPageReq binds it with a
 * `form:"dictType"` tag like every other filter, so params alone is enough.
 */
export function listData(query: SysDictDataQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysDictData>>>({
    url: '/api/v1/dict/data',
    method: 'get',
    params: query
  })
}

export function getData(dictCode: number) {
  return request<ApiResponse<SysDictData>>({
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

/**
 * Numbers on the wire, strings in the form -- the same split the dict type
 * endpoints have. The write DTOs take `Status int`, the list DTO filters on
 * `Status string`, and the dictionary that labels it keys on strings.
 */
const toWire = (data: SysDictData): Omit<SysDictData, 'status'> & { status: number } => ({
  ...data,
  status: statusToWire(data.status)
})

const toForm = (data: SysDictData): SysDictData => ({
  ...data,
  status: statusToForm(data.status)
})

/** getData with the record already shaped for a form. */
export const getDataForForm = async(dictCode: number) => {
  const response = await getData(dictCode)
  return { ...response, data: toForm(response.data) }
}

export function addData(data: SysDictData) {
  return request<ApiResponse<SysDictData>>({
    url: '/api/v1/dict/data',
    method: 'post',
    data: toWire(data)
  })
}

export function updateData(data: SysDictData) {
  return request<ApiResponse<SysDictData>>({
    url: '/api/v1/dict/data/' + data.dictCode,
    method: 'put',
    data: toWire(data)
  })
}

export function delData(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dict/data',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

export function exportData(query: SysDictDataQuery) {
  return request<ApiResponse<{ path?: string }>>({
    url: '/api/v1/dict/data/export',
    method: 'get',
    params: query
  })
}
