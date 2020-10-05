import request from '@/utils/request'

// 查询SysJob列表
export function unWsLogout(id, group) {
  return request({
    url: '/wslogout/' + id + '/' + group,
    method: 'get'
  })
}
