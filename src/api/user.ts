import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { UserInfo } from '@/stores/user'

/** Session endpoints. */

/**
 * The token comes back at the top of the envelope, beside `code`, not inside
 * `data` the way every other endpoint answers.
 */
export function login(data: { username: string, password: string, code?: string, uuid?: string }) {
  return request<ApiResponse<null> & { token: string }>({
    url: '/api/v1/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request<ApiResponse<null>>({
    url: '/api/v1/logout',
    method: 'post'
  })
}

/** Roles, permissions and profile for the signed-in user. */
export function getInfo() {
  return request<ApiResponse<UserInfo>>({
    url: '/api/v1/getinfo',
    method: 'get'
  })
}
