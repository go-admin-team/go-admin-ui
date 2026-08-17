import { createStore } from 'vuex'

/**
 * Behaviour lock for the app module ahead of the Vuex -> Pinia port (P1).
 *
 * Sidebar state and component size are mirrored into cookies so they survive a
 * reload; those writes are part of the contract, not an implementation detail.
 */

const cookies = { get: vi.fn(() => undefined), set: vi.fn() }

vi.mock('js-cookie', () => ({
  default: {
    get: (...args) => cookies.get(...args),
    set: (...args) => cookies.set(...args)
  }
}))

const { default: app } = await import('@/store/modules/app')

function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  Object.assign(app.state, {
    sidebar: { opened: true, withoutAnimation: false },
    device: 'desktop',
    size: 'medium'
  })
  return createStore({ modules: { app } })
}

describe('store/app', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
  })

  const state = () => store.state.app

  describe('toggleSideBar', () => {
    it('flips the open flag and persists 0 when collapsing', () => {
      store.dispatch('app/toggleSideBar')

      expect(state().sidebar.opened).toBe(false)
      expect(cookies.set).toHaveBeenCalledWith('sidebarStatus', 0)
    })

    it('persists 1 when expanding again', () => {
      store.dispatch('app/toggleSideBar')
      store.dispatch('app/toggleSideBar')

      expect(state().sidebar.opened).toBe(true)
      expect(cookies.set).toHaveBeenLastCalledWith('sidebarStatus', 1)
    })

    it('always clears withoutAnimation', () => {
      store.commit('app/CLOSE_SIDEBAR', true)
      store.dispatch('app/toggleSideBar')

      expect(state().sidebar.withoutAnimation).toBe(false)
    })
  })

  describe('closeSideBar', () => {
    it('closes the sidebar and carries the withoutAnimation flag through', () => {
      store.dispatch('app/closeSideBar', { withoutAnimation: true })

      expect(state().sidebar.opened).toBe(false)
      expect(state().sidebar.withoutAnimation).toBe(true)
      expect(cookies.set).toHaveBeenCalledWith('sidebarStatus', 0)
    })
  })

  describe('toggleDevice', () => {
    it('records the current device without touching cookies', () => {
      store.dispatch('app/toggleDevice', 'mobile')

      expect(state().device).toBe('mobile')
      expect(cookies.set).not.toHaveBeenCalled()
    })
  })

  describe('setSize', () => {
    it('stores the size and persists it', () => {
      store.dispatch('app/setSize', 'small')

      expect(state().size).toBe('small')
      expect(cookies.set).toHaveBeenCalledWith('size', 'small')
    })
  })
})
