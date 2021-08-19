<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-tabs tab-position="left" style="height: 100%;">
          <el-tab-pane label="系统内置">
            <el-form label-width="80px">
              <div class="test-form">
                <el-form ref="form" :model="form" :rules="rules" size="small" label-width="100px">
                  <el-form-item label="系统名称" prop="sys_app_name">
                    <el-input v-model="form.sys_app_name" placeholder="请输入系统名称" clearable :style="{width: '100%'}" />
                  </el-form-item>
                  <el-form-item label="系统logo" prop="sys_app_logo" required>
                    <img v-if="form.sys_app_logo" :src="form.sys_app_logo" class="el-upload el-upload--picture-card" style="float:left">
                    <el-upload ref="sys_app_logo" :headers="headers" :file-list="sys_app_logofileList" :action="sys_app_logoAction" style="float:left" :before-upload="sys_app_logoBeforeUpload" list-type="picture-card" :show-file-list="false" :on-success="uploadSuccess">
                      <i class="el-icon-plus" />
                    </el-upload>
                  </el-form-item>
                  <el-form-item label="初始密码" prop="sys_user_initPassword">
                    <el-input v-model="form.sys_user_initPassword" placeholder="请输入初始密码" clearable :style="{width: '100%'}" />
                  </el-form-item>
                  <el-form-item label="皮肤样式" prop="sys_index_skinName">
                    <el-select v-model="form.sys_index_skinName" placeholder="请选择皮肤样式" clearable :style="{width: '100%'}">
                      <el-option v-for="(item, index) in sys_index_skinNameOptions" :key="index" :label="item.label" :value="item.value" :disabled="item.disabled" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="侧栏主题" prop="sys_index_sideTheme">
                    <el-select v-model="form.sys_index_sideTheme" placeholder="请选择侧栏主题" clearable :style="{width: '100%'}">
                      <el-option v-for="(item, index) in sys_index_sideThemeOptions" :key="index" :label="item.label" :value="item.value" :disabled="item.disabled" />
                    </el-select>
                  </el-form-item>
                  <el-form-item size="large">
                    <el-button type="primary" @click="submitForm">提交</el-button>
                    <el-button @click="resetForm">重置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="其他">其他</el-tab-pane>
        </el-tabs>

      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import {
  getSetConfig,
  updateSetConfig
} from '@/api/admin/sys-config'

import { getToken } from '@/utils/auth'

export default {
  name: 'SysConfigSet',
  components: {
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 参数表格数据
      configList: [],
      formConf: {},
      headers: { 'Authorization': 'Bearer ' + getToken() },
      form: {
        sys_app_name: undefined,
        sys_app_logo: null,
        sys_user_initPassword: undefined,
        sys_index_skinName: undefined,
        sys_index_sideTheme: undefined
      },
      rules: {
        sys_app_name: [{
          required: true,
          message: '请输入系统名称',
          trigger: 'blur'
        }],
        sys_user_initPassword: [{
          required: true,
          message: '请输入初始密码',
          trigger: 'blur'
        }],
        sys_index_skinName: [{
          required: true,
          message: '请选择皮肤样式',
          trigger: 'change'
        }],
        sys_index_sideTheme: [{
          required: true,
          message: '请选择侧栏主题',
          trigger: 'change'
        }]
      },
      sys_app_logoAction: 'http://localhost:8000/api/v1/public/uploadFile',
      sys_app_logofileList: [],
      sys_index_skinNameOptions: [{
        'label': '蓝色',
        'value': 'skin-blue'
      }],
      sys_index_sideThemeOptions: [{
        'label': '深色主题',
        'value': 'theme-dark'
      }]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    submitForm() {
      console.log(this.form)
      this.$refs['form'].validate(valid => {
        if (!valid) return
        console.log(this.form)
        var list = []
        var i = 0
        for (var key in this.form) {
          list[i] = {
            'configKey': key,
            'configValue': this.form[key]
          }
          i++
        }
        updateSetConfig(list).then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg)
            this.open = false
            this.getList()
          } else {
            this.msgError(response.msg)
          }
        })
      })
    },
    resetForm() {
      this.$refs['form'].resetFields()
    },
    sys_app_logoBeforeUpload(file) {
      const isRightSize = file.size / 1024 / 1024 < 2
      if (!isRightSize) {
        this.$message.error('文件大小超过 2MB')
      }
      return isRightSize
    },
    uploadSuccess(response, file, fileList) {
      console.log('sss')
      this.form.sys_app_logo = process.env.VUE_APP_BASE_API + response.data.full_path
      console.log(response.data.full_path)
    },
    /** 查询参数列表 */
    getList() {
      this.loading = true
      getSetConfig().then(response => {
        this.configList = response.data
        this.loading = false
        this.form = this.configList
        // this.sys_app_logofileList = [this.configList.sys_app_logo]
        // this.fillFormData(this.elForm, this.configList)
        // 更新表单
        // this.key2 = +new Date()
      })
    },
    setUrl(url) {
      const data = {
        sys_app_logo: ''
      }
      data.sys_app_logo = url
      // 回填数据
      this.fillFormData(this.formConf, data)
      // 更新表单
      this.key2 = +new Date()
    },
    // 参数系统内置字典翻译
    typeFormat(row, column) {
      return this.selectDictLabel(this.typeOptions, row.configType)
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    fillFormData(form, data) {
      form.fields.forEach(item => {
        const val = data[item.__vModel__]
        if (val) {
          item.__config__.defaultValue = val
        }
      })
    },
    bind(key, data) {
      this.setUrl(data)
    },
    sumbitForm2(data) {
      var list = []
      var i = 0
      for (var key in data) {
        list[i] = {
          'configKey': key,
          'configValue': data[key]
        }
        i++
      }
      updateSetConfig(list).then(response => {
        if (response.code === 200) {
          this.msgSuccess(response.msg)
          this.open = false
          this.getList()
        } else {
          this.msgError(response.msg)
        }
      })
    }
  }
}
</script>
