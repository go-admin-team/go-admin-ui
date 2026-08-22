import { setActivePinia, createPinia } from 'pinia'

/**
 * Ported from the Vuex version together with the store itself.
 *
 * One assertion changed: the cookie value is now written as a string ('1'/'0')
 * rather than a number. js-cookie's type signature requires a string and it
 * stringified the number anyway, so the stored value is identical.
 *
 * The store reads cookies at creation time, so the mock must be hoisted above
 * the import — vi.mock does that.
 */

const cookies = { get: vi.fn(() => undefined), set: vi.fn() }

vi.mock('js-cookie', () => ({
  default: {
    get: (...args) => cookies.get(...args),
    set: (...args) => cookies.set(...args)
  }
}))

const { useAppStore } = await import('@/stores/app')

describe('stores/app', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useAppStore()
  })

  describe('toggleSideBar', () => {
    it('flips the open flag and persists 0 when collapsing', () => {
      store.toggleSideBar()

      expect(store.sidebar.opened).toBe(false)
      expect(cookies.set).toHaveBeenCalledWith('sidebarStatus', '0')
    })

    it('persists 1 when expanding again', () => {
      store.toggleSideBar()
      store.toggleSideBar()

      expect(store.sidebar.opened).toBe(true)
      expect(cookies.set).toHaveBeenLastCalledWith('sidebarStatus', '1')
    })

    it('always clears withoutAnimation', () => {
      store.closeSideBar({ withoutAnimation: true })
      store.toggleSideBar()

      expect(store.sidebar.withoutAnimation).toBe(false)
    })
  })

  describe('closeSideBar', () => {
    it('closes the sidebar and carries the withoutAnimation flag through', () => {
      store.closeSideBar({ withoutAnimation: true })

      expect(store.sidebar.opened).toBe(false)
      expect(store.sidebar.withoutAnimation).toBe(true)
      expect(cookies.set).toHaveBeenCalledWith('sidebarStatus', '0')
    })
  })

  describe('toggleDevice', () => {
    it('records the current device without touching cookies', () => {
      store.toggleDevice('mobile')

      expect(store.device).toBe('mobile')
      expect(cookies.set).not.toHaveBeenCalled()
    })
  })

  describe('setSize', () => {
    it('stores the size and persists it', () => {
      store.setSize('small')

      expect(store.size).toBe('small')
      expect(cookies.set).toHaveBeenCalledWith('size', 'small')
    })
  })
})
