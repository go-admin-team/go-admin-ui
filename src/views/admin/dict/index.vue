<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="id" :actions-width="120">
      <template #search>
        <el-form-item :label="$t('admin.dict.type.dictName')">
          <el-input
            v-model="table.query.dictName"
            :placeholder="$t('admin.dict.type.dictNamePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.type.dictType')">
          <el-input
            v-model="table.query.dictType"
            :placeholder="$t('admin.dict.type.dictTypePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.type.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.dict.type.statusPlaceholder')"
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
        <el-button v-permisaction="['admin:sysDictType:add']" type="primary" @click="form.openCreate()">
          {{ $t('common.add') }}
        </el-button>
        <el-button
          v-permisaction="['admin:sysDictType:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button v-permisaction="['admin:sysDictType:export']" :loading="exporting" @click="handleExport">
          {{ $t('common.export') }}
        </el-button>
      </template>

      <el-table-column :label="$t('admin.dict.type.dictId')" prop="id" width="80" />
      <el-table-column
        :label="$t('admin.dict.type.dictName')"
        prop="dictName"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('admin.dict.type.dictType')"
        prop="dictType"
        min-width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <!-- The entries live on their own page, keyed by this record's id -->
          <router-link :to="{ name: 'SysDictDataManage', params: { dictId: row.id }}" class="link-type">
            {{ row.dictType }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.dict.type.status')" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.dict.type.remark')"
        prop="remark"
        min-width="160"
        show-overflow-tooltip
      />
      <!--
        Not sortable: SysDictTypeOrder binds dictIdOrder and nothing else, so a
        header on this column would send createdAtOrder, which gin drops.
      -->
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysDictType:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysDictType:remove']" link type="danger" @click="remove(row.id)">
          {{ $t('common.delete') }}
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" :title="form.title" width="500px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="90px">
        <el-form-item :label="$t('admin.dict.type.dictName')" prop="dictName">
          <el-input
            v-model="form.model.dictName"
            :placeholder="$t('admin.dict.type.dictNamePlaceholder')"
            :disabled="form.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.type.dictType')" prop="dictType">
          <el-input
            v-model="form.model.dictType"
            :placeholder="$t('admin.dict.type.dictTypePlaceholder')"
            :disabled="form.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.dict.type.status')" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('admin.dict.type.remark')" prop="remark">
          <el-input
            v-model="form.model.remark"
            type="textarea"
            :placeholder="$t('admin.dict.type.remarkPlaceholder')"
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { STATUS_NORMAL } from '@/api/status'
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'

import { listType, getTypeForForm, addType, updateType, delType } from '@/api/admin/dict/type'
import type { SysDictType, SysDictTypeQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'Dict' })

const { t } = useI18n()

const { sys_normal_disable } = useDict('sys_normal_disable')

const table = useTable<SysDictType, SysDictTypeQuery>({
  api: listType,
  idKey: 'id',
  defaultQuery: () => ({ dictName: undefined, dictType: undefined, status: undefined })
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
  dictName: [{ required: true, message: t('admin.dict.type.rules.dictName'), trigger: 'blur' }],
  dictType: [{ required: true, message: t('admin.dict.type.rules.dictType'), trigger: 'blur' }]
}))

const form = useForm<SysDictType, number>({
  defaultModel: () => ({
    id: undefined,
    dictName: undefined,
    dictType: undefined,
    status: STATUS_NORMAL,
    remark: undefined
  }),
  idKey: 'id',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.dict.type.addTitle')),
    edit: computed(() => t('admin.dict.type.editTitle'))
  },
  api: { get: getTypeForForm, add: addType, update: updateType },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delType,
  // The count is both a named value and the plural choice: Chinese needs one
  // form, English needs two, and passing it twice lets each pack decide.
  confirmText: count => t('admin.dict.type.removeConfirm', { count }, count),
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

// Built on each click rather than once, so the sheet is written in the
// language the reader is in when they ask for it.
const handleExport = () => exportExcel({
  header: [
    t('admin.dict.type.exportHeader.dictId'),
    t('admin.dict.type.exportHeader.dictName'),
    t('admin.dict.type.exportHeader.dictType'),
    t('admin.dict.type.exportHeader.status'),
    t('admin.dict.type.exportHeader.remark')
  ],
  fields: ['id', 'dictName', 'dictType', 'status', 'remark'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: t('admin.dict.type.exportFilename')
})
</script>
