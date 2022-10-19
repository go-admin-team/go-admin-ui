import request from '../../utils/request';

export function login(data) {
  return request({
    url: '/api/v1/login',
    method: 'post',
    data
  })
}

export function getCaptcha() {
  return request({
    url: '/api/v1/captcha',
    method: 'get'
  })
}

export function getAppConfig() {
  return request({
    url: '/api/v1/app-config',
    method: 'get'
  })
}

// 根据角色获取菜单
export function getUserMenuRole() {
  return request({
    url: '/api/v1/menurole',
    method: 'get'
  })
}