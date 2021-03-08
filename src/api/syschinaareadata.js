import request from '@/utils/request'

// 查询SysChinaAreaData列表
export function listSysChinaAreaData(query) {
  return request({
    url: '/api/v1/sys_china_area_data',
    method: 'get',
    params: query
  })
}

// 查询SysChinaAreaData详细
export function getSysChinaAreaData(id) {
  return request({
    url: '/api/v1/sys_china_area_data/' + id,
    method: 'get'
  })
}

// 新增SysChinaAreaData
export function addSysChinaAreaData(data) {
  return request({
    url: '/api/v1/sys_china_area_data',
    method: 'post',
    data: data
  })
}

// 修改SysChinaAreaData
export function updateSysChinaAreaData(data) {
  return request({
    url: '/api/v1/sys_china_area_data/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除SysChinaAreaData
export function delSysChinaAreaData(data) {
  return request({
    url: '/api/v1/sys_china_area_data',
    method: 'delete',
    data: data
  })
}

