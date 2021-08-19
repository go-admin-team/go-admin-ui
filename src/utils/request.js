import axios from 'axios'
import { MessageBox, Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    if (store.getters.token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['Authorization'] = 'Bearer ' + getToken()
      config.headers['Content-Type'] = 'application/json'
    }
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const code = response.data.code
    if (code === 401) {
      store.dispatch('user/resetToken')
      if (location.href.indexOf('login') !== -1) {
        location.reload() // 为了重新实例化vue-router对象 避免bug
      } else {
        MessageBox.confirm(
          '登录状态已过期，您可以继续留在该页面，或者重新登录',
          '系统提示',
          {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          location.reload() // 为了重新实例化vue-router对象 避免bug
        })
      }
    } else if (code === 6401) {
      store.dispatch('user/resetToken')
      MessageBox.confirm(
        '登录状态已过期，您可以继续留在该页面，或者重新登录',
        '系统提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        location.reload() // 为了重新实例化vue-router对象 避免bug
      })
      return false
    } else if (code === 400 || code === 403) {
      Message({
        message: response.data.msg,
        type: 'error',
        duration: 5 * 1000
      })
    } else if (code !== 200) {
      // Notification.error({
      //   title: response.data.msg
      // })
      Message({
        message: response.data.msg,
        type: 'error'
      })
      return Promise.reject('error')
    } else {
      return response.data
    }
  },
  error => {
    if (error.message === 'Network Error') {
      Message({
        message: '服务器连接异常，请检查服务器！',
        type: 'error',
        duration: 5 * 1000
      })
      return
    }
    console.log('err' + error) // for debug

    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(error)
  }
)

export default service
