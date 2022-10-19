import request from '../../utils/request'

const url = '/api/v1/menu';

export function getMenu(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function getMenuDetails(menuId) {
  return request({
    url: `${url}/${menuId}`,
    method: 'get'
  })
}

export function addMenu(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeMenu(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

/**
 * 修改菜单
 * @param {Object} data 
 * @param {Number} id 
 * @returns 
 */
export function updateMenu(data, id) {
  return request({
    url: `${url}/${id}`,
    method: 'put',
    data
  })
}