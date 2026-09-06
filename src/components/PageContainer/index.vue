<template>
  <div class="page-container">
    <el-card v-if="card" class="page-container__body" shadow="never">
      <slot />
    </el-card>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
/**
 * Page shell: consistent padding, and a card for the pages that want one.
 *
 * Supersedes BasicLayout, which offered padding through a named `#wrapper` slot
 * -- so every page opened with a template block whose only purpose was to fill
 * a slot, and then repeated `<el-card class="box-card">` inside it.
 *
 * The card is off by default because a list page no longer wants one: ProTable
 * draws its own two, and a card around them puts a border round a pair of
 * borders. Pages that are a single surface -- a form, a console -- pass `card`
 * and get the panel back.
 *
 * Deliberately has no title or description: the breadcrumb already names the
 * page, and a heading that repeats it costs vertical space on every screen. Add
 * one here when a page actually needs page-level actions, together with the
 * page that needs them.
 */
defineOptions({ name: 'PageContainer' })

withDefaults(defineProps<{
  /** Wrap the content in a card. Off by default; pages that draw their own panels need nothing. */
  card?: boolean
}>(), {
  card: false
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
 * The 12px gutter plus a card's border and radius spend roughly 30px of a 375px
 * screen on framing content that has nothing beside it to be framed against. On
 * a desktop a card separates the page from a wide grey field; on a phone it is
 * the whole viewport.
 *
 * The border rule is for this component's own card; the padding one is written
 * against every card under the container, so it also reaches the pair ProTable
 * draws, which is what most list pages have here instead.
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
