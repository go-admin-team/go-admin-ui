import request from '@/utils/request'

// 查询Scol列表
export function listScol(query) {
    return request({
        url: '/api/v1/scol',
        method: 'get',
        params: query
    })
}

// 查询Scol详细
export function getScol (ID) {
    return request({
        url: '/api/v1/scol/' + ID,
        method: 'get'
    })
}


// 新增Scol
export function addScol(data) {
    return request({
        url: '/api/v1/scol',
        method: 'post',
        data: data
    })
}

// 修改Scol
export function updateScol(data) {
    return request({
        url: '/api/v1/scol/'+data.ID,
        method: 'put',
        data: data
    })
}

// 删除Scol
export function delScol(data) {
    return request({
        url: '/api/v1/scol',
        method: 'delete',
        data: data
    })
}

