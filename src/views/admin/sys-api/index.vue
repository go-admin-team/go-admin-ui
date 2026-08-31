<template>
  <PageContainer>
    <ProTable :table="table" row-key="id" :actions-width="80">
      <template #search>
        <el-form-item :label="$t('admin.sysApi.title')">
          <el-input
            v-model="table.query.title"
            :placeholder="$t('admin.sysApi.titlePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysApi.path')">
          <el-input
            v-model="table.query.path"
            :placeholder="$t('admin.sysApi.pathPlaceholder')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="Method">
          <el-select
            v-model="table.query.action"
            :placeholder="$t('admin.sysApi.selectPlaceholder')"
            clearable
            style="width: 120px"
          >
            <el-option v-for="method in METHODS" :key="method" :value="method" :label="method" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.sysApi.type')">
          <el-select
            v-model="table.query.type"
            :placeholder="$t('admin.sysApi.selectPlaceholder')"
            clearable
            style="width: 110px"
          >
            <el-option value="SYS" label="SYS" />
            <el-option value="BUS" label="BUS" />
          </el-select>
        </el-form-item>
      </template>

      <el-table-column
        :label="$t('admin.sysApi.title')"
        prop="title"
        min-width="240"
        sortable="custom"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <!-- SYS routes are infrastructure and cannot be granted to a role,
               which is the distinction the colour carries. -->
          <el-tag v-if="!row.title" type="danger" disable-transitions>{{ $t('admin.sysApi.none') }}</el-tag>
          <el-tag v-else :type="row.type === 'SYS' ? 'success' : 'info'" disable-transitions>
            [{{ row.type }}] {{ row.title }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        :label="$t('admin.sysApi.api')"
        prop="path"
        min-width="280"
        sortable="custom"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="360">
            <p class="peek-line">{{ $t('admin.sysApi.peekHandle', { value: row.handle || '-' }) }}</p>
            <p class="peek-line">{{ $t('admin.sysApi.peekType', { value: row.type || '-' }) }}</p>
            <p class="peek-line">
              {{ $t('admin.sysApi.peekTitle', { value: row.title || $t('admin.sysApi.none') }) }}
            </p>
            <template #reference>
              <span><MethodTag :method="row.action" /> {{ row.path }}</span>
            </template>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="120" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysApi:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
      </template>
    </ProTable>

    <!--
      A drawer rather than a dialog: this form sits beside the row it edits, and
      the page is scanned route by route. Kept from the version this replaces.
    -->
    <el-drawer v-model="form.visible" :title="form.title" direction="rtl" size="420px">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="80px">
        <el-form-item label="Handle" prop="handle">
          <el-input v-model="form.model.handle" placeholder="handle" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysApi.title')" prop="title">
          <el-input v-model="form.model.title" :placeholder="$t('admin.sysApi.title')" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysApi.type')" prop="type">
          <el-select
            v-model="form.model.type"
            :placeholder="$t('admin.sysApi.typePlaceholder')"
            style="width: 100%"
          >
            <el-option value="SYS" label="SYS" />
            <el-option value="BUS" label="BUS" />
          </el-select>
        </el-form-item>
        <el-form-item label="Method" prop="action">
          <el-select
            v-model="form.model.action"
            :placeholder="$t('admin.sysApi.actionPlaceholder')"
            style="width: 100%"
          >
            <el-option v-for="method in METHODS" :key="method" :value="method" :label="method" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('admin.sysApi.path')" prop="path">
          <!-- The path identifies the route; the backend registers it, so it is
               shown for confirmation rather than offered for editing. -->
          <el-input v-model="form.model.path" disabled :placeholder="$t('admin.sysApi.path')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close()">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit()">
          {{ $t('common.dialogConfirm') }}
        </el-button>
      </template>
    </el-drawer>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import MethodTag from '@/components/MethodTag/index.vue'
import { useTable, useForm } from '@/composables'

import { listSysApi, getSysApi, updateSysApi } from '@/api/admin/sys-api'
import type { SysApi, SysApiQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysApiManage' })

const { t } = useI18n()

const METHODS = ['GET', 'POST', 'PUT', 'DELETE']

/**
 * Routes are registered by the Go side, so this page edits them and nothing
 * else: no create, no delete. The version it replaces carried handleAdd,
 * handleDelete and selection tracking that no button in the template reached.
 */
const table = useTable<SysApi, SysApiQuery>({
  api: listSysApi,
  idKey: 'id',
  defaultQuery: () => ({ title: undefined, path: undefined, action: undefined, type: undefined })
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
  handle: [{ required: true, message: t('admin.sysApi.rules.handle'), trigger: 'blur' }],
  title: [{ required: true, message: t('admin.sysApi.rules.title'), trigger: 'blur' }],
  type: [{ required: true, message: t('admin.sysApi.rules.type'), trigger: 'change' }]
}))

const form = useForm<SysApi, number>({
  defaultModel: () => ({
    id: undefined,
    handle: undefined,
    title: undefined,
    type: 'BUS',
    action: undefined,
    path: undefined
  }),
  idKey: 'id',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the drawer to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysApi.addTitle')),
    edit: computed(() => t('admin.sysApi.editTitle'))
  },
  api: { get: getSysApi, update: updateSysApi },
  onSuccess: () => table.getList()
})
</script>
