<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="id">
      <!-- Search fields. No prop attributes needed: resetQuery rebuilds the
           query from its factory rather than asking el-form to reset itself -->
      <template #search>
        <el-form-item :label="$t('demo.name')">
          <el-input v-model="table.query.name" :placeholder="$t('demo.namePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('demo.status')">
          <el-select v-model="table.query.status" :placeholder="$t('demo.statusPlaceholder')" clearable style="width: 120px">
            <el-option :label="$t('demo.normal')" value="1" />
            <el-option :label="$t('demo.disabled')" value="2" />
          </el-select>
        </el-form-item>
      </template>

      <!-- Permission codes are 模块:资源:操作 and must match sys_menu -->
      <template #toolbar>
        <el-button v-permisaction="['demo:product:add']" type="primary" @click="form.openCreate()">
          {{ $t('common.add') }}
        </el-button>
        <!-- Plain while it needs a selection; see AGENTS.md -->
        <el-button
          v-permisaction="['demo:product:delete']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >
          {{ $t('common.delete') }}
        </el-button>
      </template>

      <!-- min-width, not width: see AGENTS.md -->
      <el-table-column :label="$t('demo.name')" prop="name" min-width="120" show-overflow-tooltip />
      <el-table-column :label="$t('demo.code')" prop="code" min-width="100" />
      <el-table-column :label="$t('demo.price')" prop="price" min-width="90" align="right" />
      <el-table-column :label="$t('demo.status')" prop="status" min-width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'info'">
            {{ row.status === '1' ? $t('demo.normal') : $t('demo.disabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createdAt')" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>
      <template #actions="{ row }">
        <el-button v-permisaction="['demo:product:edit']" link type="primary" @click="form.openEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['demo:product:delete']" link type="danger" @click="remove(row.id)">
          {{ $t('common.delete') }}
        </el-button>
      </template>
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
        <el-form-item :label="$t('demo.name')" prop="name">
          <el-input v-model="form.model.name" :placeholder="$t('demo.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('demo.code')" prop="code">
          <el-input v-model="form.model.code" :placeholder="$t('demo.codePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('demo.price')" prop="price">
          <el-input-number v-model="form.model.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="$t('demo.status')" prop="status">
          <el-radio-group v-model="form.model.status">
            <el-radio value="1">{{ $t('demo.normal') }}</el-radio>
            <el-radio value="2">{{ $t('demo.disabled') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('demo.remark')" prop="remark">
          <el-input v-model="form.model.remark" type="textarea" :placeholder="$t('demo.remarkPlaceholder')" />
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
/**
 * Reference list page. Copy this shape for new pages.
 *
 * Everything that used to be repeated per page -- paging, search, reset,
 * selection, the create/edit dialog, the delete confirmation -- comes from
 * useTable and useForm. What is left is what actually differs: which endpoints,
 * which columns, which fields, which rules.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove } from '@/composables'

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

const { t } = useI18n()

// Computed, not a constant: module scope is evaluated once, so messages built
// from t() there would keep the language the module loaded in -- including one
// already displayed under a field. useForm accepts a MaybeRef.
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('demo.rules.name'), trigger: 'blur' }],
  code: [{ required: true, message: t('demo.rules.code'), trigger: 'blur' }]
}))

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
  api: delProduct,
  onSuccess: () => table.getList()
})
</script>
