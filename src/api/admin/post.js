import request from '../../utils/request'

const url = '/api/v1/post';

export function getPost(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addPost(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removePost(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updatePost(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data
  })
}