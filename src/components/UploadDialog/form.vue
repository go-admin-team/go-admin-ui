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
    </el-form>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="文件" name="1">
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          :action="url"
          :auto-upload="false"
          :limit="limit"
          :on-exceed="handleLimit"
          :http-request="uploadFile"
          multiple
        >
          <i class="el-icon-upload" />
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
      </el-tab-pane>
      <el-tab-pane label="Base64文件" name="2">
        <el-input
          v-model="form.base64"
          type="textarea"
          :autosize="{ minRows: 7, maxRows: 8 }"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="dialog-footer">
      <el-button @click="cancel">关 闭</el-button>
      <el-button type="primary" @click="confirm">提 交</el-button>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'
export default {
  name: 'UploadForm',
  data() {
    return {
      url: process.env.VUE_APP_BASE_API + '/api/v1/public/uploadFile',
      activeTab: '1',
      form: {
        dataSource: '1',
        base64: ''
      },
      formData: '',
      limit: 10
    }
  },
  mounted() {},
  methods: {
    handleLimit(e) {
      if (e.length > this.limit) {
        this.$message({
          message: `最大单次只可上传${this.limit}条`,
          type: 'warning'
        })
      }
    },
    uploadFile(file) {
      this.formData.append('file', file.file)
    },
    confirm() {
      if (this.activeTab === '2') {
        this.formData = new FormData()
        this.formData.append('file', this.form.base64)
        this.formData.append('type', '3')
      } else {
        this.formData = new FormData()
        this.$refs.upload.submit()
        this.formData.append('type', '2')
      }
      request.post(this.url, this.formData, {
        'Content-Type': 'multipart/form-data'
      }).then(ret => {
        if (ret.code === 200) {
          this.form.base64 = ''
          this.$refs.upload.clearFiles()
          this.$emit('confirm', Array.isArray(ret.data) ? ret.data : [ret.data])
        }
      })
    },
    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style lang="scss" scoped>
.form /deep/ {
  .el-upload {
    width: 100%;
  }
  .el-upload-dragger {
    width: 100%;
  }
}
.dialog-footer {
  padding: 30px 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
