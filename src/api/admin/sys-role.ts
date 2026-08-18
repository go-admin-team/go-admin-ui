import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult } from '@/types/api'
import type { BackendMenu } from '@/stores/permission'
import type { DeptTreeNode, SysRole, SysRoleQuery } from '@/types/admin'

/** Role endpoints, plus the menu tree the router is built from. */

export function listRole(query: SysRoleQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysRole>>>({
    url: '/api/v1/role',
    method: 'get',
    params: query
  })
}

export function getRole(roleId: number) {
  return request<ApiResponse<SysRole>>({
    url: '/api/v1/role/' + roleId,
    method: 'get'
  })
}

export function addRole(data: SysRole) {
  return request<ApiResponse<SysRole>>({
    url: '/api/v1/role',
    method: 'post',
    data
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updateRole(data: SysRole, roleId: number) {
  return request<ApiResponse<SysRole>>({
    url: '/api/v1/role/' + roleId,
    method: 'put',
    data
  })
}

/** Sets which departments a role's holders can see. */
export function dataScope(data: SysRole) {
  return request<ApiResponse<null>>({
    url: '/api/v1/roledatascope',
    method: 'put',
    data
  })
}

export function changeRoleStatus(roleId: number, status: string) {
  return request<ApiResponse<null>>({
    url: '/api/v1/role-status',
    method: 'put',
    data: { roleId, status }
  })
}

export function delRole(data: { ids: number[] }) {
  return request<ApiResponse<null>>({
    url: '/api/v1/role',
    method: 'delete',
    data
  })
}

/** Menu tree for a role, with the entries it already holds marked. */
export function getListrole(id: number) {
  return request<ApiResponse<{ menus?: DeptTreeNode[], checkedKeys?: number[] }>>({
    url: '/api/v1/menu/role/' + id,
    method: 'get'
  })
}

/**
 * The signed-in user's menu tree.
 *
 * stores/permission turns this into the route table, so its shape is the one
 * BackendMenu describes.
 */
export function getRoutes() {
  return request<ApiResponse<BackendMenu[]>>({
    url: '/api/v1/menurole',
    method: 'get'
  })
}
