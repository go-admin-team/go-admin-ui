import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'
// No component instance here, so the global composer is the way in; it is a
// Composition-mode instance, so t() stays reactive to a language switch.
import { i18n } from '@/lang'
import type { ApiResponse } from '@/types/api'

/**
 * The HTTP client, and the contract every caller is written against:
 *
 *   1. A resolved response ALWAYS means code === 200. Every other code rejects.
 *   2. A rejection carrying `reported: true` has already been shown to the user
 *      by this file. Callers catch it to restore their own state, but must not
 *      show a second message.
 *
 * See src/types/api.ts, which the composables and the api modules build on.
 */

/** An error this file has already put in front of the user. */
export interface ReportedError extends Error {
  reported?: true
}

const reported = <E extends Error>(error: E): E & { reported: true } =>
  Object.assign(error, { reported: true as const })

/**
 * Narrows what a `catch` binding holds.
 *
 * TypeScript types a caught value as `unknown`, correctly -- anything can be
 * thrown. Everything this application catches comes from the interceptor above
 * and is an Error, but a stray throw would not be, so this keeps a message
 * either way rather than asserting.
 */
export const asReportedError = (error: unknown): ReportedError =>
  error instanceof Error ? error : new Error(String(error))

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000
})

service.interceptors.request.use(
  config => {
    if (useUserStore().token) {
      config.headers['Authorization'] = 'Bearer ' + getToken()

      // FormData 必须跳过：axios 的 transformRequest 见到 application/json
      // 会把 FormData 序列化成 JSON，文件字段变成字符串 "null"，请求体只剩
      // 十几字节，文件根本到不了服务端。跳过后 axios 会清空该头，由浏览器
      // 自行写入带 boundary 的 multipart/form-data。
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
    }
    return config
  },
  (error: AxiosError) => {
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

/** Offers the user a way back to the login page, then reloads. */
const promptRelogin = () => {
  useUserStore().resetToken()
  ElMessageBox.confirm(
    i18n.global.t('common.sessionExpiredPrompt'),
    i18n.global.t('common.systemNotice'),
    {
      confirmButtonText: i18n.global.t('common.relogin'),
      cancelButtonText: i18n.global.t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    location.reload() // 为了重新实例化vue-router对象 避免bug
  })
}

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, msg } = response.data

    if (code === 401) {
      if (location.href.indexOf('login') !== -1) {
        useUserStore().resetToken()
        location.reload() // 为了重新实例化vue-router对象 避免bug
      } else {
        promptRelogin()
      }
      return Promise.reject(reported(new Error('Unauthorized')))
    }

    if (code === 6401) {
      promptRelogin()
      return Promise.reject(reported(new Error(i18n.global.t('common.sessionExpired'))))
    }

    if (code !== 200) {
      ElMessage({
        message: msg,
        type: 'error',
        // 400/403 carry a message worth reading twice as long
        duration: code === 400 || code === 403 ? 5 * 1000 : 3 * 1000
      })
      return Promise.reject(reported(new Error(msg || 'error')))
    }

    // The one place the axios contract is deliberately bent: callers receive the
    // `{ code, data, msg }` envelope, not the AxiosResponse wrapping it. The cast
    // lives here, next to the line that does it, rather than in a parallel .d.ts
    // that could drift out of step with this file -- which it had.
    return response.data as unknown as AxiosResponse
  },
  (error: AxiosError) => {
    const message = error.message === 'Network Error'
      ? i18n.global.t('common.networkError')
      : error.message

    if (error.message !== 'Network Error') {
      console.log('err' + error) // for debug
    }

    ElMessage({ message, type: 'error', duration: 5 * 1000 })
    return Promise.reject(reported(error))
  }
)

/**
 * Issues a request and resolves with the response envelope.
 *
 * Typed as the payload rather than as AxiosResponse because that is what the
 * interceptor above hands back. The type argument describes the envelope:
 *
 *   request<ApiResponse<PageResult<SysUser>>>({ url, method: 'get', params })
 *
 * Only this call form is exposed. `service.get(...)` and friends would be
 * unwrapped the same way but nothing uses them, and leaving them off keeps one
 * shape for the api modules to follow.
 */
const request = <T = unknown>(config: AxiosRequestConfig): Promise<T> =>
  service.request(config) as unknown as Promise<T>

export default request
