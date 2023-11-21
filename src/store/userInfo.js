import { defineStore } from 'pinia';
import { storage } from '@/utils/storage';
import { getInfo } from '@/api/admin/sys-user';
import { getAppConfig } from '@/api/admin/login';

export const useUserStore = defineStore('user', {
  state: () => {
    return {
      token: storage.getItem('token') || null,
      uid: storage.getItem('uid') || null,
      sysConfig: null,
      userInfo: null,
    }
  },
  getters: {
    roles: (state) => state?.userInfo?.roles,
  },
  actions: {
    setToken(token) {
      this.token = token;
      // Akiraka 20230504 设置缓存 token
      storage.setItem('token', token);
    },
    async getUserInfo() {
      try {
        const { data } = await getInfo();
        // storage.setItem('userInfo', res.data);
        storage.setItem('uid', data.userId);
        this.userInfo = data;
      } catch (err) {
        console.error(err);
      }
    },
    async getSysConfig() {
      const sysConfig = storage.getItem('sysConfig');
      if (sysConfig) {
        this.sysConfig = sysConfig;
      } else {
        try {
          const { data, code, errorMessage } = await getAppConfig();
          if ( code === 200 ) {
            storage.setItem('sysConfig', data);
            this.sysConfig = data;
          }
        } catch (err) {
          console.error(err);
        }
      }
    },
    userLogout() {
      this.token = null;
      this.userInfo = null;
      // Akiraka 20230504 清除缓存 token
      storage.removeItem('token');
    }
  }
})
