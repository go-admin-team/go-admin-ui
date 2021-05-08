import request from '@/utils/request'
import { data } from 'autoprefixer'

export const sysfiledirList = data => request({
  url: '/api/v1/file-dir',
  method: 'GET',
  data
})

export const sysfiledirAcionAdd = data => request({
  url: '/api/v1/file-dir',
  method: 'POST',
  data
})

export const sysfiledirAcionEdit = data => request({
  url: '/api/v1/file-dir/' + data.id,
  method: 'PUT',
  data
})

export const sysfiledirAcionDel = data => request({
  url: '/api/v1/file-dir/' + data,
  method: 'DELETE'
})

export const sysfileinfoList = data => request({
  url: `/api/v1/file-info?pId=${data.pId}&pageSize=${data.pageSize}&pageIndex=${data.pageIndex}`,
  method: 'GET',
  data
})

export const sysfileinfo = id => request({
  url: '/api/v1/file-info/' + id,
  method: 'GET'
})

export const sysfileinfoAdd = data => request({
  url: '/api/v1/file-info',
  method: 'POST',
  data
})

export const sysfileinfoEdit = data => request({
  url: '/api/v1/file-info/' + data.id,
  method: 'put',
  data
})

export const sysfileinfoDelete = id => request({
  url: '/api/v1/file-info/' + id,
  method: 'DELETE',
  data
})
