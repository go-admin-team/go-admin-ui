import request from '@/utils/request';

const url = '/api/v1/dict/data';

export function getDictData(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addDictData(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function updateDictData(data, dictCode) {
  return request({
    url: `${url}/${dictCode}`,
    method: 'put',
    data
  })
}

export function deleteDictData(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}
