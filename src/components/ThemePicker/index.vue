<template>
  <el-color-picker
    v-model="theme"
    :predefine="['#1890FF', '#F5222D', '#FA541C','#FAAD14','#13C2C2', '#52C460', '#2F54EB', '#722ED1', '#00b38a', '#2878FF']"
    class="theme-picker"
    popper-class="theme-picker-dropdown"
  />
</template>

<script>
import { mapState } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { applyThemeColor } from '@/utils/theme-color'

/**
 * Picks the primary colour. Applying it lives in utils/theme-color.
 *
 * This component used to do the applying itself, by fetching element-plus's
 * entire theme-chalk stylesheet from unpkg, replacing every occurrence of the
 * previous colour in the text, and injecting the result. Two things were wrong
 * with that: it reached for an external CDN, which this project forbids because
 * intranet and offline deployments are normal; and it was written for a version
 * of Element Plus that did not yet drive its components off CSS variables.
 *
 * The work is split out rather than merely rewritten in place because the
 * colour outlives this component -- the picker only exists while the settings
 * drawer is open, and the tints have to be recomputed when the light/dark
 * setting changes, whenever that happens.
 */
export default {
  name: 'ThemePickerComponent',
  emits: ['change'],
  data() {
    return {
      theme: ''
    }
  },
  computed: {
    ...mapState(useSettingsStore, { defaultTheme: 'theme' })
  },
  watch: {
    defaultTheme: {
      handler(val) {
        this.theme = val
      },
      immediate: true
    },
    theme(val) {
      if (typeof val !== 'string' || !val) return
      applyThemeColor(val)
      this.$emit('change', val)
    }
  }
}
</script>

<style>
.theme-message,
.theme-picker-dropdown {
  z-index: 99999 !important;
}

.theme-picker .el-color-picker__trigger {
  height: 26px !important;
  width: 26px !important;
  padding: 2px;
}

.theme-picker-dropdown .el-color-dropdown__link-btn {
  display: none;
}
</style>
