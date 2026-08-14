import request from '@/utils/request'

// 函数命名遵循 list / get / add / update / del 前缀约定，
// 与后端 /api/v1/demo-product 的五个路由一一对应。

export function listProduct(query) {
  return request({
    url: '/api/v1/demo-product',
    method: 'get',
    params: query
  })
}

export function getProduct(id) {
  return request({
    url: '/api/v1/demo-product/' + id,
    method: 'get'
  })
}

export function addProduct(data) {
  return request({
    url: '/api/v1/demo-product',
    method: 'post',
    data
  })
}

export function updateProduct(data) {
  return request({
    url: '/api/v1/demo-product/' + data.id,
    method: 'put',
    data
  })
}

export function delProduct(data) {
  return request({
    url: '/api/v1/demo-product',
    method: 'delete',
    data
  })
}
