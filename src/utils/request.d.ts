import type { AxiosRequestConfig } from 'axios'

/**
 * The true signature of utils/request.js.
 *
 * The module exports an axios instance, so without this declaration TypeScript
 * infers `Promise<AxiosResponse<T>>` and every caller has to reach through a
 * `.data` that is not there. The response interceptor returns `response.data`,
 * so what actually resolves is the `{ code, data, msg }` envelope -- and only
 * when `code === 200`, since every other code is rejected.
 *
 * Declare the payload as the envelope:
 *
 *   request<ApiResponse<PageResult<User>>>({ url, method: 'get', params })
 *
 * Keep this file in step with request.js. It is a hand-written assertion about
 * untyped code, not something the compiler can verify.
 */
declare const request: <T = unknown>(config: AxiosRequestConfig) => Promise<T>

export default request
