<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="roleId" :actions-width="180">
      <template #search>
        <el-form-item label="角色名称">
          <el-input v-model="table.query.roleName" placeholder="请输入角色名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input v-model="table.query.roleKey" placeholder="请输入权限字符" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="table.query.status" placeholder="角色状态" clearable style="width: 140px">
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
        <el-button v-permisaction="['admin:sysRole:add']" type="primary" @click="handleAdd">新增</el-button>
        <el-button
          v-permisaction="['admin:sysRole:edit']"
          :disabled="table.single"
          @click="handleEdit(table.selection[0])"
        >修改</el-button>
        <el-button
          v-permisaction="['admin:sysRole:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >删除</el-button>
        <el-button :loading="exporting" @click="handleExport">导出</el-button>
      </template>

      <el-table-column label="编码" prop="roleId" min-width="80" sortable="custom" />
      <el-table-column label="名称" prop="roleName" min-width="120" sortable="custom" show-overflow-tooltip />
      <el-table-column label="权限字符" prop="roleKey" min-width="120" show-overflow-tooltip />
      <el-table-column label="排序" prop="roleSort" min-width="80" sortable="custom" />
      <el-table-column label="状态" prop="status" width="82" sortable="custom">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            active-value="2"
            inactive-value="1"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createdAt" min-width="110" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysRole:edit']" link type="primary" @click="handleEdit(row)">
          修改
        </el-button>
        <el-button v-permisaction="['admin:sysRole:update']" link type="primary" @click="handleDataScope(row)">
          数据权限
        </el-button>
        <el-button v-permisaction="['admin:sysRole:remove']" link type="danger" @click="remove(row.roleId)">
          删除
        </el-button>
      </template>
    </ProTable>

    <!-- Create / edit, with the menu tree -->
    <el-dialog
      v-model="roleForm.visible"
      :title="roleForm.title"
      width="560px"
      :close-on-click-modal="false"
      @closed="roleForm.reset"
    >
      <el-form
        :ref="roleForm.bindFormRef"
        v-loading="roleForm.loading"
        :model="roleForm.model"
        :rules="roleForm.rules"
        label-width="88px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="roleForm.model.roleName" placeholder="请输入角色名称" :disabled="roleForm.isEdit" />
        </el-form-item>
        <el-form-item label="权限字符" prop="roleKey">
          <el-input v-model="roleForm.model.roleKey" placeholder="请输入权限字符" :disabled="roleForm.isEdit" />
        </el-form-item>
        <el-form-item label="角色顺序" prop="roleSort">
          <el-input-number v-model="roleForm.model.roleSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.model.status">
            <el-radio
              v-for="item in sys_normal_disable"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTreeRef"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            :empty-text="menuEmptyText"
            class="permission-tree"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="roleForm.model.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleForm.close">取 消</el-button>
        <el-button type="primary" :loading="roleForm.submitting" @click="roleForm.submit">确 定</el-button>
      </template>
    </el-dialog>

    <!--
      Data scope, with the department tree. Its own useForm, so it has its own
      visibility, model and in-flight state: the previous version gated this
      dialog on one flag while binding its visibility to the other form's, so it
      never appeared at all.
    -->
    <el-dialog
      v-model="scopeForm.visible"
      title="分配数据权限"
      width="560px"
      :close-on-click-modal="false"
      @closed="scopeForm.reset"
    >
      <el-form
        :ref="scopeForm.bindFormRef"
        v-loading="scopeForm.loading"
        :model="scopeForm.model"
        label-width="88px"
      >
        <el-form-item label="角色名称">
          <el-input :model-value="scopeForm.model.roleName" disabled />
        </el-form-item>
        <el-form-item label="权限字符">
          <el-input :model-value="scopeForm.model.roleKey" disabled />
        </el-form-item>
        <el-form-item label="权限范围">
          <el-select v-model="scopeForm.model.dataScope" style="width: 100%">
            <el-option
              v-for="item in DATA_SCOPES"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="scopeForm.model.dataScope === CUSTOM_SCOPE" label="数据权限">
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            show-checkbox
            default-expand-all
            node-key="id"
            empty-text="加载中，请稍后"
            class="permission-tree"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scopeForm.close">取 消</el-button>
        <el-button type="primary" :loading="scopeForm.submitting" @click="scopeForm.submit">确 定</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { useTable, useForm, useRemove, useDict, useExport } from '@/composables'
import { msgSuccess } from '@/utils/message'

