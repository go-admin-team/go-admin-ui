import request from '@/utils/request'
import type { ApiResponse, DictOption, PageQuery, PageResult, Id } from '@/types/api'
import type { SysDictType, SysDictTypeQuery } from '@/types/admin'

/** Dictionary type endpoints. */

export function listType(query: SysDictTypeQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysDictType>>>({
    url: '/api/v1/dict/type',
    method: 'get',
    params: query
  })
}

export function getType(dictId: number) {
  return request<ApiResponse<SysDictType>>({
    url: '/api/v1/dict/type/' + dictId,
    method: 'get'
  })
}

/**
 * Numbers on the wire, strings in the form.
 *
 * SysDictType.Status is an int and the DTO binds it as one, while the
 * sys_normal_disable dictionary keys on strings. Pages work in strings so their
 * radio groups match the dictionary, and the conversion happens here -- it is a
 * fact about this endpoint, not something each page should re-derive.
 */
const toWire = (data: SysDictType): Omit<SysDictType, 'status'> & { status: number } => ({
  ...data,
  status: Number(data.status)
})

const toForm = (data: SysDictType): SysDictType => ({
  ...data,
  status: String(data.status ?? '2')
})

/** getType with the record already shaped for a form. */
export const getTypeForForm = async(id: number) => {
  const response = await getType(id)
  return { ...response, data: toForm(response.data) }
}

export function addType(data: SysDictType) {
  return request<ApiResponse<SysDictType>>({
    url: '/api/v1/dict/type',
    method: 'post',
    data: toWire(data)
  })
}

/** The id goes in the path, and it is `id` here rather than `dictId`. */
export function updateType(data: SysDictType) {
  return request<ApiResponse<SysDictType>>({
    url: '/api/v1/dict/type/' + data.id,
    method: 'put',
    data: toWire(data)
  })
}

export function delType(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dict/type',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

export function exportType(query: SysDictTypeQuery) {
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
