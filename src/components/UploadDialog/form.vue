<template>
  <div class="form">
    <el-form ref="form" :model="form" label-width="100px" label-position="left">
      <el-form-item label="上传数据源">
        <el-radio-group v-model="form.dataSource">
          <el-radio-button label="1">本地</el-radio-button>
          <el-radio-button label="2">阿里云OSS</el-radio-button>
          <el-radio-button label="3">七牛云</el-radio-button>
          <el-radio-button label="4">腾讯云COS</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="Base64文件" clearable>
        <el-input v-model="form.base64"></el-input>
      </el-form-item>
      <el-form-item label="文件">
        <el-upload
          class="upload-demo"
          drag
          action="https://jsonplaceholder.typicode.com/posts/"
          multiple>
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'UploadForm',
  data() {
    return {
      form: {
        dataSource: '1',
        base64: ''
      }
    }
  },
  mounted() {

  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.form /deep/ {
  .el-upload{
    width: 100%;
  }
  .el-upload-dragger{
    width: 100%;
  }
}
</style>
