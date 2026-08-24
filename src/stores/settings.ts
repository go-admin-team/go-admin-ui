import { defineStore } from 'pinia'
import variables from '@/styles/element-variables.module.scss'
import defaultSettings from '@/settings'
import { applyColorScheme, initColorScheme } from '@/utils/color-scheme'
import type { ColorScheme } from '@/utils/color-scheme'

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
  | 'colorScheme'

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
    /** Rail surface: light or dark. Not the same axis as colorScheme below. */
    themeStyle,
    /**
     * Light, dark or follow the OS.
     *
     * Seeded from what is stored rather than from defaultSettings, because the
     * snippet in index.html has already painted the page from that same value
     * -- reading anything else here would leave the drawer disagreeing with
     * what is on screen. src/utils/color-scheme.ts owns the rules.
     */
    colorScheme: initColorScheme()
  }),

  actions: {
    /**
     * Unknown keys are ignored rather than added, keeping the settings surface a
     * closed set — same guard the Vuex mutation had via hasOwnProperty.
     */
    changeSetting({ key, value }: { key: SettingKey, value: unknown }) {
      if (key === 'colorScheme') {
        // The only setting with an effect outside the store: it puts the class
        // on <html> and remembers the choice.
        applyColorScheme(value as ColorScheme)
      }

      if (Object.prototype.hasOwnProperty.call(this.$state, key)) {
        // Object.assign rather than indexed assignment: the key is validated at
        // runtime above, and a union-typed index cannot be narrowed for writes.
        Object.assign(this.$state, { [key]: value })
      }
    }
  }
})
