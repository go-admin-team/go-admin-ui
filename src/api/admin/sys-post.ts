import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult } from '@/types/api'
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

export function addPost(data: SysPost) {
  return request<ApiResponse<SysPost>>({
    url: '/api/v1/post',
    method: 'post',
    data
  })
}

/** The id goes in the path as well as the body -- the endpoint wants both. */
export function updatePost(data: SysPost, id: number) {
  return request<ApiResponse<SysPost>>({
    url: '/api/v1/post/' + id,
    method: 'put',
    data
  })
}

export function delPost(data: { ids: number[] }) {
  return request<ApiResponse<null>>({
    url: '/api/v1/post',
    method: 'delete',
    data
  })
}
