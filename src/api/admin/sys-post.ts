import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'
import type { SysPost } from '@/types/admin'

/** Post (job title) endpoints. */

export function listPost(query: Partial<PageQuery> & { postName?: string, status?: string }) {
  return request<ApiResponse<PageResult<SysPost>>>({
    url: '/api/v1/post',
    method: 'get',
    params: query
  })
}

export function getPost(postId: number) {
  return request<ApiResponse<SysPost>>({
    url: '/api/v1/post/' + postId,
    method: 'get'
  })
}

/** Numbers on the wire, strings in the form -- see the note in sys-dept. */
const toWire = (data: SysPost): SysPost => ({ ...data, status: Number(data.status) as never })

/** The mirror of toWire, for the record a form is about to edit. */
export const postToForm = (data: SysPost): SysPost => ({
  ...data,
  status: String(data.status ?? '1')
})

export function addPost(data: SysPost) {
  return request<ApiResponse<SysPost>>({
    url: '/api/v1/post',
    method: 'post',
    data: toWire(data)
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updatePost(data: SysPost, id: number) {
  return request<ApiResponse<SysPost>>({
    url: '/api/v1/post/' + id,
    method: 'put',
    data: toWire(data)
  })
}

export function delPost(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/post',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
