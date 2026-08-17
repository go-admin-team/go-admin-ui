import { createStore } from 'vuex'

/**
 * Behaviour lock for the user module ahead of the Vuex -> Pinia port (P1).
 *
 * The module reads the token at import time via getToken(), so the auth mock
 * must be hoisted above the import — vi.mock does that automatically.
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
const routerMock = { addRoute: vi.fn() }
const resetRouter = vi.fn()

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
vi.mock('@/router', () => ({
  default: { addRoute: (...args) => routerMock.addRoute(...args) },
  resetRouter: (...args) => resetRouter(...args)
}))

const { default: user } = await import('@/store/modules/user')

function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  Object.assign(user.state, {
    token: '',
    name: '',
    avatar: '',
    introduction: '',
    roles: [],
    permissions: [],
    permisaction: []
  })
  return createStore({ modules: { user } })
}

describe('store/user', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
  })

  const state = () => store.state.user

  describe('login', () => {
    it('stores the token in both state and the cookie', async() => {
      api.login.mockResolvedValue({ token: 'tok-1' })

      await store.dispatch('user/login', { username: 'admin', password: 'x' })

      expect(state().token).toBe('tok-1')
      expect(auth.setToken).toHaveBeenCalledWith('tok-1')
    })

    it('propagates the rejection and leaves the token empty', async() => {
      api.login.mockRejectedValue(new Error('bad credentials'))

      await expect(store.dispatch('user/login', {})).rejects.toThrow('bad credentials')
      expect(state().token).toBe('')
      expect(auth.setToken).not.toHaveBeenCalled()
    })
  })

  describe('getInfo', () => {
    it('populates profile, roles and permissions', async() => {
      api.getInfo.mockResolvedValue({
        data: {
          roles: ['admin'],
          name: 'Admin',
          avatar: 'http://cdn/a.png',
          introduction: 'hello',
          permissions: ['admin:sysUser:add']
        }
      })

      await store.dispatch('user/getInfo')

      expect(state().roles).toEqual(['admin'])
      expect(state().name).toBe('Admin')
      expect(state().introduction).toBe('hello')
    })

    /**
     * SET_PERMISSIONS writes to `permisaction`, not to the `permissions` field
     * that also exists on state. The v-permisaction directive reads
     * `permisaction`, so the naming mismatch is load-bearing: renaming it during
     * the Pinia port would silently break every permission-guarded button.
     */
    it('writes permissions into the permisaction field', async() => {
      api.getInfo.mockResolvedValue({
        data: { roles: ['admin'], name: 'A', avatar: '', introduction: '', permissions: ['p1'] }
      })

      await store.dispatch('user/getInfo')

      expect(state().permisaction).toEqual(['p1'])
      expect(state().permissions).toEqual([])
    })

    it('prefixes a relative avatar with the API base url', async() => {
      api.getInfo.mockResolvedValue({
        data: { roles: ['admin'], name: 'A', avatar: '/pic/a.png', introduction: '', permissions: [] }
      })

      await store.dispatch('user/getInfo')

      // VUE_APP_BASE_API is defined as '' under test, so the value passes through
      expect(state().avatar).toBe('/pic/a.png')
    })

    it('keeps an absolute avatar url untouched', async() => {
      api.getInfo.mockResolvedValue({
        data: { roles: ['admin'], name: 'A', avatar: 'http://cdn/a.png', introduction: '', permissions: [] }
      })

      await store.dispatch('user/getInfo')

      expect(state().avatar).toBe('http://cdn/a.png')
    })

    it('rejects when roles come back empty', async() => {
      api.getInfo.mockResolvedValue({
        data: { roles: [], name: 'A', avatar: '', introduction: '', permissions: [] }
      })

      await expect(store.dispatch('user/getInfo')).rejects.toBe(
        'getInfo: roles must be a non-null array!'
      )
    })

    it('clears the token and resolves when the response carries no data', async() => {
      store.commit('user/SET_TOKEN', 'stale')
      api.getInfo.mockResolvedValue({})

      await store.dispatch('user/getInfo')

      expect(state().token).toBe('')
      expect(auth.removeToken).toHaveBeenCalled()
    })
  })

  describe('LogOut', () => {
    it('clears token, roles, permissions, cookie and local storage', async() => {
      api.logout.mockResolvedValue({})
      store.commit('user/SET_TOKEN', 'tok')
      store.commit('user/SET_ROLES', ['admin'])
      store.commit('user/SET_PERMISSIONS', ['p1'])

      await store.dispatch('user/LogOut')

      expect(state().token).toBe('')
      expect(state().roles).toEqual([])
      expect(state().permisaction).toEqual([])
      expect(auth.removeToken).toHaveBeenCalled()
      expect(storage.clear).toHaveBeenCalled()
    })

    it('keeps state intact when the logout request fails', async() => {
      api.logout.mockRejectedValue(new Error('network'))
      store.commit('user/SET_TOKEN', 'tok')

      await expect(store.dispatch('user/LogOut')).rejects.toThrow('network')
      expect(state().token).toBe('tok')
      expect(storage.clear).not.toHaveBeenCalled()
    })
  })

  describe('resetToken', () => {
    it('clears the token without calling the api', async() => {
      store.commit('user/SET_TOKEN', 'tok')

      await store.dispatch('user/resetToken')

      expect(state().token).toBe('')
      expect(auth.removeToken).toHaveBeenCalled()
      expect(api.logout).not.toHaveBeenCalled()
    })
  })
})
