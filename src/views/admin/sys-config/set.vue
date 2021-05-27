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
import { getSetConfig } from '@/api/admin/sys-config'
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
      // 类型数据字典
      typeOptions: [],
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        configName: undefined,
        configKey: undefined,
        configType: undefined,
        createdAtOrder: 'desc'
      },
      key2: +new Date(),
      formConf: {
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
            console.log('response', response)
            console.log('file', file)
            console.log('fileList', fileList)
            // this.defaultValue = [{ 'url': response.data.full_path }]
            this.fileList[0] = { 'url': response.data.full_path }
            this.$parent.$parent.$parent.$parent.$parent.$parent.$emit('bind', 'sys_app_logo', response.data.full_path)
            // this.$parent.$parent.$parent.$parent.$parent.$parent['formData']['sys_app_logo'] = response.data.full_path
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

    }
  },
  created() {
    this.getList()
    this.getDicts('sys_yes_no').then(response => {
      this.typeOptions = response.data
    })
  },
  mounted() {
    // 表单数据回填，模拟异步请求场景
    setTimeout(() => {
      // 请求回来的表单数据
      // const data = {
      //   sys_app_logo: [{ url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100' }]
      // }
      // // 回填数据
      // this.fillFormData(this.formConf, data)
      // // 更新表单
      // this.key2 = +new Date()
    }, 2000)
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
        sys_app_logo: [{ url: url }]
      }
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
        console.log(item)
        const val = data[item.__vModel__]
        if (val) {
          // if (item.tag === 'el-upload') {
          //   item['file-list'] = val
          // } else {
          item.__config__.defaultValue = val
          // }
        }
      })
    },
    bind(key, data) {
      console.log(key, data)
      this.setUrl(data)
      // console.log(this.formConf.formData)
      // // 更新表单
      // this.key2 = +new Date()
    },
    change() {
      this.key2 = +new Date()
      const t = this.formConf
      this.formConf = this.formConf2
      this.formConf2 = t
    },
    sumbitForm2(data) {
      console.log('sumbitForm2提交数据：', data)
      // data['sys_app_logo'] = localStorage.getItem('sysAppLogo')
      console.log('sumbitForm2提交数据：', data)
    }
  }
}
</script>
