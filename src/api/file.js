import request from '@/utils/request'

export const sysfiledirList = data => request({
    url: '/api/v1/sysfiledirList',
    method: "GET",
    data
})

export const sysfiledirAcionAdd = data => request({
    url: '/api/v1/sysfiledir',
    method: "POST",
    data
})

export const sysfiledirAcionEdit = data => request({
    url: '/api/v1/sysfiledir',
    method: "PUT",
    data
})

export const sysfiledirAcionDel = data => request({
    url: '/api/v1/sysfiledir/' + data,
    method: "DELETE",
})