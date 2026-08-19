<template>
  <el-tag :type="type" disable-transitions>{{ method }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * An HTTP method as a coloured tag.
 *
 * The colour is part of how the method reads at a glance -- red for DELETE is
 * the point -- so it belongs with the tag rather than in each page.
 *
 * The menu page's permission popover and the operation log's method column both
 * use it. sys-api has the same mapping written as four stacked `v-if` tags; it
 * is still Options API and gets this when it migrates.
 */

defineOptions({ name: 'MethodTag' })

const props = defineProps<{ method?: string }>()

type TagType = 'primary' | 'success' | 'warning' | 'danger'

const COLOURS: Record<string, TagType> = {
  GET: 'primary',
  POST: 'success',
  PUT: 'warning',
  DELETE: 'danger'
}

// PATCH, HEAD and anything else fall back rather than passing el-tag an empty
// string, which is not a legal `type` and warns on every render
const type = computed<TagType>(() => COLOURS[props.method?.toUpperCase() ?? ''] ?? 'primary')
</script>
