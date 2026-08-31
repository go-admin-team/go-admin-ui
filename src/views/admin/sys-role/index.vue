<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="roleId" :actions-width="180">
      <template #search>
        <el-form-item :label="$t('admin.sysRole.roleName')">
          <el-input
            v-model="table.query.roleName"
            :placeholder="$t('admin.sysRole.roleNamePlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.roleKey')">
          <el-input
            v-model="table.query.roleKey"
            :placeholder="$t('admin.sysRole.roleKeyPlaceholder')"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.sysRole.statusPlaceholder')"
            clearable
            style="width: 140px"
          >
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
        <el-button v-permisaction="['admin:sysRole:add']" type="primary" @click="handleAdd">{{ $t('common.add') }}</el-button>
        <el-button
          v-permisaction="['admin:sysRole:edit']"
          :disabled="table.single"
          @click="handleEdit(table.selection[0])"
        >{{ $t('common.edit') }}</el-button>
        <el-button
          v-permisaction="['admin:sysRole:remove']"
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
        <el-button :loading="exporting" @click="handleExport">{{ $t('common.export') }}</el-button>
      </template>

      <el-table-column :label="$t('admin.sysRole.roleId')" prop="roleId" min-width="80" sortable="custom" />
      <el-table-column
        :label="$t('admin.sysRole.name')"
        prop="roleName"
        min-width="120"
        sortable="custom"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('admin.sysRole.roleKey')"
        prop="roleKey"
        min-width="120"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('admin.sysRole.sort')" prop="roleSort" min-width="80" sortable="custom" />
      <el-table-column :label="$t('admin.sysRole.status')" prop="status" width="82" sortable="custom">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            active-value="2"
            inactive-value="1"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110" sortable="custom">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysRole:edit']" link type="primary" @click="handleEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysRole:update']" link type="primary" @click="handleDataScope(row)">
          {{ $t('admin.sysRole.dataScope') }}
        </el-button>
        <el-button v-permisaction="['admin:sysRole:remove']" link type="danger" @click="remove(row.roleId)">
          {{ $t('common.delete') }}
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
        <el-form-item :label="$t('admin.sysRole.roleName')" prop="roleName">
          <el-input
            v-model="roleForm.model.roleName"
            :placeholder="$t('admin.sysRole.roleNamePlaceholder')"
            :disabled="roleForm.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.roleKey')" prop="roleKey">
          <el-input
            v-model="roleForm.model.roleKey"
            :placeholder="$t('admin.sysRole.roleKeyPlaceholder')"
            :disabled="roleForm.isEdit"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.roleSort')" prop="roleSort">
          <el-input-number v-model="roleForm.model.roleSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.status')" prop="status">
          <el-radio-group v-model="roleForm.model.status">
            <el-radio
              v-for="item in sys_normal_disable"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.menuPermission')">
          <el-tree
            ref="menuTreeRef"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            :empty-text="menuEmptyText"
            class="permission-tree"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.remark')" prop="remark">
          <el-input
            v-model="roleForm.model.remark"
            type="textarea"
            :placeholder="$t('admin.sysRole.remarkPlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleForm.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="roleForm.submitting" @click="roleForm.submit">{{ $t('common.dialogConfirm') }}</el-button>
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
      :title="$t('admin.sysRole.dataScopeTitle')"
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
        <el-form-item :label="$t('admin.sysRole.roleName')">
          <el-input :model-value="scopeForm.model.roleName" disabled />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.roleKey')">
          <el-input :model-value="scopeForm.model.roleKey" disabled />
        </el-form-item>
        <el-form-item :label="$t('admin.sysRole.scope')">
          <el-select v-model="scopeForm.model.dataScope" style="width: 100%">
            <el-option
              v-for="item in dataScopes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-show="scopeForm.model.dataScope === CUSTOM_SCOPE" :label="$t('admin.sysRole.dataScope')">
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            show-checkbox
            default-expand-all
            node-key="id"
            :empty-text="$t('admin.sysRole.treeLoading')"
            class="permission-tree"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scopeForm.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="scopeForm.submitting" @click="scopeForm.submit">{{ $t('common.dialogConfirm') }}</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { STATUS_NORMAL } from '@/api/status'
import { useTable, useForm, useRemove, useDict, useExport, dictLabel } from '@/composables'
import { msgSuccess } from '@/utils/message'

