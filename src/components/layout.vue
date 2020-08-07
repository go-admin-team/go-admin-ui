<template>
  <div class="app-container" :style="{ background:bg }">
    <div class="app-container-section">
      <slot name="main" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Layout',
  props: {
    bg: {
      type: String,
      default: '#f0f1f5'
    }
  }
}
</script>

<style lang="scss" scoped>
  .app-container{
    padding: 10px;
    background: #f0f1f5;
  }
</style>
