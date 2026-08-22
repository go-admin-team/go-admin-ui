<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item prop="tableName">
          <template #label><FieldLabel label="数据表名称" tip="数据库表名称，针对gorm对应的table()使用，⚠️这里必须是蛇形结构" /></template>
          <el-input v-model="model.tableName" placeholder="请输入表名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="tableComment">
          <template #label><FieldLabel label="菜单名称" tip="同步的数据库表名称，生成配置数据时，用作菜单名称" /></template>
          <el-input v-model="model.tableComment" placeholder="请输入菜单名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="className">
          <template #label><FieldLabel label="结构体模型名称" tip="结构体模型名称，代码中的struct名称定义使用" /></template>
          <el-input v-model="model.className" placeholder="请输入" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="作者名称" prop="functionAuthor">
          <el-input v-model="model.functionAuthor" placeholder="请输入作者名称" />
        </el-form-item>
      </el-col>
      <!-- <el-col :span="12">
        <el-form-item prop="isLogicalDelete">
          <template #label><FieldLabel label="是否逻辑删除" tip="目前只支持逻辑删除" /></template>
          <el-radio-group v-model="model.isLogicalDelete">
            <el-radio label="1">是</el-radio>
            <el-radio label="0">否</el-radio>
          </el-radio-group>

        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="model.isLogicalDelete == '1'" label="逻辑删除字段" prop="logicalDeleteColumn">
          <el-input v-model="model.logicalDeleteColumn" placeholder="请输入" />
        </el-form-item>
      </el-col> -->
      <el-col :span="24">
        <el-form-item label="备注" prop="remark">
          <el-input v-model="model.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import FieldLabel from '@/components/FieldLabel/index.vue'
import type { GenTable } from '@/api/tools/gen'

/**
 * The 基本信息 tab.
 *
 * Holds the record through defineModel rather than copying a prop into local
 * state and emitting back. The previous version did the copy, but the parent
 * bound `:info` without listening for `update:info`, so every edit here was
 * dropped -- the parent read the values back out of the el-form instance's
 * `model` prop instead, which is why it worked at all.
 */
defineOptions({ name: 'BasicInfoForm' })

const model = defineModel<GenTable>({ required: true })

const formRef = ref<FormInstance>()

const rules: FormRules = {
  tableName: [
    { required: true, message: '请输入表名称', trigger: 'blur' },
    { pattern: /^[a-z._]*$/, trigger: 'blur', message: '只允许小写字母，例如 sys_demo' }
  ],
  tableComment: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  className: [
    { required: true, message: '请输入模型名称', trigger: 'blur' },
    { pattern: /^[A-Z][A-Za-z0-9]*$/, trigger: 'blur', message: '必须以大写字母开头，例如 SysDemo' }
  ],
  functionAuthor: [
    { required: true, message: '请输入作者', trigger: 'blur' },
    { pattern: /^[A-Za-z]+$/, trigger: 'blur', message: '只允许字母 a-z 或 A-Z' }
  ]
}

/** The parent validates both tabs before it submits. */
defineExpose({ validate: () => formRef.value?.validate().catch(() => false) })
</script>
