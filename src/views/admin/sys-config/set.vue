<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-tabs tab-position="left" style="height: 100%;">
          <el-tab-pane label="系统内置">
            <el-form label-width="80px">
              <div class="test-form">
                <parser :key="key2" :form-conf="formConf" @submit="sumbitForm2" @bind="bind" />
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
import { getSetConfig, updateSetConfig } from '@/api/admin/sys-config'
import Parser from '@/components/FormGenParser/Parser'

export default {
  name: 'SysConfigSet',
  components: {
    Parser
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      // 参数表格数据
      configList: [],
      key2: +new Date(),
      formConf: {}
    }
  },
  created() {
    this.formConf = {
      'fields': [{
        '__config__': {
          'label': '系统名称',
          'labelWidth': null,
          'showLabel': true,
          'changeTag': true,
          'tag': 'el-input',
          'tagIcon': 'input',
          'required': true,
          'layout': 'colFormItem',
          'span': 24,
          'document': 'https://element.eleme.cn/#/zh-CN/component/input',
          'regList': [],
          'formId': 103,
          'renderKey': 1621935615221
        },
        '__slot__': {
          'prepend': '',
          'append': ''
        },
        'placeholder': '请输入系统名称',
        'style': {
          'width': '100%'
        },
        'clearable': true,
        'prefix-icon': '',
        'suffix-icon': '',
        'maxlength': null,
        'show-word-limit': false,
        'readonly': false,
        'disabled': false,
        '__vModel__': 'sys_app_name'
      }, {
        '__config__': {
          'label': '系统logo',
          'tag': 'el-upload',
          'tagIcon': 'upload',
          'layout': 'colFormItem',
          'defaultValue': null,
          'showLabel': true,
          'labelWidth': null,
          'required': false,
          'span': 24,
          'showTip': false,
          'buttonText': '点击上传',
          'regList': [],
          'changeTag': true,
          'fileSize': 2,
          'sizeUnit': 'MB',
          'document': 'https://element.eleme.cn/#/zh-CN/component/upload',
          'formId': 102,
          'renderKey': 1621935611177
        },
        '__slot__': {
          'list-type': true
        },
        'action': 'http://localhost:8000/api/v1/public/uploadFile',
        'disabled': false,
        'accept': 'image/*',
        'name': 'file',
        'v-if': 'fileList',
        'auto-upload': true,
        'on-success': function(response, file, fileList) {
          this.fileList[0] = { 'url': response.data.full_path }
          this.$parent.$parent.$parent.$parent.$parent.$parent.$emit('bind', 'sys_app_logo', response.data.full_path)
          return true
        },
        'props': {
          'file-list': []
        },
        'list-type': 'picture-card',

        'multiple': false,
        '__vModel__': 'sys_app_logo'
      }, {
        '__config__': {
          'label': '初始密码',
          'labelWidth': null,
          'showLabel': true,
          'changeTag': true,
          'tag': 'el-input',
          'tagIcon': 'input',
          'required': true,
          'layout': 'colFormItem',
          'span': 24,
          'document': 'https://element.eleme.cn/#/zh-CN/component/input',
          'regList': [],
          'formId': 101,
          'renderKey': 1621935520984
        },
        '__slot__': {
          'prepend': '',
          'append': ''
        },
        'placeholder': '请输入初始密码',
        'style': {
          'width': '100%'
        },
        'clearable': true,
        'prefix-icon': 'el-icon-key',
        'suffix-icon': '',
        'maxlength': null,
        'show-word-limit': false,
        'readonly': false,
        'disabled': false,
        '__vModel__': 'sys_user_initPassword'
      }, {
        '__config__': {
          'label': '皮肤样式',
          'showLabel': true,
          'labelWidth': null,
          'tag': 'el-select',
          'tagIcon': 'select',
          'layout': 'colFormItem',
          'span': 24,
          'required': true,
          'regList': [],
          'changeTag': true,
          'document': 'https://element.eleme.cn/#/zh-CN/component/select',
          'formId': 104,
          'renderKey': 1621935674152
        },
        '__slot__': {
          'options': [{
            'label': '蓝色',
            'value': 'skin-blue'
          }, {
            'label': '绿色',
            'value': 'skin-green'
          }, {
            'label': '紫色',
            'value': 'skin-purple'
          }, {
            'label': '红色',
            'value': 'skin-red'
          }, {
            'label': '黄色',
            'value': 'skin-yellow'
          }]
        },
        'placeholder': '请选择皮肤样式',
        'style': {
          'width': '100%'
        },
        'clearable': true,
        'disabled': false,
        'filterable': false,
        'multiple': false,
        '__vModel__': 'sys_index_skinName'
      }, {
        '__config__': {
          'label': '侧栏主题',
          'showLabel': true,
          'labelWidth': null,
          'tag': 'el-select',
          'tagIcon': 'select',
          'layout': 'colFormItem',
          'span': 24,
          'required': true,
          'regList': [],
          'changeTag': true,
          'document': 'https://element.eleme.cn/#/zh-CN/component/select',
          'formId': 106,
          'renderKey': 1621935704111
        },
        '__slot__': {
          'options': [{
            'label': '深色主题',
            'value': 'theme-dark'
          }, {
            'label': '浅色主题',
            'value': 'theme-light'
          }]
        },
        'placeholder': '请选择侧栏主题',
        'style': {
          'width': '100%'
        },
        'clearable': true,
        'disabled': false,
        'filterable': false,
        'multiple': false,
        '__vModel__': 'sys_index_sideTheme'
      }
      ],
      'formRef': 'elForm',
      'formModel': 'formData',
      'size': 'medium',
      'labelPosition': 'right',
      'labelWidth': 100,
      'formRules': 'rules',
      'gutter': 15,
      'disabled': false,
      'span': 24,
      'formBtns': true
    }

    this.getList()
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true
      getSetConfig().then(response => {
        this.configList = response.data
        this.loading = false
        this.fillFormData(this.formConf, this.configList)
        // 更新表单
        this.key2 = +new Date()
      }
      )
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
        list[i] = { 'configKey': key, 'configValue': data[key] }
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
      }
      )
    }
  }
}
</script>
