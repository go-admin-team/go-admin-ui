<template>
  <PageContainer>
    <!--
      paginated: false -- /api/v1/dept answers with the whole tree and this page
      never had a pager. useTable is told the same, so it sends no paging keys.
    -->
    <ProTable
      :table="table"
      :paginated="false"
      row-key="deptId"
      :actions-width="180"
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <template #search>
        <el-form-item label="部门名称">
          <el-input v-model="table.query.deptName" placeholder="请输入部门名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="部门状态" clearable style="width: 140px">
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
        <el-button v-permisaction="['admin:sysDept:add']" type="primary" @click="handleAdd()">
          新增
        </el-button>
      </template>

      <el-table-column prop="deptName" label="部门名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'danger' : 'success'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button
          v-permisaction="['admin:sysDept:edit']"
          link
          type="primary"
          @click="handleUpdate(row)"
        >修改</el-button>
        <el-button
          v-permisaction="['admin:sysDept:add']"
          link
          type="primary"
          @click="handleAdd(row)"
        >新增</el-button>
        <!-- A root has no parent to fall back to, so it cannot be removed here -->
        <el-button
          v-if="row.parentId !== 0"
          v-permisaction="['admin:sysDept:remove']"
          link
          type="danger"
          @click="handleDelete(row)"
        >删除</el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="form.visible"
      :title="form.title"
      width="600px"
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
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="上级部门" prop="parentId">
              <!-- Disabled while editing: moving a department between parents is
                   not something this endpoint supports. -->
              <el-tree-select
                v-model="form.model.parentId"
                :data="parent.options"
                :props="{ label: 'deptName', children: 'children' }"
                node-key="deptId"
                placeholder="选择上级部门"
                :disabled="form.isEdit"
                check-strictly
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName">
              <el-input v-model="form.model.deptName" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="sort">
              <el-input-number v-model="form.model.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="form.model.leader" placeholder="请输入负责人" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.model.phone" placeholder="请输入联系电话" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.model.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门状态" prop="status">
              <el-radio-group v-model="form.model.status">
                <el-radio
                  v-for="item in sys_normal_disable"
                  :key="item.value"
                  :value="item.value"
                >{{ item.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
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
import { STATUS_NORMAL } from '@/api/status'
import { useTable, useForm, useRemove, useDict, useTreePicker, dictLabel } from '@/composables'

import { getDeptList, getDeptForForm, addDept, updateDept, delDept } from '@/api/admin/sys-dept'
import type { SysDept, SysDeptQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysDeptManage' })

const { sys_normal_disable } = useDict('sys_normal_disable')

const table = useTable<SysDept, SysDeptQuery>({
  api: getDeptList,
  idKey: 'deptId',
  paginated: false,
  defaultQuery: () => ({ deptName: undefined, status: undefined })
})

const ROOT_ID = 0

/** The unfiltered tree; see useTreePicker for why it is not `table.rows`. */
const parent = useTreePicker<SysDept>({
  api: () => getDeptList(),
  idKey: 'deptId',
  labelKey: 'deptName',
  rootLabel: '主类目',
  rootId: ROOT_ID
})

const rules: FormRules = {
  parentId: [{ required: true, message: '上级部门不能为空', trigger: 'change' }],
  deptName: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  leader: [{ required: true, message: '负责人不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
}

const form = useForm<SysDept, number>({
  defaultModel: () => ({
    deptId: undefined,
    parentId: undefined,
    deptName: undefined,
    sort: 10,
    leader: undefined,
    phone: undefined,
    email: undefined,
    status: STATUS_NORMAL
  }),
  idKey: 'deptId',
  rules,
  title: { create: '添加部门', edit: '修改部门' },
  api: {
    get: getDeptForForm,
    add: addDept,
    update: model => updateDept(model, model.deptId as number)
  },
  onSuccess: () => {
    parent.invalidate()
    return table.getList()
  }
})

/** Adding under a row pre-selects it as the parent. */
const handleAdd = (row?: SysDept) => {
  void parent.ensure()
  form.openCreate(row ? { parentId: row.deptId } : { parentId: ROOT_ID })
}

const handleUpdate = (row: SysDept) => {
  void parent.ensure()
  return form.openEdit(row)
}

const { remove } = useRemove({
  api: delDept,
  confirmText: () => '确认删除该部门？其下级部门也会一并删除。',
  onSuccess: () => {
    parent.invalidate()
    return table.getList()
  }
})

const handleDelete = (row: SysDept) => remove(row.deptId)
</script>
