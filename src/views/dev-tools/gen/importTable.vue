<template>
  <el-dialog v-model="visible" title="导入表" width="820px" top="5vh" :close-on-click-modal="false">
    <ProTable
      ref="proTable"
      :table="table"
      selection
      row-key="tableName"
      :actions-width="0"
      max-height="320"
      @row-click="toggleRow"
    >
      <template #search>
        <el-form-item label="表名称">
          <el-input v-model="table.query.tableName" placeholder="请输入表名称" clearable style="width: 170px" />
        </el-form-item>
        <el-form-item label="表描述">
          <el-input v-model="table.query.tableComment" placeholder="请输入表描述" clearable style="width: 170px" />
        </el-form-item>
      </template>

      <el-table-column prop="tableName" label="表名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="tableComment" label="表描述" min-width="180" show-overflow-tooltip />
      <!-- DBTables comes out of INFORMATION_SCHEMA, which names these
           createTime and updateTime rather than createdAt/updatedAt -->
      <el-table-column prop="createTime" label="创建时间" min-width="150" />
      <el-table-column prop="updateTime" label="更新时间" min-width="150" />
    </ProTable>

    <template #footer>
      <span class="import-table__count">已选 {{ table.selection.length }} 张表</span>
      <el-button @click="visible = false">取 消</el-button>
      <el-button
        type="primary"
        :loading="importing"
        :disabled="!table.selection.length"
        @click="submit"
      >确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import { useTable } from '@/composables'
import { msgSuccess } from '@/utils/message'
import { listDbTable, importTable } from '@/api/tools/gen'
import type { DBTables, GenTableQuery } from '@/api/tools/gen'

defineOptions({ name: 'ImportTable' })

const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{ imported: [] }>()

const proTable = ref<{ toggleRowSelection: (row: DBTables, selected?: boolean) => void }>()

// Clicking anywhere on a row ticks it, which is how the previous dialog behaved
const toggleRow = (row: DBTables) => proTable.value?.toggleRowSelection(row)

/**
 * The database's own tables, not the generator's -- so nothing is fetched until
 * the dialog opens, and the list is refreshed each time it does.
 */
const table = useTable<DBTables, GenTableQuery>({
  api: listDbTable,
  idKey: 'tableName',
  immediate: false,
  defaultQuery: () => ({ tableName: undefined, tableComment: undefined })
})

watch(visible, open => {
  if (open) void table.search()
})

const importing = ref(false)

const submit = async() => {
  if (importing.value) return
  importing.value = true
  try {
    const tables = table.selection.map(row => String(row.tableName)).join(',')
    const response = await importTable({ tables })
    msgSuccess(response.msg || '导入成功')
    visible.value = false
    emit('imported')
  } catch {
    // Reported by the interceptor. The dialog stays open so the selection is
    // not lost -- the previous version closed it on failure as well.
  } finally {
    importing.value = false
  }
}
</script>

<style lang="scss" scoped>
.import-table__count {
  margin-right: auto;
  font-size: 13px;
  color: var(--ga-text-2);
}
</style>
