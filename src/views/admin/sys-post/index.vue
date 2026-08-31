<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="postId" :actions-width="120">
      <template #search>
        <el-form-item :label="$t('admin.sysPost.postCode')">
          <el-input
            v-model="table.query.postCode"
            :placeholder="$t('admin.sysPost.postCodePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.postName')">
          <el-input
            v-model="table.query.postName"
            :placeholder="$t('admin.sysPost.postNamePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.sysPost.statusPlaceholder')"
            clearable
            style="width: 140px"
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
        <el-button v-permisaction="['admin:sysPost:add']" type="primary" @click="form.openCreate()">
          {{ $t('common.add') }}
        </el-button>
        <el-button
          v-permisaction="['admin:sysPost:edit']"
          :disabled="table.single"
          @click="form.openEdit(table.selection[0])"
        >{{ $t('common.edit') }}</el-button>
        <el-button
          v-permisaction="['admin:sysPost:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button
          v-permisaction="['admin:sysPost:export']"
          :loading="exporting"
          @click="handleExport"
        >{{ $t('common.export') }}</el-button>
      </template>

      <el-table-column :label="$t('admin.sysPost.postId')" prop="postId" min-width="90" />
      <el-table-column
        :label="$t('admin.sysPost.postCode')"
        prop="postCode"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('admin.sysPost.postName')"
        prop="postName"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.sysPost.postSort')" prop="sort" min-width="90" />
      <el-table-column :label="$t('admin.sysPost.status')" prop="status" min-width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'danger' : 'success'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysPost:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysPost:remove']" link type="danger" @click="remove(row.postId)">
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
        <el-form-item :label="$t('admin.sysPost.postName')" prop="postName">
          <el-input v-model="form.model.postName" :placeholder="$t('admin.sysPost.postNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.postCode')" prop="postCode">
          <el-input v-model="form.model.postCode" :placeholder="$t('admin.sysPost.codeNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.sort')" prop="sort">
          <el-input-number v-model="form.model.sort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.postStatus')" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio
              v-for="item in sys_normal_disable"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('admin.sysPost.remark')" prop="remark">
          <el-input
            v-model="form.model.remark"
            type="textarea"
            :placeholder="$t('admin.sysPost.remarkPlaceholder')"
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

import { listPost, getPostForForm, addPost, updatePost, delPost } from '@/api/admin/sys-post'
import { STATUS_NORMAL } from '@/api/status'
import type { SysPost, SysPostQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysPostManage' })

const { t } = useI18n()

const { sys_normal_disable } = useDict('sys_normal_disable')

const table = useTable<SysPost, SysPostQuery>({
  api: listPost,
  idKey: 'postId',
  defaultQuery: () => ({ postCode: undefined, postName: undefined, status: undefined })
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
  postName: [{ required: true, message: t('admin.sysPost.rules.postName'), trigger: 'blur' }],
  postCode: [{ required: true, message: t('admin.sysPost.rules.postCode'), trigger: 'blur' }],
  sort: [{ required: true, message: t('admin.sysPost.rules.sort'), trigger: 'blur' }]
}))

const form = useForm<SysPost, number>({
  defaultModel: () => ({
    postId: undefined,
    postCode: undefined,
    postName: undefined,
    sort: 0,
    status: STATUS_NORMAL,
    remark: undefined
  }),
  idKey: 'postId',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysPost.addTitle')),
    edit: computed(() => t('admin.sysPost.editTitle'))
  },
  api: {
    get: getPostForForm,
    add: addPost,
    update: model => updatePost(model, model.postId as number)
  },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delPost,
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

// Built on each click rather than once, so the sheet is written in the
// language the reader is in when they ask for it.
const handleExport = () => exportExcel({
  header: [
    t('admin.sysPost.exportHeader.postId'),
    t('admin.sysPost.exportHeader.postCode'),
    t('admin.sysPost.exportHeader.postName'),
    t('admin.sysPost.exportHeader.sort'),
    t('admin.sysPost.exportHeader.createdAt')
  ],
  fields: ['postId', 'postCode', 'postName', 'sort', 'createdAt'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: t('admin.sysPost.exportFilename')
})
</script>
