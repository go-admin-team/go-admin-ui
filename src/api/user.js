import request from '@/utils/request'

/**
 * The response interceptor unwraps axios' envelope, so these resolve with the
 * payload itself rather than an AxiosResponse. Typed here via JSDoc so callers
 * in TypeScript see the real shape; drop these once this module moves to .ts.
 *
 * @param {{ username: string, password: string, code?: string, uuid?: string }} data
 * @returns {Promise<{ token: string }>}
 */
export function login(data) {
  return request({
    url: '/api/v1/login',
    method: 'post',
    data
  })
}

/** @returns {Promise<unknown>} */
export function logout() {
  return request({
    url: '/api/v1/logout',
    method: 'post'
  })
}

/**
 * @returns {Promise<{ code: number, data?: { roles: string[], name: string,
 *   avatar: string, introduction: string, permissions: string[] } }>}
 */
export function getInfo() {
  return request({
    url: '/api/v1/getinfo',
    method: 'get'
  })
}

