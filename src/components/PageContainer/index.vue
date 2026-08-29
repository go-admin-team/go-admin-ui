<template>
  <div class="page-container">
    <el-card v-if="card" class="page-container__body" shadow="never">
      <slot />
    </el-card>
    <div v-else class="page-container__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Page shell: consistent padding and the surrounding card.
 *
 * Supersedes BasicLayout, which offered padding through a named `#wrapper` slot
 * -- so every page opened with a template block whose only purpose was to fill
 * a slot, and then repeated `<el-card class="box-card">` inside it.
 *
 * Deliberately has no title or description: the breadcrumb already names the
 * page, and a heading that repeats it costs vertical space on every screen. Add
 * one here when a page actually needs page-level actions, together with the
 * page that needs them.
 */
defineOptions({ name: 'PageContainer' })

withDefaults(defineProps<{
  /** Wrap the content in a card. Turn off for pages that manage their own panels. */
  card?: boolean
}>(), {
  card: true
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 12px;
  box-sizing: border-box;
}

/*
 * Edge to edge on a phone.
 *
 * The 12px gutter plus the card's own border and radius spend roughly 30px of a
 * 375px screen on framing content that has nothing beside it to be framed
 * against. On a desktop the card separates the page from a wide grey field;
 * on a phone it is the whole viewport.
 */
@media (max-width: 767px) {
  .page-container { padding: 0; }

  .page-container__body {
    border: 0;
    border-radius: 0;
  }

  :deep(.el-card__body) { padding: 12px; }
}
</style>
