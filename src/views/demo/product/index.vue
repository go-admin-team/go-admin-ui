<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="id">
      <!-- Search fields. No prop attributes needed: resetQuery rebuilds the
           query from its factory rather than asking el-form to reset itself -->
      <template #search>
        <el-form-item label="名称">
          <el-input v-model="table.query.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" value="1" />
            <el-option label="停用" value="2" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Permission codes are 模块:资源:操作 and must match sys_menu -->
      <template #toolbar>
        <el-button v-permisaction="['demo:product:add']" type="primary" @click="form.openCreate()">
          新增
        </el-button>
        <el-button
          v-permisaction="['demo:product:delete']"
          type="danger"
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >
          删除
        </el-button>
      </template>

      <!-- min-width, not width: see the note in views/admin/sys-user -->
      <el-table-column label="名称" prop="name" min-width="120" show-overflow-tooltip />
      <el-table-column label="编码" prop="code" min-width="100" />
      <el-table-column label="单价" prop="price" min-width="90" align="right" />
      <el-table-column label="状态" min-width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'info'">
            {{ row.status === '1' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="110">
        <template #default="{ row }">
          <span :title="parseTime(row.createdAt)">{{ parseTime(row.createdAt, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" class-name="row-actions">
        <template #default="{ row }">
          <el-button v-permisaction="['demo:product:edit']" link type="primary" @click="form.openEdit(row)">
            修改
          </el-button>
          <el-button v-permisaction="['demo:product:delete']" link type="danger" @click="remove(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- One dialog for both modes; useForm tells them apart by the primary key -->
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
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.model.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.model.code" placeholder="请输入编码" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.model.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio value="1">正常</el-radio>
            <el-radio value="2">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.model.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="form.close">取 消</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit">确 定</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
/**
 * Reference list page. Copy this shape for new pages.
 *
 * Everything that used to be repeated per page -- paging, search, reset,
 * selection, the create/edit dialog, the delete confirmation -- comes from
 * useTable and useForm. What is left is what actually differs: which endpoints,
 * which columns, which fields, which rules.
 */
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { useTable, useForm, useRemove } from '@/composables'
import { parseTime } from '@/utils/costum'

import {
  listProduct, getProduct, addProduct, updateProduct, delProduct
} from '@/api/demo/product'
import type { Product, ProductQuery } from '@/api/demo/product'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'DemoProduct' })

const table = useTable<Product, ProductQuery>({
  api: listProduct,
  idKey: 'id',
  defaultQuery: () => ({ name: undefined, status: undefined })
})

const rules: FormRules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '编码不能为空', trigger: 'blur' }]
}

const form = useForm<Product, number>({
  defaultModel: () => ({
    id: undefined,
    name: undefined,
    code: undefined,
    price: 0,
    status: '1',
    remark: undefined
  }),
  idKey: 'id',
  rules,
  api: { get: getProduct, add: addProduct, update: updateProduct },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  // Ids arrive as string | number; this endpoint wants numbers
  api: ids => delProduct({ ids: ids.map(Number) }),
  onSuccess: () => table.getList()
})
</script>
