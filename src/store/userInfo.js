import { defineStore } from 'pinia';
import { setLocalStorage, getLocalStorage } from '@/utils/storage';
import { getInfo } from '@/api/admin/sys-user';
import { getAppConfig } from '@/api/admin/login';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      token: window.sessionStorage.getItem('token') || '',
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

      window.sessionStorage.setItem('token', token);
    },
    async getUserInfo() {
      try {
        const res = await getInfo();
        // window.sessionStorage.setItem('uid', res.data.userId);
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
    }
  },
  userLogout() {
    this.token = null;
    this.userInfo = null;
  }
})