import {
  listRole, getRole, addRole, updateRole, delRole, dataScope, changeRoleStatus
} from '@/api/admin/sys-role'
import { roleMenuTreeselect } from '@/api/admin/sys-menu'
import { roleDeptTreeselect } from '@/api/admin/sys-dept'
import type { DeptTreeNode, SysRole, SysRoleQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysRoleManage' })

const { t } = useI18n()

const { sys_normal_disable } = useDict('sys_normal_disable')

/** Only 自定 needs the department tree; the rest are computed server-side. */
const CUSTOM_SCOPE = '2'

// Computed, not a plain array: a plain one is built once when the page is set
// up, and keep-alive keeps that instance around, so the select would go on
// offering the language the page was first opened in -- including on screen.
const dataScopes = computed(() => [
  { value: '1', label: t('admin.sysRole.scopeOptions.all') },
  { value: CUSTOM_SCOPE, label: t('admin.sysRole.scopeOptions.custom') },
  { value: '3', label: t('admin.sysRole.scopeOptions.dept') },
  { value: '4', label: t('admin.sysRole.scopeOptions.deptAndBelow') },
  { value: '5', label: t('admin.sysRole.scopeOptions.self') }
])

const table = useTable<SysRole, SysRoleQuery>({
  api: listRole,
  idKey: 'roleId',
  defaultQuery: () => ({ roleName: undefined, roleKey: undefined, status: undefined })
})

// ── Menu tree, shared by create and edit ──────────────────────────
const menuTreeRef = ref()
const menuOptions = ref<Array<Record<string, unknown>>>([])
/**
 * Whether the role being edited is the super admin, which holds everything
 * implicitly and so has no tree to tick.
 *
 * A flag rather than the message itself: storing the text would freeze it in
 * the language it was assigned in, and this one stays on screen.
 */
const superAdminOnly = ref(false)

const menuEmptyText = computed(() =>
  superAdminOnly.value ? t('admin.sysRole.adminNeedsNoMenus') : t('admin.sysRole.treeLoading')
)

/** The full menu tree, fetched once. Role 0 means "everything on offer". */
const loadMenuTree = async() => {
  const response = await roleMenuTreeselect(0)
  menuOptions.value = (response.data?.menus ?? []) as Array<Record<string, unknown>>
}
void loadMenuTree()

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the page is set up, and the page
 * is kept alive -- so a message already rendered under a field would keep the
 * language it was built in. useForm unwraps the ref, so :rules="roleForm.rules"
 * is unchanged.
 */
const rules = computed<FormRules>(() => ({
  roleName: [{ required: true, message: t('admin.sysRole.rules.roleName'), trigger: 'blur' }],
  roleKey: [{ required: true, message: t('admin.sysRole.rules.roleKey'), trigger: 'blur' }],
  roleSort: [{ required: true, message: t('admin.sysRole.rules.roleSort'), trigger: 'blur' }]
}))

const roleForm = useForm<SysRole, number>({
  defaultModel: () => ({
    roleId: undefined,
    roleName: undefined,
    roleKey: undefined,
    roleSort: 0,
    status: STATUS_NORMAL,
    menuIds: [],
    remark: undefined
  }),
  idKey: 'roleId',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysRole.addTitle')),
    edit: computed(() => t('admin.sysRole.editTitle'))
  },
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
    superAdminOnly.value = true
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
  // A function rather than a string: useForm keeps whatever it is given, and a
  // string would be resolved once, at setup.
  successMessage: () => t('admin.sysRole.dataScopeSaved'),
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
  const revert = () => { row.status = enabling ? '1' : '2' }

  // Two whole sentences rather than a verb spliced into one: 启用/停用 is the
  // object of the Chinese sentence but the verb of the English one.
  const question = enabling
    ? t('admin.sysRole.enableConfirm', { name: row.roleName })
    : t('admin.sysRole.disableConfirm', { name: row.roleName })

  try {
    await ElMessageBox.confirm(question, t('common.notice'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    })
  } catch {
    revert()
    return
  }

  try {
    await changeRoleStatus(row.roleId as number, row.status as string)
    msgSuccess(enabling ? t('admin.sysRole.enableOk') : t('admin.sysRole.disableOk'))
  } catch {
    // The switch has already moved; put it back so it matches the server
    revert()
  }
}

const { exportExcel, exporting } = useExport()

// Built on each click rather than once, so the sheet is written in the
// language the reader is in when they ask for it.
const handleExport = () => exportExcel({
  header: [
    t('admin.sysRole.exportHeader.roleId'),
    t('admin.sysRole.exportHeader.roleName'),
    t('admin.sysRole.exportHeader.roleKey'),
    t('admin.sysRole.exportHeader.roleSort'),
    t('admin.sysRole.exportHeader.status'),
    t('admin.sysRole.exportHeader.createdAt')
  ],
  fields: ['roleId', 'roleName', 'roleKey', 'roleSort', 'status', 'createdAt'],
  // The switch in the status column reads 2 as on and 1 as off; the sheet used
  // to write those digits. See sys-oper-log for the same fix.
  rows: table.rows.map(row => ({
    ...row,
    status: dictLabel(sys_normal_disable.value, row.status)
  })) as Array<Record<string, unknown>>,
  filename: t('admin.sysRole.exportFilename')
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
