import request from '@/utils/request'

export function getDeptList(query) {
  return request({
    url: '/api/v1/dept',
    method: 'get',
    params: query
  })
}

// 查询部门详细
export function getDept(deptId) {
  return request({
    url: '/api/v1/dept/' + deptId,
    method: 'get'
  })
}

// 查询部门下拉树结构
export function treeselect() {
  return request({
    url: '/api/v1/deptTree',
    method: 'get'
  })
}

// 根据角色ID查询部门树结构
export function roleDeptTreeselect(roleId) {
  return request({
    url: '/api/v1/roleDeptTreeselect/' + roleId,
    method: 'get'
  })
}

// 新增部门
export function addDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'post',
    data: data
  })
}

// 修改部门
export function updateDept(data, id) {
  return request({
    url: '/api/v1/dept/' + id,
    method: 'put',
    data: data
  })
}

// 删除部门
export function delDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'delete',
    data: data
  })
}
