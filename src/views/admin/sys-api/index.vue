<template>
  <PageContainer>
    <ProTable :table="table" row-key="id" :actions-width="80">
      <template #search>
        <el-form-item label="标题">
          <el-input v-model="table.query.title" placeholder="请输入标题" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="table.query.path" placeholder="请输入地址" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="Method">
          <el-select v-model="table.query.action" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="method in METHODS" :key="method" :value="method" :label="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="table.query.type" placeholder="请选择" clearable style="width: 110px">
            <el-option value="SYS" label="SYS" />
            <el-option value="BUS" label="BUS" />
          </el-select>
        </el-form-item>
      </template>

      <el-table-column label="标题" prop="title" min-width="240" sortable="custom" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- SYS routes are infrastructure and cannot be granted to a role,
               which is the distinction the colour carries. -->
          <el-tag v-if="!row.title" type="danger" disable-transitions>暂无</el-tag>
          <el-tag v-else :type="row.type === 'SYS' ? 'success' : 'info'" disable-transitions>
            [{{ row.type }}] {{ row.title }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="接口" prop="path" min-width="280" sortable="custom" show-overflow-tooltip>
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="360">
            <p class="peek-line">Handle：{{ row.handle || '-' }}</p>
            <p class="peek-line">类型：{{ row.type || '-' }}</p>
            <p class="peek-line">标题：{{ row.title || '暂无' }}</p>
            <template #reference>
              <span><MethodTag :method="row.action" /> {{ row.path }}</span>
            </template>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" prop="createdAt" min-width="120" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysApi:edit']" link type="primary" @click="form.openEdit(row)">
          修改
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
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.model.title" placeholder="标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.model.type" placeholder="请选择类型" style="width: 100%">
            <el-option value="SYS" label="SYS" />
            <el-option value="BUS" label="BUS" />
          </el-select>
        </el-form-item>
        <el-form-item label="Method" prop="action">
          <el-select v-model="form.model.action" placeholder="请选择方式" style="width: 100%">
            <el-option v-for="method in METHODS" :key="method" :value="method" :label="method" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="path">
          <!-- The path identifies the route; the backend registers it, so it is
               shown for confirmation rather than offered for editing. -->
          <el-input v-model="form.model.path" disabled placeholder="地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close()">取 消</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit()">确 定</el-button>
      </template>
    </el-drawer>
  </PageContainer>
</template>

<script setup lang="ts">
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

const rules: FormRules = {
  handle: [{ required: true, message: 'handle 不能为空', trigger: 'blur' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }]
}

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
  title: { create: '添加接口', edit: '修改接口' },
  api: { get: getSysApi, update: updateSysApi },
  onSuccess: () => table.getList()
})
</script>
