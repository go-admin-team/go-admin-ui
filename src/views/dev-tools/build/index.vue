<template>
  <iframe class="iframe-fullscreen" :src="iframeURL"></iframe>
</template>
<script setup>
const iframeURL = `${import.meta.env.VITE_APP_BASE_URL}/form-generator/index.html`;
</script>