<template>
  <el-form ref="basicInfoForm" :model="formData" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item prop="tableName">
          <template #label>数据表名称
            <el-tooltip content="数据库表名称，针对gorm对应的table()使用，⚠️这里必须是蛇形结构" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.tableName" placeholder="请输入表名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="tableComment">
          <template #label>菜单名称
            <el-tooltip content="同步的数据库表名称，生成配置数据时，用作菜单名称" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.tableComment" placeholder="请输入菜单名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>结构体模型名称
            <el-tooltip content="结构体模型名称，代码中的struct名称定义使用" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="formData.className" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="作者名称" prop="functionAuthor">
          <el-input v-model="formData.functionAuthor" placeholder="请输入作者名称" />
        </el-form-item>
      </el-col>
      <!-- <el-col :span="12">
        <el-form-item prop="isLogicalDelete">
          <template #label>是否逻辑删除
            <el-tooltip content="目前只支持逻辑删除" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-radio-group v-model="formData.isLogicalDelete">
            <el-radio label="1">是</el-radio>
            <el-radio label="0">否</el-radio>
          </el-radio-group>

        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="formData.isLogicalDelete == '1'" label="逻辑删除字段" prop="logicalDeleteColumn">
          <el-input v-model="formData.logicalDeleteColumn" placeholder="请输入" />
        </el-form-item>
      </el-col> -->
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script>
export default {
  name: 'BasicInfoFormComponent',
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
        tableName: [
          { required: true, message: '请输入表名称', trigger: 'blur' },
          { pattern: /^[a-z\._]*$/g, trigger: 'blur', message: '只允许小写字母,例如 sys_demo 格式' }
        ],
        tableComment: [
          { required: true, message: '请输入菜单名称', trigger: 'blur' }
        ],
        className: [
          { required: true, message: '请输入模型名称', trigger: 'blur' },
          { pattern: /^[A-Z][A-z0-9]*$/g, trigger: 'blur', message: '必须以大写字母开头,例如 SysDemo 格式' }
        ],
        functionAuthor: [
          { required: true, message: '请输入作者', trigger: 'blur' },
          { pattern: /^[A-Za-z]+$/, trigger: 'blur', message: '校验规则:  只允许输入字母 a-z 或大写 A-Z' }
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
  }
}
</script>
