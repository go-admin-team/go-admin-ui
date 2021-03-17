<template>
  <div>
    <Layout>
      <div slot="main" class="main">
        <el-form ref="ruleForm" :model="ruleForm" :rules="rules" label-width="100px" class="demo-ruleForm">
          <el-form-item label="系统名称" prop="name">
            <el-input v-model="ruleForm.name" />
          </el-form-item>
          <el-form-item label="系统logo" prop="logo">
            <el-input v-model="ruleForm.logo" type="hidden" style="display: none" />
            <div class="avatar-uploader" @click="fileShowlogo">
              <img v-if="ruleForm.logo" :src="ruleForm.logo" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon" />
            </div>
            <!-- <el-button type="primary" @click="fileShowlogo">选择文件</el-button> -->
          </el-form-item>

          <!-- <el-form-item>
            <el-button v-permisaction="['system:system:edit']" type="primary" @click="submitForm('ruleForm')">确定</el-button>
          </el-form-item> -->
        </el-form>
        <FileChoose ref="fileChoose" :dialog-form-visible="fileOpen" @confirm="getImgList" @close="fileClose" />
      </div>
    </Layout>
  </div>
</template>

<script>
import Layout from '@/components/layout'
import FileChoose from '@/components/FileChoose'

export default {
  name: 'Setting',
  components: {
    Layout,
    FileChoose
  },
  data() {
    return {
      isEdit: false,
      fileOpen: false,
      fileIndex: undefined,
      url: process.env.VUE_APP_BASE_API + '/api/v1/public/uploadFile',
      ruleForm: {
        name: this.$store.state.system.info.name,
        logo: this.$store.state.system.info.logo,
        settings_id: this.$store.state.system.info.settings_id
      },
      rules: {
        name: [
          { required: true, message: '请输入系统名称', trigger: 'blur' },
          { min: 3, max: 30, message: '长度在 3 到 30 个字符', trigger: 'blur' }
        ],
        logo: [
          { required: true, message: '请选择系统头像', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.ruleForm.validate((valid) => {
        if (valid) {
          this.$store.dispatch('system/updateSetting', this.ruleForm).then(ret => {
            if (ret) {
              this.msgSuccess(ret.msg)
              const str1 = document.title.split('-')[0]
              document.title = str1 + ' - ' + ret.data.name
            }
          })
        } else {
          return false
        }
      })
    },
    fileShowlogo() {
      this.fileOpen = true
      this.fileIndex = 'logo'
    },
    getImgList() {
      this.ruleForm[this.fileIndex] = this.$refs['fileChoose'].resultList[0].fullUrl
    },
    fileClose() {
      this.fileOpen = false
    }
  }
}
</script>

<style lang="scss" >
  .main{
    background: #fff;
    padding: 20px;
    box-sizing: border-box;
    box-shadow: 0 0 4px 0 rgba(200, 200, 200, 0.5);
  }
  .avatar-uploader {
    .el-upload {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      &:hover {
         border-color: #409EFF;
       }
    }
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }
</style>
