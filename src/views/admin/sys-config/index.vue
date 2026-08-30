<template>
  <PageContainer>
    <ProTable
      :table="table"
      selection
      row-key="id"
      :actions-width="120"
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
    >
      <template #search>
        <el-form-item :label="$t('admin.sysConfig.name')">
          <el-input
            v-model="table.query.configName"
            :placeholder="$t('admin.sysConfig.namePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.key')">
          <el-input
            v-model="table.query.configKey"
            :placeholder="$t('admin.sysConfig.keyPlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.builtIn')">
          <el-select
            v-model="table.query.configType"
            :placeholder="$t('admin.sysConfig.builtInPlaceholder')"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in sys_yes_no"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['admin:sysConfig:add']" type="primary" @click="form.openCreate()">
          {{ $t('common.add') }}
        </el-button>
        <el-button
          v-permisaction="['admin:sysConfig:edit']"
          :disabled="table.single"
          @click="form.openEdit(table.selection[0])"
        >{{ $t('common.edit') }}</el-button>
        <el-button
          v-permisaction="['admin:sysConfig:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button :loading="exporting" @click="handleExport">{{ $t('common.export') }}</el-button>
      </template>

      <el-table-column :label="$t('admin.sysConfig.configId')" prop="id" min-width="80" sortable="custom" />
      <el-table-column
        :label="$t('admin.sysConfig.name')"
        prop="configName"
        min-width="140"
        sortable="custom"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.sysConfig.key')" prop="configKey" min-width="160" sortable="custom">
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="280">
            <p class="peek-line">{{ $t('admin.sysConfig.peekValue', { value: row.configValue }) }}</p>
            <p class="peek-line">
              {{ $t('admin.sysConfig.peekFrontend') }}
              <el-tag v-if="row.isFrontend === '1'" type="success" disable-transitions>{{ $t('admin.sysConfig.yes') }}</el-tag>
              <el-tag v-else disable-transitions>{{ $t('admin.sysConfig.no') }}</el-tag>
            </p>
            <template #reference><span class="config-key">{{ row.configKey }}</span></template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.sysConfig.builtIn')"
        prop="configType"
        card-role="badge"
        min-width="90"
        sortable="custom"
      >
        <template #default="{ row }">{{ dictLabel(sys_yes_no, row.configType) }}</template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.sysConfig.remark')"
        prop="remark"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysConfig:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysConfig:remove']" link type="danger" @click="remove(row.id)">
          {{ $t('common.delete') }}
        </el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="form.visible"
      :title="form.title"
      width="500px"
      :close-on-click-modal="false"
      @closed="form.reset"
    >
      <el-form
        :ref="form.bindFormRef"
        v-loading="form.loading"
        :model="form.model"
        :rules="form.rules"
        label-width="88px"
      >
        <!-- Name and key identify the setting that code looks up, so they are
             fixed once created -->
        <el-form-item :label="$t('admin.sysConfig.configName')" prop="configName">
          <el-input
            v-model="form.model.configName"
            :placeholder="$t('admin.sysConfig.namePlaceholder')"
            :disabled="form.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.configKey')" prop="configKey">
          <el-input
            v-model="form.model.configKey"
            :placeholder="$t('admin.sysConfig.keyPlaceholder')"
            :disabled="form.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.configValue')" prop="configValue">
          <el-input
            v-model="form.model.configValue"
            :placeholder="$t('admin.sysConfig.configValuePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.configType')" prop="configType">
          <el-radio-group v-model="form.model.configType">
            <el-radio
              v-for="item in sys_yes_no"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.isFrontend')" prop="isFrontend">
          <el-select
            v-model="form.model.isFrontend"
            :placeholder="$t('admin.sysConfig.isFrontendPlaceholder')"
            style="width: 100%"
          >
            <el-option :label="$t('admin.sysConfig.yes')" value="1" />
            <el-option :label="$t('admin.sysConfig.no')" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.sysConfig.remark')" prop="remark">
          <el-input
            v-model="form.model.remark"
            type="textarea"
            :placeholder="$t('admin.sysConfig.remarkPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit">{{ $t('common.dialogConfirm') }}</el-button>
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
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'

import { listConfig, getConfig, addConfig, updateConfig, delConfig } from '@/api/admin/sys-config'
import type { SysConfig, SysConfigQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysConfigManage' })

const { t } = useI18n()

const { sys_yes_no } = useDict('sys_yes_no')

/** Rows carry `id`, not `configId`, so that is the key throughout. */
type ConfigRow = SysConfig & { id?: number }

const table = useTable<ConfigRow, SysConfigQuery>({
  api: listConfig,
  idKey: 'id',
  defaultSort: { prop: 'createdAt', order: 'descending' },
  defaultQuery: () => ({ configName: undefined, configKey: undefined, configType: undefined })
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
  configName: [{ required: true, message: t('admin.sysConfig.rules.configName'), trigger: 'blur' }],
  configKey: [{ required: true, message: t('admin.sysConfig.rules.configKey'), trigger: 'blur' }],
  configValue: [{ required: true, message: t('admin.sysConfig.rules.configValue'), trigger: 'blur' }],
  isFrontend: [{ required: true, message: t('admin.sysConfig.rules.isFrontend'), trigger: 'change' }]
}))

const form = useForm<ConfigRow, number>({
  defaultModel: () => ({
    id: undefined,
    configName: undefined,
    configKey: undefined,
    configValue: undefined,
    configType: 'Y',
    isFrontend: '1',
    remark: undefined
  }),
  idKey: 'id',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysConfig.addTitle')),
    edit: computed(() => t('admin.sysConfig.editTitle'))
  },
  api: { get: getConfig, add: addConfig, update: updateConfig },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delConfig,
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

// Built on each click rather than once, so the sheet is written in the
// language the reader is in when they ask for it.
const handleExport = () => exportExcel({
  header: [
    t('admin.sysConfig.exportHeader.configId'),
    t('admin.sysConfig.exportHeader.configName'),
    t('admin.sysConfig.exportHeader.configKey'),
    t('admin.sysConfig.exportHeader.configValue'),
    t('admin.sysConfig.exportHeader.remark'),
    t('admin.sysConfig.exportHeader.createdAt')
  ],
  // `id`, not `configId`: the rows carry the former, so the old export wrote an
  // empty first column on every line
  fields: ['id', 'configName', 'configKey', 'configValue', 'remark', 'createdAt'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: t('admin.sysConfig.exportFilename')
})
</script>

<style lang="scss" scoped>
.config-key {
  cursor: default;
}
</style>
