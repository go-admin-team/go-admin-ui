import { createStore } from 'vuex'
import settings from '@/store/modules/settings'
import defaultSettings from '@/settings'

/**
 * Behaviour lock for the settings module ahead of the Vuex -> Pinia port (P1).
 */
function makeStore() {
  // state is a shared object literal, not a factory — reset between tests
  Object.assign(settings.state, {
    showSettings: defaultSettings.showSettings,
    topNav: defaultSettings.topNav,
    tagsView: defaultSettings.tagsView,
    fixedHeader: defaultSettings.fixedHeader,
    sidebarLogo: defaultSettings.sidebarLogo,
    themeStyle: defaultSettings.themeStyle
  })
  return createStore({ modules: { settings } })
}

describe('store/settings', () => {
  let store

  beforeEach(() => {
    store = makeStore()
  })

  it('seeds its state from src/settings.js', () => {
    expect(store.state.settings.tagsView).toBe(defaultSettings.tagsView)
    expect(store.state.settings.fixedHeader).toBe(defaultSettings.fixedHeader)
    expect(store.state.settings.themeStyle).toBe(defaultSettings.themeStyle)
  })

  it('updates a known setting', () => {
    store.dispatch('settings/changeSetting', { key: 'fixedHeader', value: false })

    expect(store.state.settings.fixedHeader).toBe(false)
  })

  /**
   * CHANGE_SETTING is guarded by hasOwnProperty, so unknown keys are dropped
   * instead of extending the state object. The RightPanel settings drawer relies
   * on this to stay a closed set.
   */
  it('ignores keys that do not already exist on the state', () => {
    store.dispatch('settings/changeSetting', { key: 'notARealSetting', value: 1 })

    expect(store.state.settings.notARealSetting).toBeUndefined()
  })
})
