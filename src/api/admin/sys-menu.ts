import request from '@/utils/request'
import type { ApiResponse, Id } from '@/types/api'
import type { SysMenu, SysMenuQuery } from '@/types/admin'

/**
 * Menu endpoints.
 *
 * GET /api/v1/menu answers with the whole tree rather than a page, so the page
 * that lists it passes `paginated: false` to useTable.
 */

export function listMenu(query?: SysMenuQuery) {
  return request<ApiResponse<SysMenu[]>>({
    url: '/api/v1/menu',
    method: 'get',
    params: query
  })
}

export function getMenu(menuId: number) {
  return request<ApiResponse<SysMenu>>({
    url: '/api/v1/menu/' + menuId,
    method: 'get'
  })
}

/** Menu tree for a role, with the entries it already holds marked. */
export function roleMenuTreeselect(roleId: number) {
  return request<ApiResponse<{ menus?: SysMenu[], checkedKeys?: number[] }>>({
    url: '/api/v1/roleMenuTreeselect/' + roleId,
    method: 'get'
  })
}

export function addMenu(data: SysMenu) {
  return request<ApiResponse<SysMenu>>({
    url: '/api/v1/menu',
    method: 'post',
    data
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updateMenu(data: SysMenu, id: number) {
  return request<ApiResponse<SysMenu>>({
    url: '/api/v1/menu/' + id,
    method: 'put',
    data
  })
}

export function delMenu(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/menu',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
