import request from '@/utils/request'

// 查询字典类型列表
export function listType(query) {
  return request({
    url: '/api/v1/dict/type',
    method: 'get',
    params: query
  })
}

// 查询字典类型详细
export function getType(dictId) {
  return request({
    url: '/api/v1/dict/type/' + dictId,
    method: 'get'
  })
}

// 新增字典类型
export function addType(data) {
  return request({
    url: '/api/v1/dict/type',
    method: 'post',
    data: data
  })
}

// 修改字典类型
export function updateType(data) {
  return request({
    url: '/api/v1/dict/type/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除字典类型
export function delType(dictId) {
  return request({
    url: '/api/v1/dict/type',
    method: 'delete',
    data: dictId
  })
}

// 导出字典类型
export function exportType(query) {
  return request({
    url: '/api/v1/dict/type/export',
    method: 'get',
    params: query
  })
}

// 获取字典选择框列表
export function optionselect() {
  return request({
    url: '/api/v1/dict/type-option-select',
    method: 'get'
  })
}
