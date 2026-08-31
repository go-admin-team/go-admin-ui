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
        <el-form-item :label="$t('admin.sysOperLog.operUrl')">
          <el-input
            v-model="table.query.operUrl"
            :placeholder="$t('admin.sysOperLog.operUrlPlaceholder')"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysOperLog.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.sysOperLog.statusPlaceholder')"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="item in sys_common_status"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.sysOperLog.operTime')">
          <el-date-picker
            v-model="operatedBetween"
            type="datetimerange"
            :range-separator="$t('admin.sysOperLog.rangeSeparator')"
            :start-placeholder="$t('admin.sysOperLog.startDate')"
            :end-placeholder="$t('admin.sysOperLog.endDate')"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 340px"
          />
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button
          v-permisaction="['admin:sysOperLog:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button v-permisaction="['admin:sysOperLog:remove']" type="danger" plain @click="handleClean">
          {{ $t('admin.sysOperLog.clean') }}
        </el-button>
        <el-button v-permisaction="['admin:sysOperLog:export']" :loading="exporting" @click="handleExport">
          {{ $t('common.export') }}
        </el-button>
      </template>

      <el-table-column :label="$t('admin.sysOperLog.operId')" prop="id" min-width="80" />
      <el-table-column
        :label="$t('admin.sysOperLog.request')"
        prop="operUrl"
        min-width="220"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="360">
            <p class="peek-line">{{ $t('admin.sysOperLog.peekHost', { value: row.operIp }) }}</p>
            <p class="peek-line">{{ $t('admin.sysOperLog.peekLocation', { value: row.operLocation || '-' }) }}</p>
            <p class="peek-line">{{ $t('admin.sysOperLog.peekLatency', { value: row.latencyTime || '-' }) }}</p>
            <template #reference>
              <span>
                <MethodTag :method="row.requestMethod" />
                {{ row.operUrl }}
              </span>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('admin.sysOperLog.operName')"
        prop="operName"
        min-width="130"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.sysOperLog.status')" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- prop is createdAt because createdAtOrder is the only order key
           SysOperaLogOrder binds; see the same column on the login log page -->
      <el-table-column
        :label="$t('admin.sysOperLog.operDate')"
        prop="createdAt"
        min-width="150"
        sortable="custom"
      >
        <template #default="{ row }"><DateCell :value="row.operTime" pattern="{y}-{m}-{d} {h}:{i}" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysOperLog:query']" link type="primary" @click="openDetail(row)">
          {{ $t('admin.sysOperLog.detail') }}
        </el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="detailOpen"
      :title="$t('admin.sysOperLog.detailTitle')"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('admin.sysOperLog.detailUrl')" :span="2">
          {{ detail.operUrl }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.loginInfo')">
          {{ detail.operName }} / {{ detail.operIp }} / {{ detail.operLocation || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.requestMethod')">
          {{ detail.requestMethod }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.latency')">
          {{ detail.latencyTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.operTime')">
          {{ parseTime(detail.operTime) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.module')">
          {{ detail.title || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.operStatus')">
          <el-tag :type="Number(detail.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.operParam')" :span="2">
          <pre class="log-payload">{{ detail.operParam || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('admin.sysOperLog.jsonResult')" :span="2">
          <pre class="log-payload">{{ detail.jsonResult || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailOpen = false">{{ $t('admin.sysOperLog.dialogClose') }}</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import MethodTag from '@/components/MethodTag/index.vue'
import { useTable, useRemove, useDict, useExport, dictLabel } from '@/composables'
import { msgSuccess } from '@/utils/message'
import { parseTime } from '@/utils/costum'

import { listSysOperlog, delSysOperlog, cleanOperlog } from '@/api/admin/sys-opera-log'
import type { SysOperaLog, SysOperaLogQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'OperLog' })

const { t } = useI18n()

// sys_oper_type has no column of its own -- the table shows 模块 instead --
// but the export has always carried the field, and carried it as the raw 1/2/3
// the backend stores. Fetched here so the sheet can say what the number means.
const { sys_common_status, sys_oper_type } = useDict('sys_common_status', 'sys_oper_type')

const table = useTable<SysOperaLog, SysOperaLogQuery>({
  api: listSysOperlog,
  idKey: 'id',
  defaultSort: { prop: 'createdAt', order: 'descending' },
  defaultQuery: () => ({ operUrl: undefined, status: undefined, beginTime: undefined, endTime: undefined })
})

/**
 * The date picker's own state, mirrored into the query as the two keys the
 * endpoint reads.
 *
 * The previous version routed this through a global addDateRange helper that
 * read `this.dateRange` rather than the argument it was handed. It worked only
 * as a component method, and four of its five callers had no date picker at
 * all, so all it did there was attach two empty strings. It is gone now.
 */
const operatedBetween = computed<[string, string] | null>({
  get: () => {
    const { beginTime, endTime } = table.query
    // The annotation is load-bearing: an array literal widens to string[],
    // which the picker's tuple-shaped model does not accept
    return beginTime && endTime ? [beginTime, endTime] as [string, string] : null
  },
  set: range => {
    table.query.beginTime = range?.[0]
    table.query.endTime = range?.[1]
    void table.search()
  }
})

const { remove } = useRemove({
  api: delSysOperlog,
  // The count is both a named value and the plural choice: Chinese needs one
  // form, English needs two, and passing it twice lets each pack decide.
  confirmText: count => t('admin.sysOperLog.removeConfirm', { count }, count),
  onSuccess: () => table.getList()
})

/**
 * Empties the whole log, which is why it asks separately from a row delete.
 *
 * `cleaning` covers the dialog, not just the request: without it two fast clicks
 * stack two confirms and send two DELETEs once both are accepted -- the same
 * failure useRemove guards against. It is deliberately not the button's
 * `:loading`, which would only cover the request.
 */
let cleaning = false

const handleClean = async() => {
  if (cleaning) return
  cleaning = true
  try {
    // Every string read here rather than once at setup, so the box follows the
    // language even after the page has been sitting open -- the same reason
    // useRemove resolves its own four inside the call.
    await ElMessageBox.confirm(t('admin.sysOperLog.cleanConfirm'), t('common.notice'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    cleaning = false
    return
  }
  try {
    await cleanOperlog()
    msgSuccess(t('admin.sysOperLog.cleanOk'))
    // search, not getList: the log is empty now, so whatever page the user was
    // on no longer exists
    await table.search()
  } catch {
    // Reported by the interceptor
  } finally {
    cleaning = false
  }
}

const detailOpen = ref(false)
const detail = ref<SysOperaLog>({})

const openDetail = (row: SysOperaLog) => {
  detail.value = row
  detailOpen.value = true
}

const { exportExcel, exporting } = useExport()

// Built on each click rather than once, so the sheet is written in the
// language the reader is in when they ask for it.
const handleExport = () => exportExcel({
  header: [
    t('admin.sysOperLog.exportHeader.operId'),
    t('admin.sysOperLog.exportHeader.module'),
    t('admin.sysOperLog.exportHeader.businessType'),
    t('admin.sysOperLog.exportHeader.operName'),
    t('admin.sysOperLog.exportHeader.operIp'),
    t('admin.sysOperLog.exportHeader.operLocation'),
    t('admin.sysOperLog.exportHeader.requestMethod'),
    t('admin.sysOperLog.exportHeader.operUrl'),
    t('admin.sysOperLog.exportHeader.status'),
    t('admin.sysOperLog.exportHeader.operDate')
  ],
  fields: ['id', 'title', 'businessType', 'operName', 'operIp', 'operLocation', 'requestMethod', 'operUrl', 'status', 'operTime'],
  // Dictionary-backed columns are resolved here rather than written as the
  // codes they are stored as. The sheet used to say 1 and 2 in the two columns
  // the table renders as 正常/关闭 and 新增/修改 -- readable on screen,
  // meaningless in the file, and the file is the half that gets sent on.
  rows: table.rows.map(row => ({
    ...row,
    businessType: dictLabel(sys_oper_type.value, row.businessType),
    status: dictLabel(sys_common_status.value, row.status)
  })) as Array<Record<string, unknown>>,
  filename: t('admin.sysOperLog.exportFilename')
})
</script>

<style lang="scss" scoped>
.log-payload {
  margin: 0;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
