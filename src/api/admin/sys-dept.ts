import request from '@/utils/request'
import type { ApiResponse, Id } from '@/types/api'
import type { DeptTreeNode, SysDept, SysDeptQuery } from '@/types/admin'
import { statusToWire, statusToForm } from '@/api/status'

/**
 * Department endpoints.
 *
 * GET /api/v1/dept answers with the whole tree, not a page -- hence
 * `ApiResponse<SysDept[]>` rather than `PageResult`, and hence the page passes
 * `paginated: false` to useTable.
 */

/** GET the department tree. Nested through each node's `children`. */
export function getDeptList(query?: SysDeptQuery) {
  return request<ApiResponse<SysDept[]>>({
    url: '/api/v1/dept',
    method: 'get',
    params: query
  })
}

export function getDept(deptId: number) {
  return request<ApiResponse<SysDept>>({
    url: '/api/v1/dept/' + deptId,
    method: 'get'
  })
}

/** Department tree shaped for a picker: `{ id, label, children }`. */
export function treeselect() {
  return request<ApiResponse<DeptTreeNode[]>>({
    url: '/api/v1/deptTree',
    method: 'get'
  })
}

/** Same shape, with the departments a role already holds marked. */
export function roleDeptTreeselect(roleId: number) {
  return request<ApiResponse<{ depts?: DeptTreeNode[], checkedKeys?: number[] }>>({
    url: '/api/v1/roleDeptTreeselect/' + roleId,
    method: 'get'
  })
}

/**
 * Numbers on the wire, strings in the form.
 *
 * The list sends `status` and `sort` as numbers, the dictionary that labels
 * status keys on strings, and the write endpoints want numbers back. Pages work
 * in strings throughout so their radio groups match the dictionary, and the
 * conversion happens here -- it is a fact about these endpoints, not something
 * each page should re-derive.
 */
const toWire = (data: SysDept): SysDept => ({
  ...data,
  status: statusToWire(data.status),
  sort: Number(data.sort)
})

const toForm = (data: SysDept): SysDept => ({
  ...data,
  status: statusToForm(data.status),
  sort: String(data.sort ?? 0)
})

/** getDept with the record already shaped for a form. */
export const getDeptForForm = async(deptId: number) => {
  const response = await getDept(deptId)
  return { ...response, data: toForm(response.data) }
}

export function addDept(data: SysDept) {
  return request<ApiResponse<SysDept>>({
    url: '/api/v1/dept',
    method: 'post',
    data: toWire(data)
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updateDept(data: SysDept, id: number) {
  return request<ApiResponse<SysDept>>({
    url: '/api/v1/dept/' + id,
    method: 'put',
    data: toWire(data)
  })
}

export function delDept(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dept',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
