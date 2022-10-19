import request from '../../utils/request';

const url = '/api/v1/sys-opera-log';

export function getSysOperaLog(params) {
  return request({
    url,
    method: 'get',
    params,
  });
}

export function removeSysOperaLog(data) {
  return request({
    url,
    method: 'delete',
    data,
  });
}
