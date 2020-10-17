<template>
  <div class="upload-dialog">
    <el-dialog
      v-dialogDrag
      title="上传文件"
      :visible.sync="show"
      width="30%"
      @close="cancel"
    >
      <upload-form @confirm="confirm" @cancel="cancel" />
    </el-dialog>
  </div>
</template>

<script>
import UploadForm from './form'
export default {
  name: 'UploadDialog',
  components: {
    UploadForm
  },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {

    }
  },
  mounted() {

  },
  methods: {
    confirm(e) {
      this.$emit('confirm', e)
    },
    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss" scoped>
  .upload-dialog /deep/ {
    .el-dialog__body{
      padding: 30px 20px 0 20px;
    }
  }
</style>
