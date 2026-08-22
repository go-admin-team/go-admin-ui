<template>
  <button type="button" class="settings-trigger" :title="title" @click="$emit('click')">
    <i class="ri-settings-3-line" />
  </button>
</template>

<script>
/**
 * Opens the layout settings drawer.
 *
 * A single-purpose component so it mounts in the navbar icon row alongside
 * Hamburger and Screenfull rather than as inline markup.
 *
 * A real <button> rather than a div with role="button": that gives keyboard
 * activation on both Enter and Space for free, where the div form needs an
 * explicit tabindex plus a keyup handler duplicating the click one -- and only
 * ever handles Enter. The sibling icons in that row are still divs; this is the
 * shape they should take when they are migrated.
 */
export default {
  name: 'AppSettingsTrigger',
  props: {
    title: {
      type: String,
      default: '系统布局配置'
    }
  },
  emits: ['click']
}
</script>

<style lang="scss" scoped>
.settings-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--ga-brand);
    outline-offset: 2px;
    border-radius: var(--ga-radius-sm);
  }
}
</style>
