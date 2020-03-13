import request from '@/utils/request'

export function getList(query) {
  return request({
    url: '/api/v1/rolemenu',
    method: 'get',
    params: query
  })
}
export function CreaterolemenuData(value) {
  return request({
    url: '/api/v1/rolemenu',
    method: 'post',
    params: value
  })
}
export function UpdateData(id, value) {
  return request({
    url: '/api/v1/rolemenu/' + id,
    method: 'put',
    params: value
  })
}
export function DeleteData(role_id, menu_id) {
  return request({
    url: '/api/v1/rolemenu/' + role_id + menu_id,
    method: 'delete'
  })
}
