import axios from 'axios'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getToken } from '@/utils/auth'

/**
 * Marks an error whose message this interceptor has already shown the user.
 *
 * "The interceptor already reported it, do not report it again" is stated in
 * src/types/api.ts and in every composable's onError doc, but nothing enforced
 * it -- so a catch block that wanted to surface a client-side failure had no
 * way to tell the two apart and showed a second toast for every HTTP failure
 * too. Callers can now check `error.reported`.
 */
const reported = error => Object.assign(error, { reported: true })

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

    if (useUserStore().token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers['Authorization'] = 'Bearer ' + getToken()

      // FormData 必须跳过：axios 的 transformRequest 见到 application/json
      // 会把 FormData 序列化成 JSON，文件字段变成字符串 "null"，请求体只剩
      // 十几字节，文件根本到不了服务端。跳过后 axios 会清空该头，由浏览器
      // 自行写入带 boundary 的 multipart/form-data。
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }
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
      useUserStore().resetToken()
      if (location.href.indexOf('login') !== -1) {
        location.reload() // 为了重新实例化vue-router对象 避免bug
      } else {
        ElMessageBox.confirm(
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
      return Promise.reject(reported(new Error('Unauthorized')))
    } else if (code === 6401) {
      useUserStore().resetToken()
      ElMessageBox.confirm(
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
      // Reject, like the 401 branch above. Resolving with `false` broke the
      // invariant the callers rely on -- that a resolved response means
      // code === 200 -- so an expired session surfaced as an empty table with
      // no error, and `response.data` threw wherever it was read.
      return Promise.reject(reported(new Error('登录状态已过期')))
    } else if (code === 400 || code === 403) {
      ElMessage({
        message: response.data.msg,
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(reported(new Error(response.data.msg)))
    } else if (code !== 200) {
      // Notification.error({
      //   title: response.data.msg
      // })
      ElMessage({
        message: response.data.msg,
        type: 'error'
      })
      // An Error, like every other branch here. Rejecting with a bare string
      // left `error.message` undefined, so any caller following the
      // `error?.message || fallback` pattern rendered an empty toast -- the
      // same defect the 401/6401 branches were fixed for.
      return Promise.reject(reported(new Error(response.data.msg || 'error')))
    } else {
      return response.data
    }
  },
  error => {
    if (error.message === 'Network Error') {
      ElMessage({
        message: '服务器连接异常，请检查服务器！',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(reported(error))
    }
    console.log('err' + error) // for debug

    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })

    return Promise.reject(reported(error))
  }
)

export default service
