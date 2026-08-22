<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basic">
        <BasicInfoForm ref="basicForm" v-model="info" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="cloum">
        <el-alert
          title="⚠️表字段中的id、create_by、update_by、created_at、updated_at、deleted_at的字段在此列表中已经隐藏"
          type="warning"
          show-icon
        />
        <el-table :data="columns" max-height="calc(100vh - 300px)" style="width: 100%">
          <el-table-column fixed label="序号" type="index" width="50" />
          <el-table-column
            fixed
            label="字段列名"
            prop="columnName"
            width="150"
            :show-overflow-tooltip="true"
          />
          <el-table-column fixed label="字段描述" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.columnComment" />
            </template>
          </el-table-column>
          <el-table-column
            label="物理类型"
            prop="columnType"
            width="120"
            :show-overflow-tooltip="true"
          />
          <el-table-column label="go类型" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.goType">
                <el-option label="int64" value="int64" />
                <el-option label="string" value="string" />
                <!-- <el-option label="int" value="int" />
                <el-option label="bool" value="bool" /> -->
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="go属性" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.goField" />
            </template>
          </el-table-column>
          <el-table-column label="json属性" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.jsonField" />
            </template>
          </el-table-column>

          <el-table-column label="编辑" width="50">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isInsert" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <!--
            #header, not :render-header. The render functions this replaces were
            Vue 2 syntax -- h('el-popover', { props }) with slot: 'reference' --
            which throws under Vue 3, and one throwing header renderer takes the
            whole header row with it: the table rendered with zero <th> and no
            column labels at all.
          -->
          <el-table-column label="列表" width="80" align="center">
            <template #header><FieldLabel label="列表" tip="是否在列表中展示，打勾表示展示" /></template>
            <template #default="scope">
              <el-checkbox v-model="scope.row.isList" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询" width="80" align="center">
            <template #header><FieldLabel label="查询" tip="是否作为搜索条件，打勾表示作为条件" /></template>
            <template #default="scope">
              <el-checkbox v-model="scope.row.isQuery" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="查询方式" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.queryType">
                <el-option label="=" value="EQ" />
                <el-option label="!=" value="NE" />
                <el-option label=">" value="GT" />
                <el-option label=">=" value="GTE" />
                <el-option label="<" value="LT" />
                <el-option label="<=" value="LTE" />
                <el-option label="LIKE" value="LIKE" />
                <!-- <el-option label="BETWEEN" value="BETWEEN" /> -->
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="必填" width="50">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isRequired" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column label="显示类型" width="140">
            <template #default="scope">
              <el-select v-model="scope.row.htmlType">
                <el-option label="文本框" value="input" />
                <el-option label="下拉框" value="select" />
                <el-option label="单选框" value="radio" />
                <!-- <el-option label="文件选择" value="file" /> -->
                <!-- <el-option label="复选框" value="checkbox" />
                <el-option label="日期控件" value="datetime" />-->
                <el-option label="文本域" value="textarea" />

              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="字典类型" width="160">
            <template #default="scope">
              <el-select v-model="scope.row.dictType" clearable filterable placeholder="请选择">
                <el-option
                  v-for="dict in dictOptions"
                  :key="dict.dictType"
                  :label="dict.dictName"
                  :value="dict.dictType"
                >
                  <span style="float: left">{{ dict.dictName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表" width="160">
            <template #default="scope">
              <el-select v-model="scope.row.fkTableName" clearable filterable placeholder="请选择" @change="attachForeignColumns(scope.row)">
                <el-option
                  v-for="table in tableTree"
                  :key="table.tableName"
                  :label="table.tableName"
                  :value="table.tableName"
                >
                  <span style="float: left">{{ table.tableName }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ table.tableComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表key" width="150">
            <template #default="scope">
              <el-select v-model="scope.row.fkLabelId" clearable filterable placeholder="请选择">
                <el-option
                  v-for="column in scope.row.fkCol"
                  :key="column.columnName"
                  :label="column.columnName"
                  :value="column.jsonField"
                >
                  <span style="float: left">{{ column.jsonField }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ column.columnComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="关系表value" width="150">
            <template #default="scope">
              <el-select v-model="scope.row.fkLabelName" clearable filterable placeholder="请选择">
                <el-option
                  v-for="column in scope.row.fkCol"
                  :key="column.columnName"
                  :label="column.columnName"
                  :value="column.jsonField"
                >
                  <span style="float: left">{{ column.jsonField }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ column.columnComment }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="genInfo">
        <GenInfoForm ref="genForm" v-model="info" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <el-form-item style="text-align: center;margin-left:-100px;margin-top:10px;">
        <el-button @click="close()">返回</el-button>
        <el-button type="primary" :loading="saving" @click="submit()">提交</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import FieldLabel from '@/components/FieldLabel/index.vue'
import BasicInfoForm from './basicInfoForm.vue'
import GenInfoForm from './genInfoForm.vue'
import { useTagsViewStore } from '@/stores/tagsView'
import { msgSuccess, msgError } from '@/utils/message'

import { getGenTable, updateGenTable, getTableTree } from '@/api/tools/gen'
import { optionselect as getDictOptionselect } from '@/api/admin/dict/type'
import type { GenTable } from '@/api/tools/gen'
import type { SysDictType } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'EditTable' })

const route = useRoute()
const router = useRouter()

const activeName = ref('cloum')
const columns = ref<GenTable[]>([])
const tableTree = ref<GenTable[]>([])
const dictOptions = ref<SysDictType[]>([])
const saving = ref(false)

/**
 * One record shared with both tabs through v-model, rather than a prop each of
 * them copies. `info` starts as an empty object so the forms have something to
 * bind before the request lands.
 */
const info = ref<GenTable>({})

const basicForm = ref<{ validate: () => Promise<unknown> }>()
const genForm = ref<{ validate: () => Promise<unknown> }>()

/** The relation pickers offer the columns of whichever table a row points at. */
const attachForeignColumns = (row: GenTable) => {
  const target = tableTree.value.find(item => item.tableName === row.fkTableName)
  row.fkCol = target?.columns ?? [{ columnId: 0, columnName: '请选择' }]
}

const load = async() => {
  const tableId = Number(route.query.tableId)
  if (!tableId) return
  try {
    const [tree, detail, dicts] = await Promise.all([
      getTableTree(),
      getGenTable(tableId),
      getDictOptionselect()
    ])
    tableTree.value = [{ tableId: 0, className: '请选择' }, ...(tree.data ?? [])]
    columns.value = detail.data?.list ?? []
    // The three flags arrive as booleans and the radio groups work in strings
    const loaded = (detail.data?.info ?? {}) as GenTable
    info.value = {
      ...loaded,
      isDataScope: String(loaded.isDataScope ?? ''),
      isActions: String(loaded.isActions ?? ''),
      isAuth: String(loaded.isAuth ?? '')
    }
    columns.value.forEach(attachForeignColumns)
    dictOptions.value = (dicts.data ?? []) as unknown as SysDictType[]
  } catch {
    // Reported by the interceptor
  }
}

onMounted(load)

const close = () => {
  useTagsViewStore().delView(route)
  return router.push({ path: '/dev-tools/gen', query: { t: String(Date.now()) }})
}

const submit = async() => {
  if (saving.value) return
  const results = await Promise.all([basicForm.value?.validate(), genForm.value?.validate()])
  if (!results.every(Boolean)) {
    msgError('表单校验未通过，请重新检查提交内容')
    return
  }

  saving.value = true
  try {
    const payload: GenTable = {
      ...info.value,
      columns: columns.value,
      params: {
        treeCode: info.value.treeCode,
        treeName: info.value.treeName,
        treeParentCode: info.value.treeParentCode
      },
      // Back to booleans for the wire
      isDataScope: info.value.isDataScope === 'true',
      isActions: info.value.isActions === 'true',
      isAuth: info.value.isAuth === 'true'
    }
    const response = await updateGenTable(payload)
    msgSuccess(response.msg || '保存成功')
    await close()
  } catch {
    // Reported by the interceptor
  } finally {
    saving.value = false
  }
}
</script>
