import { setActivePinia, createPinia } from 'pinia'

/**
 * Ported from the Vuex version together with the store itself.
 *
 * Two intentional differences from the Vuex behaviour, both asserted below:
 *   - getInfo resolves with the profile instead of the raw `{ code, data }`
 *     envelope, so the router guard's `const { roles } = ...` finally works
 *   - changeRoles is gone; it was an unreferenced vue-element-admin demo
 *
 * The store reads the token at creation time, so the auth mock must be hoisted
 * above the import — vi.mock does that.
 */

const api = {
  login: vi.fn(),
  logout: vi.fn(),
  getInfo: vi.fn()
}
const auth = {
  getToken: vi.fn(() => ''),
  setToken: vi.fn(),
  removeToken: vi.fn()
}
const storage = { clear: vi.fn() }

vi.mock('@/api/user', () => ({
  login: (...args) => api.login(...args),
  logout: (...args) => api.logout(...args),
  getInfo: (...args) => api.getInfo(...args)
}))
vi.mock('@/utils/auth', () => ({
  getToken: (...args) => auth.getToken(...args),
  setToken: (...args) => auth.setToken(...args),
  removeToken: (...args) => auth.removeToken(...args)
}))
vi.mock('@/utils/storage', () => ({
  default: { clear: (...args) => storage.clear(...args) }
}))

const { useUserStore } = await import('@/stores/user')

const profile = (over = {}) => ({
  roles: ['admin'],
  name: 'Admin',
  avatar: 'http://cdn/a.png',
  introduction: 'hello',
  permissions: ['admin:sysUser:add'],
  ...over
})

describe('stores/user', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useUserStore()
  })

  describe('login', () => {
    it('stores the token in both state and the cookie', async() => {
      api.login.mockResolvedValue({ token: 'tok-1' })

      await store.login({ username: 'admin', password: 'x' })

      expect(store.token).toBe('tok-1')
      expect(auth.setToken).toHaveBeenCalledWith('tok-1')
    })

    it('propagates the rejection and leaves the token empty', async() => {
      api.login.mockRejectedValue(new Error('bad credentials'))

      await expect(store.login({})).rejects.toThrow('bad credentials')
      expect(store.token).toBe('')
      expect(auth.setToken).not.toHaveBeenCalled()
    })
  })

  describe('getInfo', () => {
    it('populates profile, roles and permissions', async() => {
      api.getInfo.mockResolvedValue({ data: profile() })

      await store.getInfo()

      expect(store.roles).toEqual(['admin'])
      expect(store.name).toBe('Admin')
      expect(store.introduction).toBe('hello')
    })

    /**
     * Resolving with the profile rather than the envelope is what makes the
     * router guard's `const { roles } = await getInfo()` work; under Vuex it
     * silently produced undefined.
     */
    it('resolves with the profile itself', async() => {
      api.getInfo.mockResolvedValue({ code: 200, data: profile() })

      const result = await store.getInfo()

      expect(result.roles).toEqual(['admin'])
    })

    /**
     * SET_PERMISSIONS wrote to `permisaction`, not to `permissions`. The
     * v-permisaction directive reads the former, so the naming is load-bearing.
     */
    it('writes permissions into the permisaction field', async() => {
      api.getInfo.mockResolvedValue({ data: profile({ permissions: ['p1'] }) })

      await store.getInfo()

      expect(store.permisaction).toEqual(['p1'])
    })

    it('prefixes a relative avatar with the API base url', async() => {
      api.getInfo.mockResolvedValue({ data: profile({ avatar: '/pic/a.png' }) })

      await store.getInfo()

      // VUE_APP_BASE_API is defined as '' under test, so the value passes through
      expect(store.avatar).toBe('/pic/a.png')
    })

    it('keeps an absolute avatar url untouched', async() => {
      api.getInfo.mockResolvedValue({ data: profile({ avatar: 'http://cdn/a.png' }) })

      await store.getInfo()

      expect(store.avatar).toBe('http://cdn/a.png')
    })

    it('rejects when roles come back empty', async() => {
      api.getInfo.mockResolvedValue({ data: profile({ roles: [] }) })

      await expect(store.getInfo()).rejects.toThrow('roles must be a non-null array')
    })

    it('clears the token and resolves when the response carries no data', async() => {
      store.token = 'stale'
      api.getInfo.mockResolvedValue({})

      const result = await store.getInfo()

      expect(result).toBeUndefined()
      expect(store.token).toBe('')
      expect(auth.removeToken).toHaveBeenCalled()
    })
  })

  describe('LogOut', () => {
    it('clears token, roles, permissions, cookie and local storage', async() => {
      api.logout.mockResolvedValue({})
      store.token = 'tok'
      store.roles = ['admin']
      store.permisaction = ['p1']

      await store.LogOut()

      expect(store.token).toBe('')
      expect(store.roles).toEqual([])
      expect(store.permisaction).toEqual([])
      expect(auth.removeToken).toHaveBeenCalled()
      expect(storage.clear).toHaveBeenCalled()
    })

    it('keeps state intact when the logout request fails', async() => {
      api.logout.mockRejectedValue(new Error('network'))
      store.token = 'tok'

      await expect(store.LogOut()).rejects.toThrow('network')
      expect(store.token).toBe('tok')
      expect(storage.clear).not.toHaveBeenCalled()
    })
  })

  describe('resetToken', () => {
    it('clears the token without calling the api', () => {
      store.token = 'tok'

      store.resetToken()

      expect(store.token).toBe('')
      expect(auth.removeToken).toHaveBeenCalled()
      expect(api.logout).not.toHaveBeenCalled()
    })
  })
})
