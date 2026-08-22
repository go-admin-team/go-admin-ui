<template>
  <div ref="rightPanel" :class="{show:show}" class="rightPanel-container">
    <div class="rightPanel-background" />
    <div class="rightPanel">
      <div class="rightPanel-head">
        <span class="rightPanel-title">系统布局配置</span>
        <button type="button" class="rightPanel-close" title="关闭" @click="show = false">
          <i class="ri-close-line" />
        </button>
      </div>
      <div class="rightPanel-items">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { addClass, removeClass } from '@/utils'
import { useSettingsStore } from '@/stores/settings'

export default {
  name: 'RightPanel',
  props: {
    /** Drawer visibility. Owned by the layout, toggled from the navbar. */
    modelValue: {
      default: false,
      type: Boolean
    },
    clickNotClose: {
      default: false,
      type: Boolean
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      /** Timer handle for the pending listener registration; see addEventClick. */
      pendingRegistration: 0
    }
  },
  computed: {
    ...mapState(useSettingsStore, ['theme']),
    show: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    }
  },
  watch: {
    show(value) {
      if (value && !this.clickNotClose) {
        this.addEventClick()
      }
      if (value) {
        addClass(document.body, 'showRightPanel')
      } else {
        removeClass(document.body, 'showRightPanel')
      }
    }
  },
  mounted() {
    this.insertToBody()
  },
  beforeUnmount() {
    // The listener is taken off by a click that lands outside the panel -- and
    // closing with the ✕ is a click inside it, so that path deliberately leaves
    // it registered. The drawer sits behind `v-if="showSettings"`, so the
    // component can go away while it is still attached: without this it stays
    // on window for the rest of the session, firing on every click and holding
    // an unmounted instance. Clearing the timer matters too, or a registration
    // already in flight lands after the cleanup has run.
    clearTimeout(this.pendingRegistration)
    window.removeEventListener('click', this.closeSidebar)

    const elx = this.$refs.rightPanel
    elx.remove()
  },
  methods: {
    addEventClick() {
      // Registered after the opening click has finished propagating. Otherwise
      // that same click reaches this listener, closest('.rightPanel') does not
      // match the trigger outside the drawer, and it closes in the tick it
      // opened.
      //
      // Reopening schedules another of these, but every one passes the same
      // bound method and the DOM keeps one registration per (type, callback)
      // pair -- so they do not stack up. The handle is kept for beforeUnmount.
      this.pendingRegistration = setTimeout(
        () => window.addEventListener('click', this.closeSidebar), 0
      )
    },
    closeSidebar(evt) {
      const parent = evt.target.closest('.rightPanel')
      if (!parent) {
        this.show = false
        window.removeEventListener('click', this.closeSidebar)
      }
    },
    insertToBody() {
      const elx = this.$refs.rightPanel
      const body = document.querySelector('body')
      body.insertBefore(elx, body.firstChild)
    }
  }
}
</script>

<style>
.showRightPanel {
  overflow: hidden;
  position: relative;
  width: calc(100% - 15px);
}
</style>

<style lang="scss" scoped>
.rightPanel-background {
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity .3s cubic-bezier(.7, .3, .1, 1);
  background: rgba(0, 0, 0, .2);
  z-index: -1;
}

.rightPanel {
  width: 100%;
  max-width: 300px;
  height: 100vh;
  position: fixed;
  top: 0;
  right: 0;
  box-shadow: 0px 0px 15px 0px rgba(0, 0, 0, .05);
  transition: all .25s cubic-bezier(.7, .3, .1, 1);
  transform: translate(100%);
  background: var(--ga-bg-container);
  z-index: 40000;
}

.show {
  transition: all .3s cubic-bezier(.7, .3, .1, 1);

  .rightPanel-background {
    z-index: 20000;
    opacity: 1;
    width: 100%;
    height: 100%;
  }

  .rightPanel {
    transform: translate(0);
  }
}

.rightPanel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--ga-border-light);
}

.rightPanel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ga-text-1);
}

.rightPanel-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--ga-radius-sm);
  background: transparent;
  color: var(--ga-text-2);
  font-size: 18px;
  cursor: pointer;

  &:hover {
    background: var(--ga-bg-subtle);
    color: var(--ga-text-1);
  }
}
</style>
