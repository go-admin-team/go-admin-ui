import { createStore } from 'vuex'

/**
 * Behaviour lock for the system module ahead of the Vuex -> Pinia port (P1).
 *
 * The module reads local storage at import time to seed its state, so the
 * storage mock must be hoisted above the import — vi.mock does that.
 */

const getSetting = vi.fn()
const storage = { get: vi.fn(() => null), set: vi.fn() }

vi.mock('@/api/login', () => ({ getSetting: (...args) => getSetting(...args) }))
vi.mock('@/utils/storage', () => ({
  default: {
    get: (...args) => storage.get(...args),
    set: (...args) => storage.set(...args)
  }
}))

const { default: system } = await import('@/store/modules/system')

function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  system.state.info = {}
  return createStore({ modules: { system } })
}

describe('store/system', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
  })

  it('stores the fetched settings and mirrors them into local storage', async() => {
    getSetting.mockResolvedValue({ data: { sysName: 'go-admin', logo: '/logo.png' } })

    const result = await store.dispatch('system/settingDetail')

    expect(store.state.system.info).toEqual({ sysName: 'go-admin', logo: '/logo.png' })
    expect(storage.set).toHaveBeenCalledWith('app_info', { sysName: 'go-admin', logo: '/logo.png' })
    expect(result).toEqual({ sysName: 'go-admin', logo: '/logo.png' })
  })

  it('propagates the rejection and writes nothing', async() => {
    getSetting.mockRejectedValue(new Error('offline'))

    await expect(store.dispatch('system/settingDetail')).rejects.toThrow('offline')
    expect(storage.set).not.toHaveBeenCalled()
    expect(store.state.system.info).toEqual({})
  })
})
