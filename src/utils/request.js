import axios from 'axios';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '../store/userInfo'

// create an axios instance
const service = axios.create({
  baseUrl: import.meta.env.VITE_APP_BASE_URL,
  timeout: 8000,
});

// request interceptor
service.interceptors.request.use(
  (config) => {
    // Store 必须在拦截器内部导入，在外部导入会显示 Pinia 未初始化
    const store = useUserStore();
    // 设置请求头部 Authorization
    if (store.token) {
      config.headers['Authorization'] = 'Bearer ' + store.token;
      config.headers['Content-Type'] = 'application/json'
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
    return response.data;
  },
  (error) => {
    const store = useUserStore();
    const { code, msg } = error.response.data;
    // 如果过期则退出登录
    if (code === 401) {
      Message.error({
        content: 'Token 已过期, 请重新登陆',
        duration: 3000
      });
      // 重定向路由到登陆页面
      store.userLogout();
      // Akiraka 20230410 重定向到登录页面
      return router.push('/login');
    } else {
      Message.error({
        content: error.message,
        duration: 3000
      })
      return Promise.reject(msg);
    }
  }
);

export default service;