import request from '@/utils/request'

export function list(data) {
  return request({
    url: 'api/v1/schedule/list',
    method: 'get',
    params: data
  })
}

export function add(data) {
  return request({
    url: 'api/v1/schedule/add',
    method: 'post',
    data
  })
}

export function edit(data) {
  return request({
    url: 'api/v1/schedule/update',
    method: 'put',
    data
  })
}

export function getSchedule(id) {
  return request({
    url: 'api/v1/schedule/query',
    method: 'get',
    params: {
      id
    }
  })
}

export function deleteSchedule(data) {
  return request({
    url: 'api/v1/schedule/delete',
    method: 'delete',
    data
  })
}
