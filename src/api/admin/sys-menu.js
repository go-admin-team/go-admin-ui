import request from '@/utils/request'

// 查询菜单列表
export function listMenu(query) {
  return request({
    url: '/api/v1/menu',
    method: 'get',
    params: query
  })
}

// 查询菜单详细
export function getMenu(menuId) {
  return request({
    url: '/api/v1/menu/' + menuId,
    method: 'get'
  })
}

// 查询菜单下拉树结构
// export function treeselect() {
//   return request({
//     url: '/api/v1/menuTreeselect',
//     method: 'get'
//   })
// }

// 根据角色ID查询菜单下拉树结构
export function roleMenuTreeselect(roleId) {
  return request({
    url: '/api/v1/roleMenuTreeselect/' + roleId,
    method: 'get'
  })
}

// 新增菜单
export function addMenu(data) {
  return request({
    url: '/api/v1/menu',
    method: 'post',
    data: data
  })
}

// 修改菜单
export function updateMenu(data, id) {
  return request({
    url: '/api/v1/menu/' + id,
    method: 'put',
    data: data
  })
}

// 删除菜单
export function delMenu(data) {
  return request({
    url: '/api/v1/menu',
    method: 'delete',
    data: data
  })
}
