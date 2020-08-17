import request from '@/utils/request'

// 查询SysConfig列表
export function listSysConfig(query) {
  return request({
    url: '/api/v1/sysconfigList',
    method: 'get',
    params: query
  })
}

// 查询SysConfig详细
export function getSysConfig(configId) {
  return request({
    url: '/api/v1/sysconfig/' + configId,
    method: 'get'
  })
}

// 新增SysConfig
export function addSysConfig(data) {
  return request({
    url: '/api/v1/sysconfig',
    method: 'post',
    data: data
  })
}

// 修改SysConfig
export function updateSysConfig(data) {
  return request({
    url: '/api/v1/sysconfig',
    method: 'put',
    data: data
  })
}

// 删除SysConfig
export function delSysConfig(configId) {
  return request({
    url: '/api/v1/sysconfig/' + configId,
    method: 'delete'
  })
}

