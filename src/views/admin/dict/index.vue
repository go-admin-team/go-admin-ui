<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="id" :actions-width="120">
      <template #search>
        <el-form-item label="字典名称">
          <el-input v-model="table.query.dictName" placeholder="请输入字典名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="字典类型">
          <el-input v-model="table.query.dictType" placeholder="请输入字典类型" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="字典状态" clearable style="width: 130px">
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
        <el-button v-permisaction="['admin:sysDictType:add']" type="primary" @click="form.openCreate()">新增</el-button>
        <el-button
          v-permisaction="['admin:sysDictType:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
        <el-button v-permisaction="['admin:sysDictType:export']" :loading="exporting" @click="handleExport">导出</el-button>
      </template>

      <el-table-column label="编号" prop="id" width="80" />
      <el-table-column label="字典名称" prop="dictName" min-width="140" show-overflow-tooltip />
      <el-table-column label="字典类型" prop="dictType" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          <!-- The entries live on their own page, keyed by this record's id -->
          <router-link :to="{ name: 'SysDictDataManage', params: { dictId: row.id }}" class="link-type">
            {{ row.dictType }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
      <!--
        Not sortable: SysDictTypeOrder binds dictIdOrder and nothing else, so a
        header on this column would send createdAtOrder, which gin drops.
      -->
      <el-table-column label="创建时间" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysDictType:edit']" link type="primary" @click="form.openEdit(row)">
          修改
        </el-button>
        <el-button v-permisaction="['admin:sysDictType:remove']" link type="danger" @click="remove(row.id)">
          删除
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" :title="form.title" width="500px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="90px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.model.dictName" placeholder="请输入字典名称" :disabled="form.isEdit" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="form.model.dictType" placeholder="请输入字典类型" :disabled="form.isEdit" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio v-for="item in sys_normal_disable" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.model.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close()">取 消</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit()">确 定</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'

import { listType, getTypeForForm, addType, updateType, delType } from '@/api/admin/dict/type'
import type { SysDictType, SysDictTypeQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'Dict' })

const { sys_normal_disable } = useDict('sys_normal_disable')

const table = useTable<SysDictType, SysDictTypeQuery>({
  api: listType,
  idKey: 'id',
  defaultQuery: () => ({ dictName: undefined, dictType: undefined, status: undefined })
})

const rules: FormRules = {
  dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
}

const form = useForm<SysDictType, number>({
  defaultModel: () => ({
    id: undefined,
    dictName: undefined,
    dictType: undefined,
    status: '2',
    remark: undefined
  }),
  idKey: 'id',
  rules,
  title: { create: '添加字典类型', edit: '修改字典类型' },
  api: { get: getTypeForForm, add: addType, update: updateType },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delType,
  confirmText: count => `确认删除选中的 ${count} 个字典类型？`,
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

const handleExport = () => exportExcel({
  header: ['编号', '字典名称', '字典类型', '状态', '备注'],
  fields: ['id', 'dictName', 'dictType', 'status', 'remark'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: '字典类型'
})
</script>
