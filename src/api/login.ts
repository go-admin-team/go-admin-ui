import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type { AppInfo } from '@/stores/system'

/** Endpoints reachable before a session exists. */

/** Captcha image, as a data URI, plus the id to send back with it. */
export function getCodeImg() {
  return request<ApiResponse<{ id: string, data: string }>>({
    url: '/api/v1/captcha',
    method: 'get'
  })
}

/** Application branding. Deliberately outside the data-permission checks. */
export function getSetting() {
  return request<ApiResponse<AppInfo>>({
    url: '/api/v1/app-config',
    method: 'get'
  })
}
