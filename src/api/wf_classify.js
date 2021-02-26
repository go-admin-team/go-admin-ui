import request from '@/utils/request'

// 查询WfProcessClassify列表
export function listWfProcessClassify(query) {
  return request({
    url: '/api/v1/process',
    method: 'get',
    params: query
  })
}

// 查询WfProcessClassify详细
export function getWfProcessClassify(id) {
  return request({
    url: '/api/v1/process/' + id,
    method: 'get'
  })
}

// 新增WfProcessClassify
export function addWfProcessClassify(data) {
  return request({
    url: '/api/v1/process',
    method: 'post',
    data: data
  })
}

// 修改WfProcessClassify
export function updateWfProcessClassify(data) {
  return request({
    url: '/api/v1/process/' + data.id,
    method: 'put',
    data: data
  })
}

// 删除WfProcessClassify
export function delWfProcessClassify(data) {
  return request({
    url: '/api/v1/process',
    method: 'delete',
    data: data
  })
}

