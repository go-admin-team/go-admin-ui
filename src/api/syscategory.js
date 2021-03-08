import request from '@/utils/request'

// 查询SysCategory列表
export function listSysCategory(query) {
  return request({
    url: '/api/v1/syscategory',
    method: 'get',
    params: query
  })
}

// 查询SysCategory详细
export function getSysCategory(ID) {
  return request({
    url: '/api/v1/syscategory/' + ID,
    method: 'get'
  })
}

// 新增SysCategory
export function addSysCategory(data) {
  return request({
    url: '/api/v1/syscategory',
    method: 'post',
    data: data
  })
}

// 修改SysCategory
export function updateSysCategory(data) {
  return request({
    url: '/api/v1/syscategory/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除SysCategory
export function delSysCategory(data) {
  return request({
    url: '/api/v1/syscategory',
    method: 'delete',
    data: data
  })
}

