<template>
  <span :title="full">{{ short }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseTime } from '@/utils/costum'

/**
 * A timestamp in a table cell: date in the column, full value on hover.
 *
 * Exists because the column form is not obvious and gets copied. A sortable
 * header plus "2026-08-01 14:00" needs roughly 141px, which is a quarter of what
 * the flexible columns in a nine-column table have between them -- spend it and
 * the cell wraps, adding 14px to every row. Showing the date and keeping the
 * time on the title attribute costs 110px and loses nothing.
 *
 * Every list page has a 创建时间 column, so this lives here rather than being
 * pasted into each one: a change of format, or a move to relative time, is then
 * one edit instead of one per page.
 */
defineOptions({ name: 'DateCell' })

const props = withDefaults(defineProps<{
  value?: string | number | Date | null
  /** Pattern for the visible text. The title always shows date and time. */
  pattern?: string
}>(), {
  value: null,
  pattern: '{y}-{m}-{d}'
})

const short = computed(() => parseTime(props.value, props.pattern) ?? '')
const full = computed(() => parseTime(props.value) ?? '')
</script>
