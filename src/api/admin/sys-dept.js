import request from '../../utils/request';

const url = '/api/v1/dept';

export function getDept(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addDept(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeDept(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateDept(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data,
  })
}