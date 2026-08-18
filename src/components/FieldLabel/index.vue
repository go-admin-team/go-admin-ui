<template>
  <span class="field-label">
    {{ label }}
    <el-tooltip v-if="tip" :content="tip" placement="top">
      <i class="ri-question-line field-label__hint" />
    </el-tooltip>
  </span>
</template>

<script setup lang="ts">
/**
 * A form label with an explanation behind a question mark.
 *
 * The menu form has seven fields whose meaning is not obvious from the label --
 * what a component path is relative to, what "external link" does, why a hidden
 * menu still has a reachable route. Each was a six-line `#label` template block
 * repeating the same tooltip markup.
 */
defineOptions({ name: 'FieldLabel' })

defineProps<{
  label: string
  /** Omit for a plain label. */
  tip?: string
}>()
</script>

<style lang="scss" scoped>
.field-label__hint {
  margin-left: 2px;
  color: var(--ga-text-3);
  cursor: help;

  &:hover {
    color: var(--ga-brand);
  }
}
</style>
