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

// refreshtoken 刷新token
// 后端路由为 GET /api/v1/refresh_token（app/admin/router/sys_router.go），
// 此处此前写的是 POST /refreshtoken，路径与方法均不匹配，调用必然 404
export function refreshtoken() {
  return request({
    url: '/api/v1/refresh_token',
    method: 'get'
  })
}

// getInfo 获取用户基本信息
export function getInfo() {
  return request({
    url: '/api/v1/getinfo',
    method: 'get'
  })
}

