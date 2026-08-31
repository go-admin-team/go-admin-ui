<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="dictCode" :actions-width="120">
      <template #search>
        <el-form-item :label="$t('admin.dict.data.dictName')">
          <el-select v-model="table.query.dictType" style="width: 180px">
            <el-option
              v-for="item in typeOptions"
              :key="item.id"
              :label="item.dictName"
              :value="item.dictType as string"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.dictLabel')">
          <el-input
            v-model="table.query.dictLabel"
            :placeholder="$t('admin.dict.data.dictLabelPlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.dict.data.statusPlaceholder')"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in sys_normal_disable"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['admin:sysDictData:add']" type="primary" @click="handleAdd">
          {{ $t('common.add') }}
        </el-button>
        <el-button
          v-permisaction="['admin:sysDictData:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
      </template>

      <el-table-column :label="$t('admin.dict.data.dictCode')" prop="dictCode" width="80" />
      <el-table-column
        :label="$t('admin.dict.data.dictLabel')"
        prop="dictLabel"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('admin.dict.data.dictValue')"
        prop="dictValue"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.dict.data.dictSort')" prop="dictSort" width="80" />
      <el-table-column :label="$t('admin.dict.data.status')" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.dict.data.remark')"
        prop="remark"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysDictData:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysDictData:remove']" link type="danger" @click="remove(row.dictCode)">
          {{ $t('common.delete') }}
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" :title="form.title" width="500px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="90px">
        <el-form-item :label="$t('admin.dict.data.dictType')">
          <el-input v-model="form.model.dictType" disabled />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.label')" prop="dictLabel">
          <el-input v-model="form.model.dictLabel" :placeholder="$t('admin.dict.data.labelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.value')" prop="dictValue">
          <el-input
            v-model="form.model.dictValue"
            :placeholder="$t('admin.dict.data.valuePlaceholder')"
            :disabled="form.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.displaySort')" prop="dictSort">
          <el-input-number v-model="form.model.dictSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.status')" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('admin.dict.data.remark')" prop="remark">
          <el-input
            v-model="form.model.remark"
            type="textarea"
            :placeholder="$t('admin.dict.data.remarkPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close()">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit()">
          {{ $t('common.dialogConfirm') }}
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, dictLabel } from '@/composables'

import { listType, getType } from '@/api/admin/dict/type'
import { listData, getDataForForm, addData, updateData, delData } from '@/api/admin/dict/data'
import type { SysDictData, SysDictDataQuery, SysDictType } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysDictDataManage' })

const route = useRoute()
const { t } = useI18n()
const { sys_normal_disable } = useDict('sys_normal_disable')

/**
 * The one page whose first request cannot go out on mount.
 *
 * The route carries a dict *id*, but the entries endpoint filters on the dict
 * *type* string -- so the type has to be fetched and written into the query
 * before a list request means anything. `immediate: false` is exactly this: no
 * request until the page says so.
 */
// Declared before useTable: defaultQuery runs during that call. Held outside the
// query because the search bar's own dictType select is editable, while this is
// the dictionary the page was opened for -- what resetQuery rebuilds back to,
// rather than an empty type, which the endpoint reads as "every entry in the
// system". Not a ref: nothing renders it, every read is inside a function body.
let currentType = ''

const table = useTable<SysDictData, SysDictDataQuery>({
  api: listData,
  idKey: 'dictCode',
  immediate: false,
  defaultQuery: () => ({ dictType: currentType, dictLabel: undefined, status: undefined })
})

const typeOptions = ref<SysDictType[]>([])

onMounted(async() => {
  // The picker's options are fetched alongside but not waited on: only the
  // type gates the list, so the rows do not wait on the slower of the two
  const options = listType({ pageSize: 1000 })
    .then(response => { typeOptions.value = response.data?.list ?? [] })
    .catch(() => { /* Reported by the interceptor; the picker stays empty */ })

  try {
    const type = await getType(Number(route.params.dictId))
    currentType = type.data?.dictType ?? ''
    table.query.dictType = currentType
  } catch {
    // Reported by the interceptor. Without the catch this rejects inside the
    // mounted hook with nobody attached, and the page sits empty with no clue.
    return
  }
  await table.getList()
  await options
})

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the page is set up, and the page
 * is kept alive -- so a message already rendered under a field would keep the
 * language it was built in. useForm unwraps the ref, so :rules="form.rules" is
 * unchanged.
 */
const rules = computed<FormRules>(() => ({
  dictLabel: [{ required: true, message: t('admin.dict.data.rules.dictLabel'), trigger: 'blur' }],
  dictValue: [{ required: true, message: t('admin.dict.data.rules.dictValue'), trigger: 'blur' }],
  dictSort: [{ required: true, message: t('admin.dict.data.rules.dictSort'), trigger: 'blur' }]
}))

const form = useForm<SysDictData, number>({
  defaultModel: () => ({
    dictCode: undefined,
    dictType: currentType,
    dictLabel: undefined,
    dictValue: undefined,
    dictSort: 0,
    status: '2',
    remark: undefined
  }),
  idKey: 'dictCode',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.dict.data.addTitle')),
    edit: computed(() => t('admin.dict.data.editTitle'))
  },
  api: { get: getDataForForm, add: addData, update: updateData },
  onSuccess: () => table.getList()
})

// The dictionary this page belongs to is not a choice; the form shows it locked
const handleAdd = () => form.openCreate({ dictType: currentType })

const { remove } = useRemove({
  api: delData,
  // The count is both a named value and the plural choice: Chinese needs one
  // form, English needs two, and passing it twice lets each pack decide.
  confirmText: count => t('admin.dict.data.removeConfirm', { count }, count),
  onSuccess: () => table.getList()
})
</script>
