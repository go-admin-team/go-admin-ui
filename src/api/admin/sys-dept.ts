import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { DeptTreeNode, SysDept, SysDeptQuery } from '@/types/admin'

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

export function addDept(data: SysDept) {
  return request<ApiResponse<SysDept>>({
    url: '/api/v1/dept',
    method: 'post',
    data
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updateDept(data: SysDept, id: number) {
  return request<ApiResponse<SysDept>>({
    url: '/api/v1/dept/' + id,
    method: 'put',
    data
  })
}

export function delDept(data: { ids: number[] }) {
  return request<ApiResponse<null>>({
    url: '/api/v1/dept',
    method: 'delete',
    data
  })
}
