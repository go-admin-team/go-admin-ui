import request from '@/utils/request'

// 查询SysContent列表
export function listSysContent(query) {
  return request({
    url: '/api/v1/syscontentList',
    method: 'get',
    params: query
  })
}

// 查询SysContent详细
export function getSysContent(id) {
  return request({
    url: '/api/v1/syscontent/' + id,
    method: 'get'
  })
}

// 新增SysContent
export function addSysContent(data) {
  return request({
    url: '/api/v1/syscontent',
    method: 'post',
    data: data
  })
}

// 修改SysContent
export function updateSysContent(data) {
  return request({
    url: '/api/v1/syscontent',
    method: 'put',
    data: data
  })
}

// 删除SysContent
export function delSysContent(id) {
  return request({
    url: '/api/v1/syscontent/' + id,
    method: 'delete'
  })
}

