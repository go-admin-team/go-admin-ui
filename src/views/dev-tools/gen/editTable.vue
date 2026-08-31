<template>
  <el-card>
    <el-tabs v-model="activeName">
      <el-tab-pane :label="$t('devTools.editTable.tabBasic')" name="basic">
        <BasicInfoForm ref="basicForm" v-model="info" />
      </el-tab-pane>
      <el-tab-pane :label="$t('devTools.editTable.tabColumns')" name="cloum">
        <el-alert
          :title="$t('devTools.editTable.hiddenColumns')"
          type="warning"
          show-icon
        />
        <el-table :data="columns" max-height="calc(100vh - 300px)" style="width: 100%">
          <el-table-column fixed :label="$t('devTools.editTable.index')" type="index" width="50" />
          <el-table-column
            fixed
            :label="$t('devTools.editTable.columnName')"
            prop="columnName"
            width="150"
            :show-overflow-tooltip="true"
          />
          <el-table-column fixed :label="$t('devTools.editTable.columnComment')" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.columnComment" />
            </template>
          </el-table-column>
          <el-table-column
            :label="$t('devTools.editTable.columnType')"
            prop="columnType"
            width="120"
            :show-overflow-tooltip="true"
          />
          <el-table-column :label="$t('devTools.editTable.goType')" width="120">
            <template #default="scope">
              <el-select v-model="scope.row.goType">
                <el-option label="int64" value="int64" />
                <el-option label="string" value="string" />
                <!-- <el-option label="int" value="int" />
                <el-option label="bool" value="bool" /> -->
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.goField')" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.goField" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.jsonField')" width="150">
            <template #default="scope">
              <el-input v-model="scope.row.jsonField" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('devTools.editTable.isInsert')" width="50">
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
          <el-table-column :label="$t('devTools.editTable.isList')" width="80" align="center">
            <template #header>
              <FieldLabel
                :label="$t('devTools.editTable.isList')"
                :tip="$t('devTools.editTable.isListTip')"
              />
            </template>
            <template #default="scope">
              <el-checkbox v-model="scope.row.isList" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.isQuery')" width="80" align="center">
            <template #header>
              <FieldLabel
                :label="$t('devTools.editTable.isQuery')"
                :tip="$t('devTools.editTable.isQueryTip')"
              />
            </template>
            <template #default="scope">
              <el-checkbox v-model="scope.row.isQuery" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.queryType')" width="120">
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
          <el-table-column :label="$t('devTools.editTable.isRequired')" width="50">
            <template #default="scope">
              <el-checkbox v-model="scope.row.isRequired" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.htmlType')" width="140">
            <template #default="scope">
              <el-select v-model="scope.row.htmlType">
                <el-option :label="$t('devTools.editTable.htmlTypes.input')" value="input" />
                <el-option :label="$t('devTools.editTable.htmlTypes.select')" value="select" />
                <el-option :label="$t('devTools.editTable.htmlTypes.radio')" value="radio" />
                <!-- <el-option label="文件选择" value="file" /> -->
                <!-- <el-option label="复选框" value="checkbox" />
                <el-option label="日期控件" value="datetime" />-->
                <el-option :label="$t('devTools.editTable.htmlTypes.textarea')" value="textarea" />

              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.dictType')" width="160">
            <template #default="scope">
              <el-select
                v-model="scope.row.dictType"
                clearable
                filterable
                :placeholder="$t('devTools.editTable.selectPlaceholder')"
              >
                <el-option
                  v-for="dict in dictOptions"
                  :key="dict.dictType"
                  :label="dictTypeName(dict)"
                  :value="dict.dictType"
                >
                  <span style="float: left">{{ dictTypeName(dict) }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ dict.dictType }}</span>
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column :label="$t('devTools.editTable.fkTableName')" width="160">
            <template #default="scope">
              <el-select
                v-model="scope.row.fkTableName"
                clearable
                filterable
                :placeholder="$t('devTools.editTable.selectPlaceholder')"
                @change="attachForeignColumns(scope.row)"
              >
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
          <el-table-column :label="$t('devTools.editTable.fkLabelId')" width="150">
            <template #default="scope">
              <el-select
                v-model="scope.row.fkLabelId"
                clearable
                filterable
                :placeholder="$t('devTools.editTable.selectPlaceholder')"
              >
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
          <el-table-column :label="$t('devTools.editTable.fkLabelName')" width="150">
            <template #default="scope">
              <el-select
                v-model="scope.row.fkLabelName"
                clearable
                filterable
                :placeholder="$t('devTools.editTable.selectPlaceholder')"
              >
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
      <el-tab-pane :label="$t('devTools.editTable.tabGen')" name="genInfo">
        <GenInfoForm ref="genForm" v-model="info" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <el-form-item style="text-align: center;margin-left:-100px;margin-top:10px;">
        <el-button @click="close()">{{ $t('devTools.editTable.back') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submit()">
          {{ $t('devTools.editTable.submit') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import FieldLabel from '@/components/FieldLabel/index.vue'
import BasicInfoForm from './basicInfoForm.vue'
import GenInfoForm from './genInfoForm.vue'
import { translateDictTypeName } from '@/lang/backend'
import { useTagsViewStore } from '@/stores/tagsView'
import { msgSuccess, msgError } from '@/utils/message'

import { getGenTable, updateGenTable, getTableTree } from '@/api/tools/gen'
import { optionselect as getDictOptionselect } from '@/api/admin/dict/type'
import type { GenTable } from '@/api/tools/gen'
import type { SysDictType } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'EditTable' })

const { t } = useI18n()
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

/**
 * The dictionary picker's option text.
 *
 * These names come from the database, so they arrive in Chinese whatever the
 * interface language is -- but the seeded ones have a translation keyed by
 * dict_type, which is what lang/backend.ts looks up. A dictionary the operator
 * created has none and falls back to its stored name, which is also what zh-CN
 * always gets: that language ships no dict.ts on purpose.
 */
const dictTypeName = (dict: SysDictType) => translateDictTypeName(dict.dictType, dict.dictName)

/**
 * The relation pickers offer the columns of whichever table a row points at.
 *
 * Empty rather than a placeholder row: the two el-options below bind
 * `:value="column.jsonField"`, which that row does not carry, so it rendered an
 * option whose value was undefined and Element Plus warned on every one of them.
 * el-select shows its own placeholder when it has no options.
 */
const attachForeignColumns = (row: GenTable) => {
  const target = tableTree.value.find(item => item.tableName === row.fkTableName)
  row.fkCol = target?.columns ?? []
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
    // No placeholder row: el-select already has a placeholder, and this one
    // carried `className` while the option below binds `tableName` -- so every
    // render rejected an undefined `value`. Same shape as the fkCol default
    // above, and the other half of the same fault.
    tableTree.value = tree.data ?? []
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
    msgError(t('devTools.editTable.validationFailed'))
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
    msgSuccess(response.msg || t('devTools.editTable.saveSuccess'))
    await close()
  } catch {
    // Reported by the interceptor
  } finally {
    saving.value = false
  }
}
</script>
