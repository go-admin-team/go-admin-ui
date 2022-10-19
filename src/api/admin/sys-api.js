import request from '../../utils/request';

const url = '/api/v1/sys-api';

export function getSysApi(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addSysApi(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeSysApi(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateSysApi(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data,
  })
}