import request from '@/utils/request'

// 查询SysLoginlog列表
export function listSysLoginlog(query) {
  return request({
    url: '/api/v1/sys-login-log',
    method: 'get',
    params: query
  })
}

// 查询SysLoginlog详细
export function getSysLoginlog(ID) {
  return request({
    url: '/api/v1/sys-login-log/' + ID,
    method: 'get'
  })
}

// 删除SysLoginlog
export function delSysLoginlog(data) {
  return request({
    url: '/api/v1/sys-login-log',
    method: 'delete',
    data: data
  })
}

