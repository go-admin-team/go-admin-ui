import { setActivePinia, createPinia } from 'pinia'

/**
 * Ported from the Vuex version together with the store itself; assertions are
 * unchanged.
 *
 * The store seeds its state from local storage at creation time, so the storage
 * mock must be hoisted above the import — vi.mock does that.
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

const { useSystemStore } = await import('@/stores/system')

describe('stores/system', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useSystemStore()
  })

  it('stores the fetched settings and mirrors them into local storage', async() => {
    getSetting.mockResolvedValue({ data: { sysName: 'go-admin', logo: '/logo.png' }})

    const result = await store.settingDetail()

    expect(store.info).toEqual({ sysName: 'go-admin', logo: '/logo.png' })
    expect(storage.set).toHaveBeenCalledWith('app_info', { sysName: 'go-admin', logo: '/logo.png' })
    expect(result).toEqual({ sysName: 'go-admin', logo: '/logo.png' })
  })

  it('propagates the rejection and writes nothing', async() => {
    getSetting.mockRejectedValue(new Error('offline'))

    await expect(store.settingDetail()).rejects.toThrow('offline')
    expect(storage.set).not.toHaveBeenCalled()
    expect(store.info).toEqual({})
  })

  /**
   * The settings page writes branding straight into the store after a save, so
   * the sidebar logo updates without a refetch.
   */
  it('accepts a direct update without touching the api', () => {
    store.setInfo({ sys_app_name: 'Renamed' })

    expect(store.info).toEqual({ sys_app_name: 'Renamed' })
    expect(storage.set).toHaveBeenCalledWith('app_info', { sys_app_name: 'Renamed' })
    expect(getSetting).not.toHaveBeenCalled()
  })
})
