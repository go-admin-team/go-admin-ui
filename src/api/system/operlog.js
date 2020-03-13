import request from '@/utils/request'

// 查询操作日志列表
export function list(query) {
  return request({
    url: '/api/v1/operloglist',
    method: 'get',
    params: query
  })
}

// 删除操作日志
export function delOperlog(operId) {
  return request({
    url: '/api/v1/operlog/' + operId,
    method: 'delete'
  })
}

// 清空操作日志
export function cleanOperlog() {
  return request({
    url: '/api/v1/operlog/clean',
    method: 'delete'
  })
}

// 导出操作日志
export function exportOperlog(query) {
  return request({
    url: '/api/v1/operlog/export',
    method: 'get',
    params: query
  })
}
