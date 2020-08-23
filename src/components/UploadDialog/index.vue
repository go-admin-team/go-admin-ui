<template>
  <div class="upload-dialog">
    <el-dialog
      v-dialogDrag
      title="上传文件"
      @close="cancel"
      :visible.sync="show"
      width="30%">
      <upload-form />
      <span slot="footer" class="dialog-footer">
        <el-button @click="confirm">取 消</el-button>
        <el-button type="primary" @click="cancel">确 定</el-button>
      </span>
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
    confirm() {
      this.$emit('confirm')
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
