import request from '../../utils/request';

const url = '/api/v1/set-config';

export function getSetConfig(params) {
  return request({
    url,
    method: 'get',
    params
  });
}

export function updateSetConfig(data) {
  return request({
    url,
    method: 'put',
    data
  });
}