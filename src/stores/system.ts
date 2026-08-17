import { defineStore } from 'pinia'
import { getSetting } from '@/api/login'
import storage from '@/utils/storage'

/** Application branding returned by GET /api/v1/setting */
export interface AppInfo {
  sys_app_name?: string
  sys_app_logo?: string
  [key: string]: unknown
}

/**
 * System-wide application settings (name, logo), shown on the login page and in
 * the sidebar logo.
 *
 * Ported from src/store/modules/system.js. Behaviour is covered by
 * tests/unit/store/system.spec.js.
 */
export const useSystemStore = defineStore('system', {
  state: () => ({
    // Seeded from local storage so branding survives a reload without waiting
    // on the network
    info: (storage.get('app_info') || {}) as AppInfo
  }),

  actions: {
    /** Mirrors into local storage, matching the Vuex SET_INFO mutation. */
    setInfo(data: AppInfo) {
      this.info = data
      storage.set('app_info', data)
    },

    async settingDetail() {
      const response = await getSetting()
      this.setInfo(response.data)
      return response.data
    }
  }
})
