import request from '../../utils/request';

const url = '/api/v1/config';

export function getSysConfig(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addSysConfig(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeSysConfig(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateSysConfig(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data,
  })
}