import axios from 'axios';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '../store/userInfo'

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_URL,
  timeout: 2000,
});

// request interceptor
service.interceptors.request.use(
  (config) => {
    // Store 必须在拦截器内部导入，在外部导入会显示 Pinia 未初始化
    const store = useUserStore();

    // 设置请求头部 Authorization
    if (store.token) {
      config.headers['Authorization'] = 'Bearer ' + store.token;
    }
    
    return config;
  },
  (error) => {
    console.error(error);
    return Promise.reject(error);
  }
);

// response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    const store = useUserStore();
    if (res.code === 401) {
      Message.error({
        content: 'Token 已过期, 请重新登陆',
        duration: 3000
      });
      // 重定向路由到登陆页面
      store.userLogout();
      window.location.href = '/login';
    }

    if (res.code !== 200) {
      Message.error({
        content: res.msg,
        duration: 3000,
      });

      return Promise.reject(new Error(res.msg));
    } else {
      return res;
    }
  },
  (error) => {
    console.error(`err: ${error}`);
    Message.error({
      content: error.message,
      duration: 3000
    })
    return Promise.reject(error);
  }
);

export default service;