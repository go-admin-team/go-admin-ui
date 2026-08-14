import request from '@/utils/request'

// login 登陆
export function login(data) {
  return request({
    url: '/api/v1/login',
    method: 'post',
    data
  })
}

// logout 退出
export function logout() {
  return request({
    url: '/api/v1/logout',
    method: 'post'
  })
}

// getInfo 获取用户基本信息
export function getInfo() {
  return request({
    url: '/api/v1/getinfo',
    method: 'get'
  })
}

