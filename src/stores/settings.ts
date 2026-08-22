import { defineStore } from 'pinia'
import variables from '@/styles/element-variables.module.scss'
import defaultSettings from '@/settings'

const { showSettings, topNav, tagsView, fixedHeader, sidebarLogo, themeStyle } = defaultSettings

/** Keys the settings drawer is allowed to write */
export type SettingKey =
  | 'theme'
  | 'showSettings'
  | 'topNav'
  | 'tagsView'
  | 'fixedHeader'
  | 'sidebarLogo'
  | 'themeStyle'

/**
 * Layout preferences driven by the right-hand settings drawer.
 *
 * Ported from src/store/modules/settings.js. Behaviour is covered by
 * tests/unit/store/settings.spec.js.
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: variables.theme as string,
    showSettings,
    topNav,
    tagsView,
    fixedHeader,
    sidebarLogo,
    themeStyle
  }),

  actions: {
    /**
     * Unknown keys are ignored rather than added, keeping the settings surface a
     * closed set — same guard the Vuex mutation had via hasOwnProperty.
     */
    changeSetting({ key, value }: { key: SettingKey, value: unknown }) {
      if (Object.prototype.hasOwnProperty.call(this.$state, key)) {
        // Object.assign rather than indexed assignment: the key is validated at
        // runtime above, and a union-typed index cannot be narrowed for writes.
        Object.assign(this.$state, { [key]: value })
      }
    }
  }
})
