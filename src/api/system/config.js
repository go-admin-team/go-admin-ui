import request from '@/utils/request'

// 查询参数列表
export function listConfig(query) {
  return request({
    url: '/api/v1/config',
    method: 'get',
    params: query
  })
}

// 查询参数详细
export function getConfig(configId) {
  return request({
    url: '/api/v1/config/' + configId,
    method: 'get'
  })
}

// 根据参数键名查询参数值
export function getConfigKey(configKey) {
  return request({
    url: '/api/v1/configKey',
    method: 'post',
    data: { 'configKey': configKey }
  })
}

// 新增参数配置
export function addConfig(data) {
  return request({
    url: '/api/v1/config',
    method: 'post',
    data: data
  })
}

// 修改参数配置
export function updateConfig(data) {
  return request({
    url: '/api/v1/config/' + data.ID,
    method: 'put',
    data: data
  })
}

// 删除参数配置
export function delConfig(configId) {
  return request({
    url: '/api/v1/config/' + configId,
    method: 'delete'
  })
}