import {
  listRole, getRole, addRole, updateRole, delRole, dataScope, changeRoleStatus
} from '@/api/admin/sys-role'
import { roleMenuTreeselect } from '@/api/admin/sys-menu'
import { roleDeptTreeselect } from '@/api/admin/sys-dept'
import type { DeptTreeNode, SysRole, SysRoleQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysRoleManage' })

const { sys_normal_disable } = useDict('sys_normal_disable')

/** Only 自定 needs the department tree; the rest are computed server-side. */
const CUSTOM_SCOPE = '2'
const DATA_SCOPES = [
  { value: '1', label: '全部数据权限' },
  { value: CUSTOM_SCOPE, label: '自定数据权限' },
  { value: '3', label: '本部门数据权限' },
  { value: '4', label: '本部门及以下数据权限' },
  { value: '5', label: '仅本人数据权限' }
]

const table = useTable<SysRole, SysRoleQuery>({
  api: listRole,
  idKey: 'roleId',
  defaultQuery: () => ({ roleName: undefined, roleKey: undefined, status: undefined })
})

// ── Menu tree, shared by create and edit ──────────────────────────
const menuTreeRef = ref()
const menuOptions = ref<Array<Record<string, unknown>>>([])
const menuEmptyText = ref('加载中，请稍后')

/** The full menu tree, fetched once. Role 0 means "everything on offer". */
const loadMenuTree = async() => {
  const response = await roleMenuTreeselect(0)
  menuOptions.value = (response.data?.menus ?? []) as Array<Record<string, unknown>>
}
void loadMenuTree()

const rules: FormRules = {
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleKey: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  roleSort: [{ required: true, message: '角色顺序不能为空', trigger: 'blur' }]
}

const roleForm = useForm<SysRole, number>({
  defaultModel: () => ({
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    roleSort: 0,
    status: '2',
    menuIds: [],
    remark: undefined
  }),
  idKey: 'roleId',
  rules,
  title: { create: '添加角色', edit: '修改角色' },
  api: {
    get: getRole,
    add: model => addRole({ ...model, menuIds: checkedMenuIds() }),
    update: model => updateRole({ ...model, menuIds: checkedMenuIds() }, model.roleId as number)
  },
  onSuccess: () => table.getList()
})

/**
 * Ids the menu tree has ticked.
 *
 * Only fully-checked nodes, which is what the previous version submitted -- it
 * read the half-checked set as well but then returned the checked one, so the
 * behaviour is preserved rather than quietly changed here.
 */
const checkedMenuIds = (): number[] => menuTreeRef.value?.getCheckedKeys() ?? []

const handleAdd = () => {
  roleForm.openCreate()
  void nextTick(() => menuTreeRef.value?.setCheckedKeys([]))
}

const handleEdit = async(row: SysRole) => {
  await roleForm.openEdit(row)
  // The super admin holds everything implicitly, so there is nothing to tick
  if (roleForm.model.roleKey === 'admin') {
    menuEmptyText.value = '系统超级管理员无需此操作'
    menuOptions.value = []
    return
  }
  await nextTick()
  menuTreeRef.value?.setCheckedKeys(roleForm.model.menuIds ?? [])
}

// ── Data scope ────────────────────────────────────────────────────
const deptTreeRef = ref()
const deptOptions = ref<DeptTreeNode[]>([])

const scopeForm = useForm<SysRole, number>({
  defaultModel: () => ({ roleId: undefined, roleName: undefined, roleKey: undefined, dataScope: '1' }),
  idKey: 'roleId',
  api: { get: getRole },
  submit: model => dataScope({ ...model, deptIds: deptTreeRef.value?.getCheckedKeys() ?? [] }),
  successMessage: '数据权限已保存',
  onSuccess: () => table.getList()
})

const handleDataScope = async(row: SysRole) => {
  await scopeForm.openEdit(row)
  const response = await roleDeptTreeselect(row.roleId as number)
  deptOptions.value = response.data?.depts ?? []
  await nextTick()
  deptTreeRef.value?.setCheckedKeys(response.data?.checkedKeys ?? [])
}

// ── Row actions ───────────────────────────────────────────────────
const { remove } = useRemove({
  api: delRole,
  onSuccess: () => table.getList()
})

const handleStatusChange = async(row: SysRole) => {
  const enabling = row.status === '2'
  const label = enabling ? '启用' : '停用'
  const revert = () => { row.status = enabling ? '1' : '2' }

  try {
    await ElMessageBox.confirm(`确认${label}角色「${row.roleName}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    revert()
    return
  }

  try {
    await changeRoleStatus(row.roleId as number, row.status as string)
    msgSuccess(`${label}成功`)
  } catch {
    // The switch has already moved; put it back so it matches the server
    revert()
  }
}

const { exportExcel, exporting } = useExport()

const handleExport = () => exportExcel({
  header: ['角色编号', '角色名称', '权限字符', '显示顺序', '状态', '创建时间'],
  fields: ['roleId', 'roleName', 'roleKey', 'roleSort', 'status', 'createdAt'],
  rows: table.rows as Array<Record<string, unknown>>,
  filename: '角色管理'
})
</script>

<style lang="scss" scoped>
.permission-tree {
  width: 100%;
  max-height: 190px;
  overflow-y: auto;
  padding: 4px 0;
  border: 1px solid var(--ga-border-light);
  border-radius: var(--ga-radius-sm);
}
</style>
