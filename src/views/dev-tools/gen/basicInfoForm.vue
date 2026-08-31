<template>
  <el-form ref="formRef" :model="model" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item prop="tableName">
          <template #label>
            <FieldLabel
              :label="$t('devTools.basicInfoForm.tableName')"
              :tip="$t('devTools.basicInfoForm.tableNameTip')"
            />
          </template>
          <el-input
            v-model="model.tableName"
            :placeholder="$t('devTools.basicInfoForm.tableNamePlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="tableComment">
          <template #label>
            <FieldLabel
              :label="$t('devTools.basicInfoForm.tableComment')"
              :tip="$t('devTools.basicInfoForm.tableCommentTip')"
            />
          </template>
          <el-input
            v-model="model.tableComment"
            :placeholder="$t('devTools.basicInfoForm.tableCommentPlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="className">
          <template #label>
            <FieldLabel
              :label="$t('devTools.basicInfoForm.className')"
              :tip="$t('devTools.basicInfoForm.classNameTip')"
            />
          </template>
          <el-input
            v-model="model.className"
            :placeholder="$t('devTools.basicInfoForm.classNamePlaceholder')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('devTools.basicInfoForm.functionAuthor')" prop="functionAuthor">
          <el-input
            v-model="model.functionAuthor"
            :placeholder="$t('devTools.basicInfoForm.functionAuthorPlaceholder')"
          />
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
        <el-form-item :label="$t('devTools.basicInfoForm.remark')" prop="remark">
          <el-input v-model="model.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import FieldLabel from '@/components/FieldLabel/index.vue'
import type { GenTable } from '@/api/tools/gen'

/**
 * The Basic Information tab.
 *
 * Holds the record through defineModel rather than copying a prop into local
 * state and emitting back. The previous version did the copy, but the parent
 * bound `:info` without listening for `update:info`, so every edit here was
 * dropped -- the parent read the values back out of the el-form instance's
 * `model` prop instead, which is why it worked at all.
 */
defineOptions({ name: 'BasicInfoForm' })

const { t } = useI18n()

const model = defineModel<GenTable>({ required: true })

const formRef = ref<FormInstance>()

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the component is set up, so a
 * message already rendered under a field would keep the language it was built
 * in -- and this page is kept alive, so re-entering it does not re-run setup
 * either. el-form revalidates when its rules change (validateOnRuleChange),
 * which is what repaints a message that is already on screen. The template
 * unwraps the ref, so :rules="rules" is unchanged.
 */
const rules = computed<FormRules>(() => ({
  tableName: [
    { required: true, message: t('devTools.basicInfoForm.rules.tableName'), trigger: 'blur' },
    {
      pattern: /^[a-z._]*$/,
      trigger: 'blur',
      message: t('devTools.basicInfoForm.rules.tableNamePattern')
    }
  ],
  tableComment: [
    { required: true, message: t('devTools.basicInfoForm.rules.tableComment'), trigger: 'blur' }
  ],
  className: [
    { required: true, message: t('devTools.basicInfoForm.rules.className'), trigger: 'blur' },
    {
      pattern: /^[A-Z][A-Za-z0-9]*$/,
      trigger: 'blur',
      message: t('devTools.basicInfoForm.rules.classNamePattern')
    }
  ],
  functionAuthor: [
    { required: true, message: t('devTools.basicInfoForm.rules.functionAuthor'), trigger: 'blur' },
    {
      pattern: /^[A-Za-z]+$/,
      trigger: 'blur',
      message: t('devTools.basicInfoForm.rules.functionAuthorPattern')
    }
  ]
}))

/** The parent validates both tabs before it submits. */
defineExpose({ validate: () => formRef.value?.validate().catch(() => false) })
</script>
