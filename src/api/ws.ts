import request from '@/utils/request'
import type { ApiResponse } from '@/types/api'

/** Closes a websocket the scheduler opened for a job's log stream. */
export function unWsLogout(id: string | number, group: string) {
  return request<ApiResponse<null>>({
    url: '/wslogout/' + id + '/' + group,
    method: 'get'
  })
}
