<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="jobId" :actions-width="150">
      <template #search>
        <el-form-item label="名称">
          <el-input v-model="table.query.jobName" placeholder="请输入名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="任务分组">
          <el-select v-model="table.query.jobGroup" placeholder="任务分组" clearable style="width: 130px">
            <el-option v-for="item in sys_job_group" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="任务状态" clearable style="width: 130px">
            <el-option v-for="item in sys_job_status" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['job:sysJob:add']" type="primary" @click="form.openCreate()">新增</el-button>
        <el-button
          v-permisaction="['job:sysJob:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
        <el-button v-permisaction="['job:sysJob:log']" @click="openLog">日志</el-button>
      </template>

      <el-table-column label="编码" prop="jobId" width="80" />
      <el-table-column label="名称" prop="jobName" min-width="140" show-overflow-tooltip />
      <el-table-column label="分组" prop="jobGroup" width="90">
        <template #default="{ row }">{{ dictLabel(sys_job_group, row.jobGroup) }}</template>
      </el-table-column>
      <el-table-column label="cron 表达式" prop="cronExpression" min-width="140" show-overflow-tooltip />
      <el-table-column label="调用目标" prop="invokeTarget" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="320">
            <p class="peek-line">参数：{{ row.args || '无' }}</p>
            <p class="peek-line">调用类型：{{ Number(row.jobType) === 1 ? '接口' : '函数' }}</p>
            <p class="peek-line">执行策略：{{ MISFIRE[Number(row.misfirePolicy)] ?? '-' }}</p>
            <p class="peek-line">并发：{{ Number(row.concurrent) === 0 ? '允许' : '禁止' }}</p>
            <template #reference><span>{{ row.invokeTarget }}</span></template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_job_status, String(row.status)) }}
          </el-tag>
        </template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['job:sysJob:edit']" link type="primary" @click="form.openEdit(row)">
          修改
        </el-button>
        <!--
          entry_id is the handle cron gives a scheduled job, so zero means it is
          not running. A disabled job (status 1) can be neither started nor
          stopped, which is why both buttons check it.
        -->
        <el-button
          v-if="Number(row.entry_id) !== 0 && Number(row.status) !== 1"
          v-permisaction="['job:sysJob:remove']"
          link
          type="primary"
          @click="toggle(row, 'stop')"
        >停止</el-button>
        <el-button
          v-else-if="Number(row.entry_id) === 0 && Number(row.status) !== 1"
          v-permisaction="['job:sysJob:start']"
          link
          type="primary"
          @click="toggle(row, 'start')"
        >启动</el-button>
        <!-- Icon rather than the words, per the two-button rule -->
        <el-button
          v-permisaction="['job:sysJob:remove']"
          link
          type="danger"
          class="row-icon-action"
          :title="`删除任务：${row.jobName}`"
          @click="remove(row.jobId)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" v-dialogDrag :title="form.title" width="700px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="名称" prop="jobName">
              <el-input v-model="form.model.jobName" placeholder="名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务分组" prop="jobGroup">
              <el-select v-model="form.model.jobGroup" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in sys_job_group" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="invokeTarget">
              <template #label>
                <FieldLabel
                  label="调用目标"
                  tip="调用示例：func (t *EXEC) ExamplesNoParam(){..} 填写 ExamplesNoParam 即可；目前不支持带参调用"
                />
              </template>
              <el-input v-model="form.model.invokeTarget" placeholder="调用目标" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="args">
              <template #label>
                <FieldLabel
                  label="目标参数"
                  tip="有参：请以 string 格式填写；无参：留空。目前仅支持函数调用"
                />
              </template>
              <el-input v-model="form.model.args" placeholder="目标参数" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="cron 表达式" prop="cronExpression">
              <el-input v-model="form.model.cronExpression" placeholder="cron 表达式" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否并发" prop="concurrent">
              <el-radio-group v-model="form.model.concurrent">
                <el-radio-button :value="0">允许</el-radio-button>
                <el-radio-button :value="1">禁止</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调用类型" prop="jobType">
              <el-radio-group v-model="form.model.jobType">
                <el-radio-button :value="1">接口</el-radio-button>
                <el-radio-button :value="2">函数</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.model.status" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in sys_job_status" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="执行策略" prop="misfirePolicy">
              <el-radio-group v-model="form.model.misfirePolicy">
                <el-radio-button v-for="(label, value) in MISFIRE" :key="value" :value="Number(value)">
                  {{ label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="form.close()">取 消</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit()">确 定</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import FieldLabel from '@/components/FieldLabel/index.vue'
import { STATUS_NORMAL } from '@/api/status'
import { useTable, useForm, useRemove, useDict, dictLabel } from '@/composables'
import { msgSuccess } from '@/utils/message'

import {
  listSysJob, getSysJobForForm, addSysJob, updateSysJob, delSysJob, removeJob, startJob
} from '@/api/job/sys-job'
import type { SysJob, SysJobQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'ScheduleManage' })

const router = useRouter()
const { sys_job_group, sys_job_status } = useDict('sys_job_group', 'sys_job_status')

/** What the scheduler does with a run it missed. */
const MISFIRE: Record<number, string> = { 1: '立即执行', 2: '执行一次', 3: '放弃执行' }

const table = useTable<SysJob, SysJobQuery>({
  api: listSysJob,
  idKey: 'jobId',
  defaultQuery: () => ({ jobName: undefined, jobGroup: undefined, status: undefined })
})

const rules: FormRules = {
  jobName: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  jobGroup: [{ required: true, message: '任务分组不能为空', trigger: 'change' }],
  invokeTarget: [{ required: true, message: '调用目标不能为空', trigger: 'blur' }],
  cronExpression: [{ required: true, message: 'cron 表达式不能为空', trigger: 'blur' }]
}

const form = useForm<SysJob, number>({
  defaultModel: () => ({
    jobId: undefined,
    jobName: undefined,
    jobGroup: 'DEFAULT',
    jobType: 2,
    cronExpression: undefined,
    invokeTarget: undefined,
    args: undefined,
    misfirePolicy: 1,
    concurrent: 0,
    status: STATUS_NORMAL
  }),
  idKey: 'jobId',
  rules,
  title: { create: '添加任务', edit: '修改任务' },
  api: { get: getSysJobForForm, add: addSysJob, update: updateSysJob },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delSysJob,
  confirmText: count => `确认删除选中的 ${count} 个任务？`,
  onSuccess: () => table.getList()
})

/**
 * Start and stop share everything but a verb and an endpoint.
 *
 * `pending` covers the dialog rather than just the request: without it a
 * double-clicked button stacks two confirms and fires the job twice -- the
 * failure useRemove guards against, which a hand-rolled confirm has to guard
 * against too.
 */
let pending = false

const toggle = async(row: SysJob, action: 'start' | 'stop') => {
  if (pending) return
  pending = true
  const verb = action === 'start' ? '启动' : '停止'
  try {
    await ElMessageBox.confirm(`确认${verb}任务「${row.jobName}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    pending = false
    return
  }
  try {
    const call = action === 'start' ? startJob : removeJob
    const response = await call(row.jobId as number)
    msgSuccess(response.msg || `${verb}成功`)
    await table.getList()
  } catch {
    // Reported by the interceptor
  } finally {
    pending = false
  }
}

// The seed registers this route as JobLog; the previous version pushed
// 'job_log', which matches nothing, so the button navigated nowhere at all.
const openLog = () => router.push({ name: 'JobLog' })
</script>
