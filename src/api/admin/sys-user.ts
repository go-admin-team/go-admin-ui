import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysUser, SysUserQuery } from '@/types/admin'

/**
 * User endpoints.
 *
 * First api/ module converted to TypeScript. The type argument on each request
 * is what lets useTable and useForm infer the row and model types instead of
 * being handed `unknown` -- see utils/request.d.ts for why the argument
 * describes the envelope rather than the payload.
 */

/** GET the user list. */
export function listUser(query: SysUserQuery & PageQuery) {
  return request<ApiResponse<PageResult<SysUser>>>({
    url: '/api/v1/sys-user',
    method: 'get',
    params: query
  })
}

/** GET one user, with the fields the list omits. */
export function getUser(userId: number) {
  return request<ApiResponse<SysUser>>({
    url: '/api/v1/sys-user/' + userId,
    method: 'get'
  })
}

export function addUser(data: SysUser) {
  return request<ApiResponse<SysUser>>({
    url: '/api/v1/sys-user',
    method: 'post',
    data
  })
}

export function updateUser(data: SysUser) {
  return request<ApiResponse<SysUser>>({
    url: '/api/v1/sys-user',
    method: 'put',
    data
  })
}

export function delUser(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sys-user',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

export function resetUserPwd(userId: number, password: string) {
  return request<ApiResponse<null>>({
    url: '/api/v1/user/pwd/reset',
    method: 'put',
    data: { userId, password }
  })
}

/** Enable or disable a user. Sends only the two fields the endpoint reads. */
export function changeUserStatus(user: Pick<SysUser, 'userId' | 'status'>) {
  return request<ApiResponse<null>>({
    url: '/api/v1/user/status',
    method: 'put',
    data: { userId: user.userId, status: user.status }
  })
}

export function updateUserProfile(data: SysUser) {
  return request<ApiResponse<SysUser>>({
    url: '/api/v1/sys-user/profile',
    method: 'put',
    data
  })
}

export function updateUserPwd(oldPassword: string, newPassword: string) {
  return request<ApiResponse<null>>({
    url: '/api/v1/user/pwd/set',
    method: 'put',
    data: { oldPassword, newPassword }
  })
}

/** Avatar upload. Must be FormData -- see the note in utils/request.js. */
export function uploadAvatar(data: FormData) {
  return request<ApiResponse<{ imgUrl?: string }>>({
    url: '/api/v1/user/avatar',
    method: 'post',
    data
  })
}

export function getUserProfile() {
  return request<ApiResponse<SysUser>>({
    url: '/api/v1/user/profile',
    method: 'get'
  })
}
