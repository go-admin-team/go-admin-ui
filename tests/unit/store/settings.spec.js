import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import defaultSettings from '@/settings'

/**
 * Ported from the Vuex version together with the store itself; assertions are
 * unchanged.
 */
describe('stores/settings', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSettingsStore()
  })

  it('seeds its state from src/settings.js', () => {
    expect(store.tagsView).toBe(defaultSettings.tagsView)
    expect(store.fixedHeader).toBe(defaultSettings.fixedHeader)
    expect(store.themeStyle).toBe(defaultSettings.themeStyle)
  })

  it('updates a known setting', () => {
    store.changeSetting({ key: 'fixedHeader', value: false })

    expect(store.fixedHeader).toBe(false)
  })

  /**
   * changeSetting is guarded by hasOwnProperty, so unknown keys are dropped
   * instead of extending the state. The settings drawer relies on this to stay
   * a closed set.
   */
  it('ignores keys that do not already exist on the state', () => {
    store.changeSetting({ key: 'notARealSetting', value: 1 })

    expect(store.notARealSetting).toBeUndefined()
  })

  it('accepts every key the settings drawer writes', () => {
    for (const key of ['theme', 'topNav', 'tagsView', 'fixedHeader', 'sidebarLogo', 'themeStyle']) {
      store.changeSetting({ key, value: 'changed' })
      expect(store[key]).toBe('changed')
    }
  })
})
