import { defineStore } from 'pinia'
import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import storage from '@/utils/storage'

export interface LoginPayload {
  username: string
  password: string
  code?: string
  uuid?: string
}

/** Profile payload returned by GET /api/v1/getinfo */
export interface UserInfo {
  roles: string[]
  name: string
  avatar: string
  introduction: string
  permissions: string[]
}

/**
 * Session, profile and permission identifiers.
 *
 * Ported from src/store/modules/user.js. Behaviour is covered by
 * tests/unit/store/user.spec.js.
 *
 * The Vuex module also carried a `changeRoles` action, a vue-element-admin
 * demo that minted a fake `<role>-token`. Nothing referenced it, and it was the
 * only dependency this store had on the permission module, so it is dropped
 * here rather than ported.
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    name: '',
    avatar: '',
    introduction: '',
    roles: [] as string[],
    /**
     * Permission identifiers such as 'admin:sysUser:add', read by the
     * v-permisaction directive.
     *
     * Named `permisaction`, not `permissions`: the API field is `permissions`
     * but the directive and every template read `permisaction`. Renaming either
     * side silently hides every permission-guarded control.
     */
    permisaction: [] as string[]
  }),

  actions: {
    async login(userInfo: LoginPayload) {
      const response = await login(userInfo)
      this.token = response.token
      setToken(response.token)
    },

    /**
     * Returns the profile itself rather than the raw envelope. The Vuex version
     * resolved with the full `{ code, data }` response while the router guard
     * destructured `{ roles }` straight off it, so `roles` was always
     * undefined. It went unnoticed because generateRoutes ignores the argument.
     */
    async getInfo(): Promise<UserInfo | undefined> {
      const response = await getInfo()

      if (!response || !response.data) {
        this.token = ''
        removeToken()
        return undefined
      }

      const { roles, name, avatar, introduction, permissions } = response.data as UserInfo

      // roles must be a non-empty array
      if (!roles || roles.length <= 0) {
        return Promise.reject(new Error('getInfo: roles must be a non-null array!'))
      }

      this.permisaction = permissions
      this.roles = roles
      this.name = name
      this.setAvatar(avatar)
      this.introduction = introduction

      return response.data
    },

    /** Relative paths are resolved against the API base url; absolute ones pass through. */
    setAvatar(avatar: string) {
      this.avatar = avatar && avatar.indexOf('http') !== -1
        ? avatar
        : process.env.VUE_APP_BASE_API + avatar
    },

    async LogOut() {
      await logout()
      this.token = ''
      this.roles = []
      this.permisaction = []
      removeToken()
      storage.clear()
    },

    resetToken() {
      this.token = ''
      removeToken()
    }
  }
})
