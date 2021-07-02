<template>
  <div class="upload-container">
    <el-button :style="{background:color,borderColor:color}" icon="el-icon-upload" size="mini" type="primary" @click="handleFile">
      upload
    </el-button>
    <file-choose :dialog-form-visible="dialogVisible" @close="handleFileClose" @confirm="handleFileConfirm" />
  </div>
</template>

<script>
// import { getToken } from 'api/qiniu'

import FileChoose from '../../FileChoose/index'
export default {
  name: 'EditorSlideUpload',
  components: {
    FileChoose
  },
  props: {
    color: {
      type: String,
      default: '#1890ff'
    }
  },
  data() {
    return {
      dialogVisible: false,
      listObj: {},
      fileList: []
    }
  },
  methods: {
    checkAllSuccess() {
      return Object.keys(this.listObj).every(item => this.listObj[item].hasSuccess)
    },
    handleFile() {
      this.dialogVisible = !this.dialogVisible
    },
    handleFileClose() {
      this.dialogVisible = false
    },
    handleFileConfirm(e) {
      this.dialogVisible = false
      this.$emit('successCBK', e)
    }
  }
}
</script>

<style lang="scss" scoped>
.editor-slide-upload {
  margin-bottom: 20px;
  ::v-deep .el-upload--picture-card {
    width: 100%;
  }
}
</style>
