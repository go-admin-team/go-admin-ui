import request from '../../utils/request';

// 获取用户信息
export function getUserProfile() {
  return request({
    url: '/api/v1/user/profile',
    method: 'get'
  })
}

// 修改用户密码
export function putUserPwd(data) {
  return request({
    url: '/api/v1/user/pwd/set',
    method: 'put',
    data
  })
}