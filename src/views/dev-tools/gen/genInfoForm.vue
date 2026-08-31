<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item prop="tplCategory">
          <template #label>{{ $t('devTools.genInfoForm.tplCategory') }}</template>
          <el-select v-model="model.tplCategory">
            <el-option :label="$t('devTools.genInfoForm.tplCrud')" value="crud" />
            <!-- <el-option label="关系表（增删改查）" value="mcrud" />
            <el-option label="树表（增删改查）" value="tree" /> -->
          </el-select>
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="packageName">
          <template #label>{{ $t('devTools.genInfoForm.packageName') }}
            <el-tooltip :content="$t('devTools.genInfoForm.packageNameTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="model.packageName" />
        </el-form-item>
      </el-col>

      <!-- <el-col :span="12">
        <el-form-item prop="moduleFrontName">
          <template #label>前端文件名
            <el-tooltip content="前端项目文件名，例如 sys-user.js " placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="model.moduleFrontName" />
        </el-form-item>
      </el-col> -->

      <el-col :span="12">
        <el-form-item prop="businessName">
          <template #label>{{ $t('devTools.genInfoForm.businessName') }}
            <el-tooltip :content="$t('devTools.genInfoForm.businessNameTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="model.businessName" />
        </el-form-item>
      </el-col>

      <el-col :span="12">
        <el-form-item prop="functionName">
          <template #label>{{ $t('devTools.genInfoForm.functionName') }}
            <el-tooltip :content="$t('devTools.genInfoForm.functionNameTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="model.functionName" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="moduleName">
          <template #label>{{ $t('devTools.genInfoForm.moduleName') }}
            <el-tooltip :content="$t('devTools.genInfoForm.moduleNameTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-input v-model="model.moduleName">
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
          <el-select v-model="model.isAuth">
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
          <el-select v-model="model.isDataScope" disabled>
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
          <el-select v-model="model.isActions" disabled>
            <el-option label="false" value="2" />
          </el-select>
        </el-form-item>
      </el-col> -->
    </el-row>

    <el-row v-show="model.tplCategory == 'tree'">
      <h4 class="form-header">{{ $t('devTools.genInfoForm.otherInfo') }}</h4>
      <el-col :span="12">
        <el-form-item>
          <template #label>{{ $t('devTools.genInfoForm.treeCode') }}
            <el-tooltip :content="$t('devTools.genInfoForm.treeCodeTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select
            v-model="model.treeCode"
            :placeholder="$t('common.selectPlaceholder')"
          >
            <el-option
              v-for="column in columns"
              :key="column.columnName"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>{{ $t('devTools.genInfoForm.treeParentCode') }}
            <el-tooltip :content="$t('devTools.genInfoForm.treeParentCodeTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select
            v-model="model.treeParentCode"
            :placeholder="$t('common.selectPlaceholder')"
          >
            <el-option
              v-for="column in columns"
              :key="column.columnName"
              :label="column.columnName + '：' + column.columnComment"
              :value="column.columnName"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item>
          <template #label>{{ $t('devTools.genInfoForm.treeName') }}
            <el-tooltip :content="$t('devTools.genInfoForm.treeNameTip')" placement="top">
              <i class="ri-question-line" />
            </el-tooltip></template>
          <el-select
            v-model="model.treeName"
            :placeholder="$t('common.selectPlaceholder')"
          >
            <el-option
              v-for="column in columns"
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
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import type { GenTable } from '@/api/tools/gen'

/**
 * The Generation Information tab. Same contract as BasicInfoForm; see it for
 * the why, including why `rules` is a computed.
 */
defineOptions({ name: 'GenInfoForm' })

const { t } = useI18n()

const model = defineModel<GenTable>({ required: true })

const formRef = ref<FormInstance>()

/** The table's own columns, narrowed for the tree pickers below. */
const columns = computed(
  () => (model.value.columns ?? []) as Array<{ columnName?: string, columnComment?: string }>
)

const rules = computed<FormRules>(() => ({
  tplCategory: [
    { required: true, message: t('devTools.genInfoForm.rules.tplCategory'), trigger: 'change' }
  ],
  packageName: [
    { required: true, message: t('devTools.genInfoForm.rules.packageName'), trigger: 'blur' },
    {
      pattern: /^[a-z]*$/,
      trigger: 'blur',
      message: t('devTools.genInfoForm.rules.packageNamePattern')
    }
  ],
  moduleName: [
    { required: true, message: t('devTools.genInfoForm.rules.moduleName'), trigger: 'blur' },
    {
      pattern: /^[a-z-]*[a-z]$/,
      trigger: 'blur',
      message: t('devTools.genInfoForm.rules.moduleNamePattern')
    }
  ],
  businessName: [
    { required: true, message: t('devTools.genInfoForm.rules.businessName'), trigger: 'blur' },
    {
      pattern: /^[a-z][A-Za-z]+$/,
      trigger: 'blur',
      message: t('devTools.genInfoForm.rules.businessNamePattern')
    }
  ],
  functionName: [
    { required: true, message: t('devTools.genInfoForm.rules.functionName'), trigger: 'blur' }
  ]
}))

defineExpose({ validate: () => formRef.value?.validate().catch(() => false) })
</script>
