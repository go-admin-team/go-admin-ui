import request from '@/utils/request'

// 查询生成表数据
export function listTable(query) {
  return request({
    url: '/api/v1/sys/tables/page',
    method: 'get',
    params: query
  })
}
// 查询db数据库列表
export function listDbTable(query) {
  return request({
    url: '/api/v1/db/tables/page',
    method: 'get',
    params: query
  })
}

// 查询表详细信息
export function getGenTable(tableId) {
  return request({
    url: '/api/v1/sys/tables/info/' + tableId,
    method: 'get'
  })
}

export function getGenTableInfo(tablename) {
  return request({
    url: '/api/v1/sys/tables?tableName=' + tablename,
    method: 'get'
  })
}

// 修改代码生成信息
export function updateGenTable(data) {
  return request({
    url: '/api/v1/sys/tables/info',
    method: 'put',
    data: data
  })
}

// 导入表
export function importTable(data) {
  return request({
    url: '/api/v1/sys/tables/info',
    method: 'post',
    params: data
  })
}
// 预览生成代码
export function previewTable(tableId) {
  return request({
    url: '/api/v1/gen/preview/' + tableId,
    method: 'get'
  })
}
// 删除表数据
export function delTable(tableId) {
  return request({
    url: '/api/v1/sys/tables/info/' + tableId,
    method: 'delete'
  })
}

// 生成代码到项目
export function toProjectTable(tableId) {
  return request({
    url: '/api/v1/gen/toproject/' + tableId,
    method: 'get'
  })
}

// 生成接口数据到迁移脚本
export function apiToFile(tableId) {
  return request({
    url: '/api/v1/gen/apitofile/' + tableId,
    method: 'get'
  })
}

export function toProjectTableCheckRole(tableId, ischeckrole) {
  return request({
    url: '/api/v1/gen/toproject/' + tableId + '?ischeckrole=' + ischeckrole,
    method: 'get'
  })
}

// 生成菜单到数据库
export function toDBTable(tableId) {
  return request({
    url: '/api/v1/gen/todb/' + tableId,
    method: 'get'
  })
}

export function getTableTree() {
  return request({
    url: '/api/v1/gen/tabletree',
    method: 'get'
  })
}
