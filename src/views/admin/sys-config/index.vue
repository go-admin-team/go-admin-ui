<template>
  <PageContainer>
    <ProTable
      :table="table"
      selection
      row-key="id"
      :actions-width="120"
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
    >
      <template #search>
        <el-form-item label="名称">
          <el-input v-model="table.query.configName" placeholder="请输入参数名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="键名">
          <el-input v-model="table.query.configKey" placeholder="请输入参数键名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="内置">
          <el-select v-model="table.query.configType" placeholder="系统内置" clearable style="width: 120px">
            <el-option
              v-for="item in sys_yes_no"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['admin:sysConfig:add']" type="primary" @click="form.openCreate()">
          新增
        </el-button>
        <el-button
          v-permisaction="['admin:sysConfig:edit']"
          :disabled="table.single"
          @click="form.openEdit(table.selection[0])"
        >修改</el-button>
        <el-button
          v-permisaction="['admin:sysConfig:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
        <el-button :loading="exporting" @click="handleExport">导出</el-button>
      </template>

      <el-table-column label="编码" prop="id" min-width="80" sortable="custom" />
      <el-table-column label="名称" prop="configName" min-width="140" sortable="custom" show-overflow-tooltip />
      <el-table-column label="键名" prop="configKey" min-width="160" sortable="custom">
        <template #default="{ row }">
          <el-popover trigger="hover" placement="top" :width="280">
            <p class="peek-line">键值：{{ row.configValue }}</p>
            <p class="peek-line">
              UI 参数：
              <el-tag v-if="row.isFrontend === '1'" type="success" disable-transitions>是</el-tag>
              <el-tag v-else disable-transitions>否</el-tag>
            </p>
            <template #reference><span class="config-key">{{ row.configKey }}</span></template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="内置" prop="configType" card-role="badge" min-width="90" sortable="custom">
        <template #default="{ row }">{{ dictLabel(sys_yes_no, row.configType) }}</template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createdAt" min-width="110" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysConfig:edit']" link type="primary" @click="form.openEdit(row)">
          修改
        </el-button>
        <el-button v-permisaction="['admin:sysConfig:remove']" link type="danger" @click="remove(row.id)">
          删除
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
        <!-- Name and key identify the setting that code looks up, so they are
             fixed once created -->
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.model.configName" placeholder="请输入参数名称" :disabled="form.isEdit" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.model.configKey" placeholder="请输入参数键名" :disabled="form.isEdit" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model="form.model.configValue" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.model.configType">
            <el-radio
              v-for="item in sys_yes_no"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="前台显示" prop="isFrontend">
          <el-select v-model="form.model.isFrontend" placeholder="是否前台显示" style="width: 100%">
            <el-option label="是" value="1" />
            <el-option label="否" value="2" />
          </el-select>
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
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'

import { listConfig, getConfig, addConfig, updateConfig, delConfig } from '@/api/admin/sys-config'
import type { SysConfig, SysConfigQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysConfigManage' })

const { sys_yes_no } = useDict('sys_yes_no')

/** Rows carry `id`, not `configId`, so that is the key throughout. */
type ConfigRow = SysConfig & { id?: number }

const table = useTable<ConfigRow, SysConfigQuery>({
  api: listConfig,
  idKey: 'id',
  defaultSort: { prop: 'createdAt', order: 'descending' },
  defaultQuery: () => ({ configName: undefined, configKey: undefined, configType: undefined })
})

const rules: FormRules = {
  configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
  configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }],
  isFrontend: [{ required: true, message: '是否前台显示不能为空', trigger: 'change' }]
}

const form = useForm<ConfigRow, number>({
  defaultModel: () => ({
    id: undefined,
    configName: undefined,
    configKey: undefined,
    configValue: undefined,
    configType: 'Y',
    isFrontend: '1',
    remark: undefined
  }),
  idKey: 'id',
  rules,
  title: { create: '添加参数', edit: '修改参数' },
  api: { get: getConfig, add: addConfig, update: updateConfig },
  onSuccess: () => table.getList()
})

const { remove } = useRemove({
  api: delConfig,
  onSuccess: () => table.getList()
})

const { exportExcel, exporting } = useExport()

const handleExport = () => exportExcel({
  header: ['参数主键', '参数名称', '参数键名', '参数键值', '备注', '创建时间'],
  // `id`, not `configId`: the rows carry the former, so the old export wrote an
  // empty first column on every line
  fields: ['id', 'configName', 'configKey', 'configValue', 'remark', 'createdAt'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: '参数设置'
})
</script>

<style lang="scss" scoped>
.config-key {
  cursor: default;
}
</style>
