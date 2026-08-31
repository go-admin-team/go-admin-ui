<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <div v-loading="loading" :style="'height:' + height">
          <iframe
            :src="src"
            frameborder="no"
            style="width: 100%; height: 100%"
            scrolling="auto"
          />
        </div>
      </el-card>
    </template>
  </BasicLayout>
</template>
<script>
export default {
  name: 'Swagger',
  components: {},
  data() {
    return {
      src: process.env.VUE_APP_BASE_API + '/swagger/admin/index.html',
      height: document.documentElement.clientHeight - 94.5 + 'px;',
      loading: true
    }
  },
  mounted() {
    setTimeout(() => {
      this.loading = false
    }, 230)
    // addEventListener rather than window.onresize, and removed on the way out.
    // Assigning to onresize gives the window one handler slot: this page and
    // the form builder both claimed it, so whichever opened second silently
    // replaced the other's -- and under keep-alive the first one's iframe then
    // stopped resizing. Neither ever cleaned up, so the closure kept a
    // reference to an unmounted component for the rest of the session.
    window.addEventListener('resize', this.fitToWindow)
  },
  unmounted() {
    window.removeEventListener('resize', this.fitToWindow)
  },
  methods: {
    fitToWindow() {
      this.height = document.documentElement.clientHeight - 94.5 + 'px;'
    }
  }
}
</script>
