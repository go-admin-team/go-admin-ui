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
        <el-form-item label="用户名">
          <el-input v-model="table.query.username" placeholder="请输入用户名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="登录状态" clearable style="width: 140px">
            <el-option
              v-for="item in sys_common_status"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="ip 地址">
          <el-input v-model="table.query.ipaddr" placeholder="请输入 ip 地址" clearable style="width: 160px" />
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button
          v-permisaction="['admin:sysLoginLog:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
      </template>

      <el-table-column label="用户名" prop="username" min-width="110" show-overflow-tooltip />
      <el-table-column label="类型" prop="msg" min-width="120" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="ip 地址" prop="ipaddr" min-width="130">
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="300">
            <p class="peek-line">归属地：{{ row.loginLocation || '-' }}</p>
            <p class="peek-line">浏览器：{{ row.browser || '-' }}</p>
            <p class="peek-line">系统：{{ row.os || '-' }}</p>
            <p class="peek-line">固件：{{ row.platform || '-' }}</p>
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
      <el-table-column label="登录时间" prop="createdAt" min-width="150" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.loginTime" pattern="{y}-{m}-{d} {h}:{i}" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysLoginLog:remove']" link type="danger" @click="remove(row.id)">
          删除
        </el-button>
      </template>
    </ProTable>
  </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useRemove, useDict, dictLabel } from '@/composables'

import { listSysLoginlog, delSysLoginlog } from '@/api/admin/sys-login-log'
import type { SysLoginLog, SysLoginLogQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysLoginLogManage' })

const { sys_common_status } = useDict('sys_common_status')

/**
 * An audit trail: read and delete, nothing writes it. No useForm here, which is
 * why this page is a third of the size of the ones that edit records.
 *
 * The previous version passed its query through addDateRange, a helper that
 * reads `this.dateRange` rather than its own argument. It worked only because
 * it was called as a component method, and this page has no date picker at all
 * -- so all it contributed was an empty beginTime and endTime on every request.
 */
const table = useTable<SysLoginLog, SysLoginLogQuery>({
  api: listSysLoginlog,
  idKey: 'id',
  defaultSort: { prop: 'createdAt', order: 'descending' },
  defaultQuery: () => ({ username: undefined, status: undefined, ipaddr: undefined })
})

const { remove } = useRemove({
  api: delSysLoginlog,
  confirmText: count => `确认删除选中的 ${count} 条登录日志？`,
  onSuccess: () => table.getList()
})
</script>
