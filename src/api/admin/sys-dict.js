import request from '../../utils/request';

const url = '/api/v1/dict/type';

export function getDictType(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addDictType(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeDictType(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateDictType(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data,
  })
}

// 获取字典选择框列表
export function optionselect() {
  return request({
    url: '/api/v1/dict/type-option-select',
    method: 'get'
  })
}
