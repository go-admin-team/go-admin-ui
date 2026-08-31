<template>
  <PageContainer>
    <ProTable
      :table="table"
      selection
      row-key="id"
      :actions-width="90"
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
    >
      <template #search>
        <el-form-item :label="$t('admin.sysLoginLog.username')">
          <el-input
            v-model="table.query.username"
            :placeholder="$t('admin.sysLoginLog.usernamePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysLoginLog.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.sysLoginLog.statusPlaceholder')"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in sys_common_status"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.sysLoginLog.ipaddr')">
          <el-input
            v-model="table.query.ipaddr"
            :placeholder="$t('admin.sysLoginLog.ipaddrPlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button
          v-permisaction="['admin:sysLoginLog:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
      </template>

      <el-table-column
        :label="$t('admin.sysLoginLog.username')"
        prop="username"
        min-width="110"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('admin.sysLoginLog.msg')"
        prop="msg"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.sysLoginLog.status')" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('admin.sysLoginLog.ipaddr')" prop="ipaddr" min-width="130">
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="300">
            <p class="peek-line">{{ $t('admin.sysLoginLog.peekLocation', { value: row.loginLocation || '-' }) }}</p>
            <p class="peek-line">{{ $t('admin.sysLoginLog.peekBrowser', { value: row.browser || '-' }) }}</p>
            <p class="peek-line">{{ $t('admin.sysLoginLog.peekOs', { value: row.os || '-' }) }}</p>
            <p class="peek-line">{{ $t('admin.sysLoginLog.peekPlatform', { value: row.platform || '-' }) }}</p>
            <template #reference><span>{{ row.ipaddr }}</span></template>
          </el-popover>
        </template>
      </el-table-column>
      <!--
        prop is createdAt, not loginTime: createdAtOrder is the only order key
        SysLoginLogOrder binds, and useTable derives the key from the prop the
        header reports. Sorting on loginTime would send loginTimeOrder, which gin
        drops -- and useTable would have dropped createdAtOrder to make room,
        leaving the request with no ordering at all. min-width follows the
        measurement in CLAUDE.md: a sortable header plus `2026-08-01 14:00` needs
        about 141px, or the cells wrap.
      -->
      <el-table-column
        :label="$t('admin.sysLoginLog.loginTime')"
        prop="createdAt"
        min-width="150"
        sortable="custom"
      >
        <template #default="{ row }"><DateCell :value="row.loginTime" pattern="{y}-{m}-{d} {h}:{i}" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysLoginLog:remove']" link type="danger" @click="remove(row.id)">
          {{ $t('common.delete') }}
        </el-button>
      </template>
    </ProTable>
  </PageContainer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useRemove, useDict, dictLabel } from '@/composables'

import { listSysLoginlog, delSysLoginlog } from '@/api/admin/sys-login-log'
import type { SysLoginLog, SysLoginLogQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysLoginLogManage' })

const { t } = useI18n()

const { sys_common_status } = useDict('sys_common_status')

/**
 * An audit trail: read and delete, nothing writes it. No useForm here, which is
 * why this page is a third of the size of the ones that edit records.
 *
 * The previous version passed its query through a global addDateRange helper
 * that read `this.dateRange` rather than its own argument. This page has no date
 * picker at all, so all it contributed was an empty beginTime and endTime on
 * every request. The helper is gone now.
 */
const table = useTable<SysLoginLog, SysLoginLogQuery>({
  api: listSysLoginlog,
  idKey: 'id',
  defaultSort: { prop: 'createdAt', order: 'descending' },
  defaultQuery: () => ({ username: undefined, status: undefined, ipaddr: undefined })
})

const { remove } = useRemove({
  api: delSysLoginlog,
  // The count is both a named value and the plural choice: Chinese needs one
  // form, English needs two, and passing it twice lets each pack decide.
  confirmText: count => t('admin.sysLoginLog.removeConfirm', { count }, count),
  onSuccess: () => table.getList()
})
</script>
