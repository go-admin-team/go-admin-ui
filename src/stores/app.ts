import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

export type DeviceType = 'desktop' | 'mobile'

/**
 * Sidebar collapse state, viewport class and component size.
 *
 * Sidebar and size are mirrored into cookies so they survive a reload; that
 * persistence is part of the contract, not an implementation detail.
 *
 * Ported from src/store/modules/app.js. Behaviour is covered by
 * tests/unit/store/app.spec.js.
 */
export const useAppStore = defineStore('app', {
  state: () => {
    // Read once instead of calling Cookies.get twice as the Vuex version did:
    // the two reads were independent and could in principle disagree.
    const sidebarStatus = Cookies.get('sidebarStatus')
    return {
      sidebar: {
        opened: sidebarStatus ? !!+sidebarStatus : true,
        withoutAnimation: false
      },
      device: 'desktop' as DeviceType,
      size: Cookies.get('size') || 'medium'
    }
  },

  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
      Cookies.set('sidebarStatus', this.sidebar.opened ? '1' : '0')
    },

    closeSideBar({ withoutAnimation }: { withoutAnimation: boolean }) {
      Cookies.set('sidebarStatus', '0')
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
    },

    toggleDevice(device: DeviceType) {
      this.device = device
    },

    setSize(size: string) {
      this.size = size
      Cookies.set('size', size)
    }
  }
})
