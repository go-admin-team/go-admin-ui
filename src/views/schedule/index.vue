<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="jobId" :actions-width="150">
      <template #search>
        <el-form-item :label="$t('schedule.name')">
          <el-input
            v-model="table.query.jobName"
            :placeholder="$t('schedule.namePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('schedule.jobGroup')">
          <el-select
            v-model="table.query.jobGroup"
            :placeholder="$t('schedule.jobGroup')"
            clearable
            style="width: 130px"
          >
            <el-option v-for="item in sys_job_group" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('schedule.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('schedule.statusPlaceholder')"
            clearable
            style="width: 130px"
          >
            <el-option v-for="item in sys_job_status" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['job:sysJob:add']" type="primary" @click="form.openCreate()">
          {{ $t('common.add') }}
        </el-button>
        <el-button
          v-permisaction="['job:sysJob:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button v-permisaction="['job:sysJob:log']" @click="openLog">{{ $t('schedule.log') }}</el-button>
      </template>

      <el-table-column :label="$t('schedule.jobId')" prop="jobId" width="80" />
      <el-table-column :label="$t('schedule.name')" prop="jobName" min-width="140" show-overflow-tooltip />
      <el-table-column :label="$t('schedule.group')" prop="jobGroup" width="90">
        <template #default="{ row }">{{ dictLabel(sys_job_group, row.jobGroup) }}</template>
      </el-table-column>
      <el-table-column
        :label="$t('schedule.cronExpression')"
        prop="cronExpression"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('schedule.invokeTarget')"
        prop="invokeTarget"
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="320">
            <p class="peek-line">{{ $t('schedule.peekArgs', { value: row.args || $t('schedule.none') }) }}</p>
            <p class="peek-line">
              {{ $t('schedule.peekJobType', {
                value: Number(row.jobType) === 1 ? $t('schedule.jobTypeApi') : $t('schedule.jobTypeFunc')
              }) }}
            </p>
            <p class="peek-line">
              {{ $t('schedule.peekMisfire', { value: MISFIRE[Number(row.misfirePolicy)] ?? '-' }) }}
            </p>
            <p class="peek-line">
              {{ $t('schedule.peekConcurrent', {
                value: Number(row.concurrent) === 0 ? $t('schedule.allow') : $t('schedule.forbid')
              }) }}
            </p>
            <template #reference><span>{{ row.invokeTarget }}</span></template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column :label="$t('schedule.status')" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_job_status, String(row.status)) }}
          </el-tag>
        </template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['job:sysJob:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
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
        >{{ $t('schedule.stop') }}</el-button>
        <el-button
          v-else-if="Number(row.entry_id) === 0 && Number(row.status) !== 1"
          v-permisaction="['job:sysJob:start']"
          link
          type="primary"
          @click="toggle(row, 'start')"
        >{{ $t('schedule.start') }}</el-button>
        <!-- Icon rather than the words, per the two-button rule -->
        <el-button
          v-permisaction="['job:sysJob:remove']"
          link
          type="danger"
          class="row-icon-action"
          :title="$t('schedule.deleteTitle', { name: row.jobName })"
          @click="remove(row.jobId)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" :title="form.title" width="700px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('schedule.name')" prop="jobName">
              <el-input v-model="form.model.jobName" :placeholder="$t('schedule.name')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('schedule.jobGroup')" prop="jobGroup">
              <el-select
                v-model="form.model.jobGroup"
                :placeholder="$t('schedule.selectPlaceholder')"
                style="width: 100%"
              >
                <el-option v-for="item in sys_job_group" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="invokeTarget">
              <template #label>
                <FieldLabel
                  :label="$t('schedule.invokeTarget')"
                  :tip="$t('schedule.invokeTargetTip')"
                />
              </template>
              <el-input v-model="form.model.invokeTarget" :placeholder="$t('schedule.invokeTarget')" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="args">
              <template #label>
                <FieldLabel
                  :label="$t('schedule.args')"
                  :tip="$t('schedule.argsTip')"
                />
              </template>
              <el-input v-model="form.model.args" :placeholder="$t('schedule.args')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('schedule.cronExpression')" prop="cronExpression">
              <el-input v-model="form.model.cronExpression" :placeholder="$t('schedule.cronExpression')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('schedule.concurrent')" prop="concurrent">
              <el-radio-group v-model="form.model.concurrent">
                <el-radio-button :value="0">{{ $t('schedule.allow') }}</el-radio-button>
                <el-radio-button :value="1">{{ $t('schedule.forbid') }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('schedule.jobType')" prop="jobType">
              <el-radio-group v-model="form.model.jobType">
                <el-radio-button :value="1">{{ $t('schedule.jobTypeApi') }}</el-radio-button>
                <el-radio-button :value="2">{{ $t('schedule.jobTypeFunc') }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('schedule.status')" prop="status">
              <el-select
                v-model="form.model.status"
                :placeholder="$t('schedule.selectPlaceholder')"
                style="width: 100%"
              >
                <el-option v-for="item in sys_job_status" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('schedule.misfirePolicy')" prop="misfirePolicy">
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

const { t } = useI18n()
const router = useRouter()
const { sys_job_group, sys_job_status } = useDict('sys_job_group', 'sys_job_status')

/**
 * What the scheduler does with a run it missed.
 *
 * Computed, not a plain object: the radio group and the hover card both read it
 * on every render, and a table already on screen has to follow a language
 * change without refetching.
 */
const MISFIRE = computed<Record<number, string>>(() => ({
  1: t('schedule.misfire.immediate'),
  2: t('schedule.misfire.once'),
  3: t('schedule.misfire.skip')
}))

const table = useTable<SysJob, SysJobQuery>({
  api: listSysJob,
  idKey: 'jobId',
  defaultQuery: () => ({ jobName: undefined, jobGroup: undefined, status: undefined })
})

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object is evaluated once, at setup, so a message already rendered
 * under a field would keep the language the page was opened in -- and this page
 * is kept alive, so reopening the dialog does not re-run setup. useForm unwraps
 * the ref, so :rules="form.rules" is unchanged.
 */
const rules = computed<FormRules>(() => ({
  jobName: [{ required: true, message: t('schedule.rules.jobName'), trigger: 'blur' }],
  jobGroup: [{ required: true, message: t('schedule.rules.jobGroup'), trigger: 'change' }],
  invokeTarget: [{ required: true, message: t('schedule.rules.invokeTarget'), trigger: 'blur' }],
  cronExpression: [{ required: true, message: t('schedule.rules.cronExpression'), trigger: 'blur' }]
}))

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
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('schedule.addTitle')),
    edit: computed(() => t('schedule.editTitle'))
  },
  api: { get: getSysJobForForm, add: addSysJob, update: updateSysJob },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delSysJob,
  // A function, so the sentence is built when the dialog opens
  confirmText: count => t('schedule.deleteConfirm', { count }, count),
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
  // Two whole sentences rather than one with the verb interpolated. The verb
  // sits mid-sentence in Chinese and at the front in English, so a shared
  // template with a {verb} slot cannot be right in both. Both keys are spelled
  // out so tests/unit/lang/usage.spec.ts can see them.
  const question = action === 'start'
    ? t('schedule.startConfirm', { name: row.jobName })
    : t('schedule.stopConfirm', { name: row.jobName })
  try {
    await ElMessageBox.confirm(question, t('common.notice'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    pending = false
    return
  }
  try {
    const call = action === 'start' ? startJob : removeJob
    const response = await call(row.jobId as number)
    const done = action === 'start' ? t('schedule.startSuccess') : t('schedule.stopSuccess')
    msgSuccess(response.msg || done)
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
