import request from '../../utils/request';

const url = '/api/v1/sys-login-log';

export function getSysLoginLog(params) {
  return request({
    url,
    method: 'GET',
    params
  })
}

export function removeSysLoginLog(data) {
  return request({
    url,
    method: 'DELETE',
    data
  })
}