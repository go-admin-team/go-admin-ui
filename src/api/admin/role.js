import request from '../../utils/request';

const url = '/api/v1/role';

export function getRole(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function addRole(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeRole(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateRole(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data,
  })
}

export function updateRoleScoped(data) {
  return request({
    url: '/api/v1/roledatascope',
    method: 'put',
    data
  })
}

export function getRoleMenuTree(params, roleId) {
  return request({
    url: `/api/v1/roleMenuTreeselect/${roleId}`,
    method: 'get',
    params
  })
}