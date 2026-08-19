import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysJob, SysJobQuery } from '@/types/admin'

/** Scheduled job endpoints. */

export function listSysJob(query: SysJobQuery & Partial<PageQuery>) {
  return request<ApiResponse<PageResult<SysJob>>>({
    url: '/api/v1/sysjob',
    method: 'get',
    params: query
  })
}

export function getSysJob(jobId: number) {
  return request<ApiResponse<SysJob>>({
    url: '/api/v1/sysjob/' + jobId,
    method: 'get'
  })
}

/**
 * Numbers on the wire, strings in the form.
 *
 * SysJob.Status is an int and the DTO binds it as one, while sys_job_status
 * keys on strings. The radio groups already work in numbers, so status is the
 * only field that needs the round trip.
 */
const toWire = (data: SysJob): Omit<SysJob, 'status'> & { status: number } => ({
  ...data,
  status: Number(data.status)
})

/** getSysJob with the record already shaped for a form. */
export const getSysJobForForm = async(jobId: number) => {
  const response = await getSysJob(jobId)
  return { ...response, data: { ...response.data, status: String(response.data?.status ?? '2') }}
}

export function addSysJob(data: SysJob) {
  return request<ApiResponse<SysJob>>({
    url: '/api/v1/sysjob',
    method: 'post',
    data: toWire(data)
  })
}

/** Takes the id in the body, unlike most of the admin endpoints. */
export function updateSysJob(data: SysJob) {
  return request<ApiResponse<SysJob>>({
    url: '/api/v1/sysjob',
    method: 'put',
    data: toWire(data)
  })
}

export function delSysJob(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/sysjob',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}

/** Stops a running job. A GET, which is the endpoint's choice, not ours. */
export function removeJob(jobId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/job/remove/' + jobId,
    method: 'get'
  })
}

export function startJob(jobId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/job/start/' + jobId,
    method: 'get'
  })
}
