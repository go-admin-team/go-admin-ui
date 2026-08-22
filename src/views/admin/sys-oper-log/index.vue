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
        <el-form-item label="访问地址">
          <el-input v-model="table.query.operUrl" placeholder="请输入访问地址" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="操作状态" clearable style="width: 130px">
            <el-option
              v-for="item in sys_common_status"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="operatedBetween"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
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
        >删除</el-button>
        <el-button v-permisaction="['admin:sysOperLog:remove']" type="danger" plain @click="handleClean">
          清空
        </el-button>
        <el-button v-permisaction="['admin:sysOperLog:export']" :loading="exporting" @click="handleExport">
          导出
        </el-button>
      </template>

      <el-table-column label="编号" prop="id" min-width="80" />
      <el-table-column label="请求" prop="operUrl" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="360">
            <p class="peek-line">Host：{{ row.operIp }}</p>
            <p class="peek-line">归属地：{{ row.operLocation || '-' }}</p>
            <p class="peek-line">耗时：{{ row.latencyTime || '-' }}</p>
            <template #reference>
              <span>
                <MethodTag :method="row.requestMethod" />
                {{ row.operUrl }}
              </span>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="操作人员" prop="operName" min-width="130" show-overflow-tooltip />
      <el-table-column label="状态" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- prop is createdAt because createdAtOrder is the only order key
           SysOperaLogOrder binds; see the same column on the login log page -->
      <el-table-column label="操作日期" prop="createdAt" min-width="150" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.operTime" pattern="{y}-{m}-{d} {h}:{i}" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysOperLog:query']" link type="primary" @click="openDetail(row)">
          详细
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="detailOpen" title="操作日志详细" width="720px" :close-on-click-modal="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="请求地址" :span="2">{{ detail.operUrl }}</el-descriptions-item>
        <el-descriptions-item label="登录信息">
          {{ detail.operName }} / {{ detail.operIp }} / {{ detail.operLocation || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ detail.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.latencyTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ parseTime(detail.operTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="系统模块">{{ detail.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="Number(detail.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_common_status, detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="log-payload">{{ detail.operParam || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="返回参数" :span="2">
          <pre class="log-payload">{{ detail.jsonResult || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailOpen = false">关 闭</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

const { sys_common_status } = useDict('sys_common_status')

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
  confirmText: count => `确认删除选中的 ${count} 条操作日志？`,
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
    await ElMessageBox.confirm('确认清空全部操作日志？此操作不可撤销。', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    cleaning = false
    return
  }
  try {
    await cleanOperlog()
    msgSuccess('已清空')
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

const handleExport = () => exportExcel({
  header: ['编号', '系统模块', '操作类型', '操作人员', '主机', '操作地点', '请求方式', '请求地址', '状态', '操作日期'],
  fields: ['id', 'title', 'businessType', 'operName', 'operIp', 'operLocation', 'requestMethod', 'operUrl', 'status', 'operTime'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: '操作日志'
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
