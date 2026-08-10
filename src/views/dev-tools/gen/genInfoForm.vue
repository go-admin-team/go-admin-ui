<template>
  <el-form ref="genInfoForm" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item prop="tplCategory">
          <template #label>生成模板</template>
          <el-select v-model="formData.tplCategory">
            <el-option label="关系表（增删改查）" value="crud" />
            <!-- <el-option label="关系表（增删改查）" value="mcrud" />
            <el-option label="树表（增删改查）" value="tree" /> -->
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="packageName">
          <template #label>应用名
            <el-tooltip content="应用名，例如：在app文件夹下将该功能发到那个应用中，默认：admin" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.packageName" />
        </el-form-item>
      </el-col>

      <!-- <el-col :span="12">
        <el-form-item prop="moduleFrontName">
          <template #label>前端文件名
            <el-tooltip content="前端项目文件名，例如 sys-user.js " placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.moduleFrontName" />
        </el-form-item>
      </el-col> -->

      <el-col :span="12">
        <el-form-item prop="businessName">
          <template #label>业务名
            <el-tooltip content="可理解为功能英文名，例如 user" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.businessName" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="functionName">
          <template #label>功能描述
            <el-tooltip content="同步的数据库表备注，用作类描述，例如：用户" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.functionName" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="moduleName">
          <template #label>接口路径
            <el-tooltip content="接口路径，例如：api/v1/{sys-user}" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.moduleName">
            <template #prepend>api/{version}/</template>
            <template #append>...</template>
          </el-input>
        </el-form-item>
        <!-- <el-alert
          title="接口地址示例"
          description="[get]api/{version}/{接口路径} \r\n [post]"
          type="success"
          show-icon
        /> -->
      </el-col>
      <!-- <el-col :span="12">
        <el-form-item prop="isDataScope">
          <template #label>是否认证
            <el-tooltip content="是指是否使用用户和角色验证中间件" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.isAuth">
            <el-option label="true" value="1" />
            <el-option label="false" value="2" />
          </el-select>
        </el-form-item>
      </el-col> -->
      <!-- <el-col :span="12">
        <el-form-item prop="isDataScope">
          <template #label>数据权限
            <el-tooltip content="暂不支持" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.isDataScope" disabled>
            <el-option label="true" value="1" />
            <el-option label="false" value="2" />
          </el-select>
        </el-form-item>
      </el-col> -->
      <!-- <el-col :span="12">
        <el-form-item prop="isActions">
          <template #label>是否actions
            <el-tooltip content="系统通用增删改查中间件方法" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.isActions" disabled>
            <el-option label="false" value="2" />
          </el-select>
        </el-form-item>
      </el-col> -->
    </el-row>

    <el-row v-show="info.tplCategory == 'tree'">
      <h4 class="form-header">其他信息</h4>
      <el-col :span="12">
        <el-form-item>
          <template #label>树编码字段
            <el-tooltip content="树显示的编码字段名， 如：dept_id" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.treeCode" placeholder="请选择">
            <el-option
              v-for="column in info.columns"
              :key="column.columnName"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>树父编码字段
            <el-tooltip content="树显示的父编码字段名， 如：parent_Id" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.treeParentCode" placeholder="请选择">
            <el-option
              v-for="column in info.columns"
              :key="column.columnName"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>树名称字段
            <el-tooltip content="树节点的显示名称字段名， 如：dept_name" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select v-model="formData.treeName" placeholder="请选择">
            <el-option
              v-for="column in info.columns"
              :key="column.columnName"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script>
export default {
  name: 'GenInfoFormComponent',
  props: {
    info: {
      type: Object,
      default: null
    }
  },
  emits: ['update:info'],
  data() {
    return {
      formData: { ...this.info },
      rules: {
        tplCategory: [
          { required: true, message: '请选择生成模板', trigger: 'blur' }
        ],
        packageName: [
          { required: true, message: '请输入生成包路径', trigger: 'blur' },
          { pattern: /^[a-z]*$/g, trigger: 'blur', message: '只允许小写字母,例如 system 格式' }
        ],
        moduleName: [
          { required: true, message: '请输入生成模块名', trigger: 'blur' },
          { pattern: /^[a-z\-]*[a-z]$/g, trigger: 'blur', message: '只允许小写字母,例如 sys-demo 格式' }
        ],
        businessName: [
          { required: true, message: '请输入生成业务名', trigger: 'blur' },
          { pattern: /^[a-z][A-Za-z]+$/, trigger: 'blur', message: '校验规则:  只允许输入字母 a-z 或大写 A-Z ，并且小写字母开头' }
        ],
        functionName: [
          { required: true, message: '请输入生成功能名', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    info: {
      handler(val) {
        this.formData = { ...val }
      },
      deep: true
    },
    formData: {
      handler(val) {
        this.$emit('update:info', val)
      },
      deep: true
    }
  },
  created() {}
}
</script>
