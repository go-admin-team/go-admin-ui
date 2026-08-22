<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="dictCode" :actions-width="120">
      <template #search>
        <el-form-item label="字典名称">
          <el-select v-model="table.query.dictType" style="width: 180px">
            <el-option
              v-for="item in typeOptions"
              :key="item.id"
              :label="item.dictName"
              :value="item.dictType as string"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字典标签">
          <el-input v-model="table.query.dictLabel" placeholder="请输入字典标签" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="数据状态" clearable style="width: 130px">
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
        <el-button v-permisaction="['admin:sysDictData:add']" type="primary" @click="handleAdd">新增</el-button>
        <el-button
          v-permisaction="['admin:sysDictData:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
      </template>

      <el-table-column label="编码" prop="dictCode" width="80" />
      <el-table-column label="字典标签" prop="dictLabel" min-width="140" show-overflow-tooltip />
      <el-table-column label="字典键值" prop="dictValue" min-width="140" show-overflow-tooltip />
      <el-table-column label="排序" prop="dictSort" width="80" />
      <el-table-column label="状态" prop="status" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 2 ? 'success' : 'danger'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysDictData:edit']" link type="primary" @click="form.openEdit(row)">
          修改
        </el-button>
        <el-button v-permisaction="['admin:sysDictData:remove']" link type="danger" @click="remove(row.dictCode)">
          删除
        </el-button>
      </template>
    </ProTable>

    <el-dialog v-model="form.visible" :title="form.title" width="500px" :close-on-click-modal="false">
      <el-form :ref="form.bindFormRef" :model="form.model" :rules="form.rules" label-width="90px">
        <el-form-item label="字典类型">
          <el-input v-model="form.model.dictType" disabled />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="form.model.dictLabel" placeholder="请输入数据标签" />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model="form.model.dictValue" placeholder="请输入数据键值" :disabled="form.isEdit" />
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="form.model.dictSort" controls-position="right" :min="0" />
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, dictLabel } from '@/composables'

import { listType, getType } from '@/api/admin/dict/type'
import { listData, getDataForForm, addData, updateData, delData } from '@/api/admin/dict/data'
import type { SysDictData, SysDictDataQuery, SysDictType } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysDictDataManage' })

const route = useRoute()
const { sys_normal_disable } = useDict('sys_normal_disable')

/**
 * The one page whose first request cannot go out on mount.
 *
 * The route carries a dict *id*, but the entries endpoint filters on the dict
 * *type* string -- so the type has to be fetched and written into the query
 * before a list request means anything. `immediate: false` is exactly this: no
 * request until the page says so.
 */
// Declared before useTable: defaultQuery runs during that call. Held outside the
// query because the search bar's own dictType select is editable, while this is
// the dictionary the page was opened for -- what resetQuery rebuilds back to,
// rather than an empty type, which the endpoint reads as "every entry in the
// system". Not a ref: nothing renders it, every read is inside a function body.
let currentType = ''

const table = useTable<SysDictData, SysDictDataQuery>({
  api: listData,
  idKey: 'dictCode',
  immediate: false,
  defaultQuery: () => ({ dictType: currentType, dictLabel: undefined, status: undefined })
})

const typeOptions = ref<SysDictType[]>([])

onMounted(async() => {
  // The picker's options are fetched alongside but not waited on: only the
  // type gates the list, so the rows do not wait on the slower of the two
  const options = listType({ pageSize: 1000 })
    .then(response => { typeOptions.value = response.data?.list ?? [] })
    .catch(() => { /* Reported by the interceptor; the picker stays empty */ })

  try {
    const type = await getType(Number(route.params.dictId))
    currentType = type.data?.dictType ?? ''
    table.query.dictType = currentType
  } catch {
    // Reported by the interceptor. Without the catch this rejects inside the
    // mounted hook with nobody attached, and the page sits empty with no clue.
    return
  }
  await table.getList()
  await options
})

const rules: FormRules = {
  dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
  dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
  dictSort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }]
}

const form = useForm<SysDictData, number>({
  defaultModel: () => ({
    dictCode: undefined,
    dictType: currentType,
    dictLabel: undefined,
    dictValue: undefined,
    dictSort: 0,
    status: '2',
    remark: undefined
  }),
  idKey: 'dictCode',
  rules,
  title: { create: '添加字典数据', edit: '修改字典数据' },
  api: { get: getDataForForm, add: addData, update: updateData },
  onSuccess: () => table.getList()
})

// The dictionary this page belongs to is not a choice; the form shows it locked
const handleAdd = () => form.openCreate({ dictType: currentType })

const { remove } = useRemove({
  api: delData,
  confirmText: count => `确认删除选中的 ${count} 条字典数据？`,
  onSuccess: () => table.getList()
})
</script>
