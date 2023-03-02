import request from '../../utils/request';

const url = '/api/v1/sys-user';

export function getUser(params) {
  return request({
    url,
    method: 'get',
    params
  })
}

export function getInfo() {
  return request({
    url: '/api/v1/getinfo',
    method: 'get'
  })
}

export function addUser(data) {
  return request({
    url,
    method: 'post',
    data
  })
}

export function removeUser(data) {
  return request({
    url,
    method: 'delete',
    data
  })
}

export function updateUser(data) {
  return request({
    url,
    method: 'put',
    data,
  })
}

export function updateUserStatus(data) {
  return request({
    url: '/api/v1/user/status',
    method: 'put',
    data
  })
}

export function resetUserPwd(data) {
  return request({
    url: '/api/v1/user/pwd/reset',
    method: 'put',
    data
  })
}

// 获取当前登录用户信息
export function getCurrentUser(uid) {
  return request({
    url: `${url}/${uid}`,
    method: 'get'
  })
}

// 用户头像上传
export function uploadAvatar(data) {
  return request({
    url: '/api/v1/user/avatar',
    method: 'post',
    data: data
  })
}