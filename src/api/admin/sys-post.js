import request from '@/utils/request'

// 查询岗位列表
export function listPost(query) {
  return request({
    url: '/api/v1/post',
    method: 'get',
    params: query
  })
}

// 查询岗位详细
export function getPost(postId) {
  return request({
    url: '/api/v1/post/' + postId,
    method: 'get'
  })
}

// 新增岗位
export function addPost(data) {
  return request({
    url: '/api/v1/post',
    method: 'post',
    data: data
  })
}

// 修改岗位
export function updatePost(data, id) {
  return request({
    url: '/api/v1/post/' + id,
    method: 'put',
    data: data
  })
}

// 删除岗位
export function delPost(postId) {
  return request({
    url: '/api/v1/post',
    method: 'delete',
    data: postId
  })
}

