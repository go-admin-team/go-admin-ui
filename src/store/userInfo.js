import { defineStore } from 'pinia';
import { setLocalStorage, getLocalStorage } from '@/utils/storage';
import { getInfo } from '@/api/admin/sys-user';
import { getAppConfig } from '@/api/admin/login';
import { getToken, setToken, removeToken } from '@/utils/auth';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      // token: window.sessionStorage.getItem('token') || '',
      token: getToken(),
      uid: window.sessionStorage.getItem('uid') || '',
      sysConfig: getLocalStorage('sysConfig'),
      userInfo: '',
    }
  },
  getters: {
    roles: (state) => state.userInfo.roles || [],
  },
  actions: {
    setToken(token) {
      this.token = token;
      setToken(token);
      // window.sessionStorage.setItem('token', token);
    },
    userLogout() {
      removeToken();
      this.$reset();
    },
    async getUserInfo() {
      try {
        const res = await getInfo();
        window.localStorage.setItem('uid', res.data.userId);
        this.userInfo = res.data;
      } catch (err) {
        console.error(err);
      }
    },
    async getSysConfig() {
      try {
        const res = await getAppConfig();
        setLocalStorage('sysConfig', res.data);
        this.sysConfig = res.data;
      } catch (err) {
        console.error(err);
      }
    },
    updateSysConfig(configData) {
      Object.assign(this.sysConfig, configData);
      setLocalStorage('sysConfig', this.sysConfig);
    }
  },
})
