<template>
  <PageContainer>
    <el-row :gutter="16">
      <!-- Department tree: clicking a node filters the list -->
      <el-col v-if="!narrow" :span="4" :xs="24" class="dept-pane">
        <!--
          On a phone this is not a sidebar. xs=24 gives it the full width, so it
          becomes a block sitting on top of the list, and together with the
          search form it pushed the first record off the first screen. Hidden
          there; the same filter is offered inside the search panel instead, so
          the phone has one place to filter from rather than two.
        -->
        <el-input
          v-model="deptName"
          :placeholder="$t('admin.sysUser.deptNamePlaceholder')"
          clearable
          class="dept-filter"
        />
        <el-tree
          ref="treeRef"
          class="dept-tree"
          :data="deptOptions"
          :props="{ label: 'label', children: 'children' }"
          :filter-node-method="filterDept"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleDeptClick"
        />
      </el-col>

      <el-col :span="20" :xs="24">
        <ProTable :table="table" selection row-key="userId" :actions-width="140">
          <template #search>
            <el-form-item v-if="narrow" :label="$t('admin.sysUser.dept')">
              <el-tree-select
                :model-value="deptFilter"
                :data="deptOptions"
                :props="{ label: 'label', children: 'children' }"
                node-key="id"
                check-strictly
                clearable
                :placeholder="$t('admin.sysUser.deptPlaceholder')"
                style="width: 160px"
                @update:model-value="handleDeptFilter"
              />
            </el-form-item>
            <el-form-item :label="$t('admin.sysUser.username')">
              <el-input
                v-model="table.query.username"
                :placeholder="$t('admin.sysUser.usernamePlaceholder')"
                clearable
                style="width: 160px"
              />
            </el-form-item>
            <el-form-item :label="$t('admin.sysUser.phone')">
              <el-input
                v-model="table.query.phone"
                :placeholder="$t('admin.sysUser.phonePlaceholder')"
                clearable
                style="width: 160px"
              />
            </el-form-item>
            <el-form-item :label="$t('admin.sysUser.status')">
              <el-select
                v-model="table.query.status"
                :placeholder="$t('admin.sysUser.statusPlaceholder')"
                clearable
                style="width: 160px"
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
            <el-button
              v-permisaction="['admin:sysUser:add']"
              type="primary"
              @click="handleAdd"
            >{{ $t('common.add') }}</el-button>
            <!-- Plain, not filled: these act on a selection and are usually
                 disabled, and a disabled filled button reads as broken rather
                 than as "pick a row first". See AGENTS.md. -->
            <el-button
              v-permisaction="['admin:sysUser:edit']"
              :disabled="table.single"
              @click="handleEditSelected"
            >{{ $t('common.edit') }}</el-button>
            <el-button
              v-permisaction="['admin:sysUser:remove']"
              type="danger"
              plain
              :disabled="table.multiple"
              @click="remove(table.selectedIds)"
            >{{ $t('common.delete') }}</el-button>
          </template>

          <!-- min-width, not width: width is rigid and overflows the container,
               min-width lets el-table fit and redistribute. See AGENTS.md. -->
          <el-table-column :label="$t('admin.sysUser.userId')" prop="userId" min-width="70" sortable="custom" />
          <el-table-column
            :label="$t('admin.sysUser.loginName')"
            prop="username"
            min-width="100"
            sortable="custom"
            show-overflow-tooltip
          />
          <el-table-column
            :label="$t('admin.sysUser.nickNameColumn')"
            prop="nickName"
            min-width="85"
            show-overflow-tooltip
          />
          <el-table-column
            :label="$t('admin.sysUser.dept')"
            prop="dept.deptName"
            min-width="85"
            show-overflow-tooltip
          />
          <el-table-column :label="$t('admin.sysUser.phoneColumn')" prop="phone" min-width="110" />
          <el-table-column :label="$t('admin.sysUser.status')" prop="status" width="82" sortable="custom">
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
            <el-button
              v-permisaction="['admin:sysUser:edit']"
              link
              type="primary"
              @click="userForm.openEdit(row)"
            >{{ $t('common.edit') }}</el-button>
            <el-button
              v-if="row.userId !== 1"
              v-permisaction="['admin:sysUser:remove']"
              link
              type="danger"
              @click="remove(row.userId)"
            >{{ $t('common.delete') }}</el-button>
            <!-- Icon rather than the words: this column is pinned, so its width
                 comes out of the columns that scroll past it. -->
            <el-button
              v-permisaction="['admin:sysUser:resetPassword']"
              link
              type="primary"
              class="row-icon-action"
              :title="$t('admin.sysUser.resetPasswordFor', { name: row.username })"
              @click="handleResetPwd(row)"
            >
              <el-icon><Key /></el-icon>
            </el-button>
          </template>
        </ProTable>
      </el-col>
    </el-row>

    <!-- Create / edit -->
    <el-dialog
      v-model="userForm.visible"
      :title="userForm.title"
      width="640px"
      :close-on-click-modal="false"
      @closed="userForm.reset"
    >
      <el-form
        :ref="userForm.bindFormRef"
        v-loading="userForm.loading"
        :model="userForm.model"
        :rules="userForm.rules"
        label-width="88px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.nickName')" prop="nickName">
              <el-input
                v-model="userForm.model.nickName"
                :placeholder="$t('admin.sysUser.nickNamePlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.deptId')" prop="deptId">
              <el-tree-select
                v-model="userForm.model.deptId"
                :data="deptOptions"
                :props="{ label: 'label', children: 'children' }"
                node-key="id"
                :placeholder="$t('admin.sysUser.deptIdPlaceholder')"
                check-strictly
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.phone')" prop="phone">
              <el-input
                v-model="userForm.model.phone"
                :placeholder="$t('admin.sysUser.phonePlaceholder')"
                maxlength="11"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.email')" prop="email">
              <el-input
                v-model="userForm.model.email"
                :placeholder="$t('admin.sysUser.emailPlaceholder')"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.username')" prop="username">
              <el-input
                v-model="userForm.model.username"
                :placeholder="$t('admin.sysUser.usernamePlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- Only on create: the edit endpoint does not take a password, and
                 el-form skips rules for items that are not rendered -->
            <el-form-item v-if="!userForm.isEdit" :label="$t('admin.sysUser.password')" prop="password">
              <el-input
                v-model="userForm.model.password"
                :placeholder="$t('admin.sysUser.passwordPlaceholder')"
                type="password"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.sex')" prop="sex">
              <el-select
                v-model="userForm.model.sex"
                :placeholder="$t('admin.sysUser.selectPlaceholder')"
                style="width: 100%"
              >
                <el-option
                  v-for="item in sys_user_sex"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.status')" prop="status">
              <el-radio-group v-model="userForm.model.status">
                <el-radio
                  v-for="item in sys_normal_disable"
                  :key="item.value"
                  :value="item.value"
                >{{ item.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.post')" prop="postId">
              <el-select
                v-model="userForm.model.postId"
                :placeholder="$t('admin.sysUser.selectPlaceholder')"
                style="width: 100%"
              >
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status === '1'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysUser.role')" prop="roleId">
              <el-select
                v-model="userForm.model.roleId"
                :placeholder="$t('admin.sysUser.selectPlaceholder')"
                style="width: 100%"
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status === '1'"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('admin.sysUser.remark')" prop="remark">
              <el-input
                v-model="userForm.model.remark"
                type="textarea"
                :placeholder="$t('admin.sysUser.remarkPlaceholder')"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="userForm.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="userForm.submitting" @click="userForm.submit">
          {{ $t('common.dialogConfirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Password reset: a second form on the same page, with its own model,
         its own validation and its own in-flight state -->
    <el-dialog
      v-model="passwordForm.visible"
      :title="$t('admin.sysUser.resetPassword')"
      width="420px"
      :close-on-click-modal="false"
      @closed="passwordForm.reset"
    >
      <el-form
        :ref="passwordForm.bindFormRef"
        :model="passwordForm.model"
        :rules="passwordForm.rules"
        label-width="88px"
      >
        <el-form-item :label="$t('admin.sysUser.user')">
          <span>{{ passwordForm.model.username }}</span>
        </el-form-item>
        <el-form-item :label="$t('admin.sysUser.newPassword')" prop="password">
          <el-input
            v-model="passwordForm.model.password"
            type="password"
            :placeholder="$t('admin.sysUser.newPasswordPlaceholder')"
            show-password
            @keyup.enter="passwordForm.submit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordForm.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="passwordForm.submitting" @click="passwordForm.submit">
          {{ $t('common.dialogConfirm') }}
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNarrowScreen } from '@/composables/useNarrowScreen'
import { ElMessageBox } from 'element-plus'
import { Key } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import { STATUS_NORMAL } from '@/api/status'
import { useTable, useForm, useDict, useRemove } from '@/composables'
import { msgSuccess } from '@/utils/message'

import {
  listUser, getUser, addUser, updateUser, delUser, resetUserPwd, changeUserStatus
} from '@/api/admin/sys-user'
import { listPost } from '@/api/admin/sys-post'
import { listRole } from '@/api/admin/sys-role'
import { treeselect } from '@/api/admin/sys-dept'
import { getConfigKey } from '@/api/admin/sys-config'

import type { DeptTreeNode, SysPost, SysRole, SysUser, SysUserQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysUserManage' })

const { t } = useI18n()

// ── The list ──────────────────────────────────────────────────────
const table = useTable<SysUser, SysUserQuery>({
  api: listUser,
  idKey: 'userId',
  defaultQuery: () => ({
    username: undefined,
    phone: undefined,
    status: undefined,
    deptId: undefined
  })
})

const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')

// ── Department tree ───────────────────────────────────────────────
const deptName = ref('')
/**
 * Exactly one department control is mounted at a time.
 *
 * v-if rather than a media query: CSS would leave both components alive, and
 * el-tree-select teleports its dropdown to the body regardless of whether the
 * field is visible -- so the page would carry two identical option lists and
 * "the 测试部 option" would match both.
 */
const narrow = useNarrowScreen()

/**
 * The narrow layout's stand-in for the department tree.
 *
 * query.deptId is stored as `/id/` -- the format the API expects -- so it is
 * unwrapped for the select and wrapped again on the way back. Sharing the query
 * key means the two controls stay in step: picking a department on a phone and
 * then rotating to a tablet shows the tree with the same node applied.
 */
const deptFilter = computed(() => {
  const raw = table.query.deptId
  if (!raw) return undefined
  const id = Number(String(raw).replace(/\//g, ''))
  return Number.isFinite(id) ? id : undefined
})

const handleDeptFilter = (id?: number) => {
  table.query.deptId = id ? `/${id}/` : undefined
  void table.search()
}
const deptOptions = ref<DeptTreeNode[]>([])
const treeRef = ref()

const filterDept = (value: string, node: DeptTreeNode) =>
  !value || node.label.includes(value)

watch(deptName, value => treeRef.value?.filter(value))

// Keeps the highlighted node honest: the filter can also be cleared by the
// reset button, which knows nothing about the tree.
watch(() => table.query.deptId, value => {
  if (!value) treeRef.value?.setCurrentKey(null)
})

const handleDeptClick = (node: DeptTreeNode) => {
  table.query.deptId = `/${node.id}/`
  void table.search()
}

// ── Options for the form ──────────────────────────────────────────
// Fetched once on mount. The previous version reloaded both lists every time
// the dialog opened, so opening it ten times meant twenty requests for data
// that had not changed.
const postOptions = ref<SysPost[]>([])
const roleOptions = ref<SysRole[]>([])
const initPassword = ref('')

onMounted(async() => {
  const [depts, posts, roles, config] = await Promise.allSettled([
    treeselect(),
    listPost({ pageSize: 1000 }),
    listRole({ pageSize: 1000 }),
    getConfigKey('sys_user_initPassword')
  ])
  // allSettled, not all: one failing lookup must not leave the other three
  // unset. The interceptor has already reported whichever failed.
  if (depts.status === 'fulfilled') deptOptions.value = depts.value.data ?? []
  if (posts.status === 'fulfilled') postOptions.value = posts.value.data?.list ?? []
  if (roles.status === 'fulfilled') roleOptions.value = roles.value.data?.list ?? []
  if (config.status === 'fulfilled') initPassword.value = config.value.data?.configValue ?? ''
})

// ── Create / edit ─────────────────────────────────────────────────
/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the page is set up, and the page
 * is kept alive -- so a message already rendered under a field, 用户名称不能为空,
 * would keep that language after the reader switched. useForm unwraps the ref,
 * so :rules="userForm.rules" is unchanged.
 */
const userRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('admin.sysUser.rules.username'), trigger: 'blur' }],
  nickName: [{ required: true, message: t('admin.sysUser.rules.nickName'), trigger: 'blur' }],
  deptId: [{ required: true, message: t('admin.sysUser.rules.deptId'), trigger: 'change' }],
  password: [{ required: true, message: t('admin.sysUser.rules.password'), trigger: 'blur' }],
  email: [
    { required: true, message: t('admin.sysUser.rules.email'), trigger: 'blur' },
    { type: 'email', message: t('admin.sysUser.rules.emailFormat'), trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: t('admin.sysUser.rules.phone'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('admin.sysUser.rules.phoneFormat'), trigger: 'blur' }
  ]
}))

const userForm = useForm<SysUser, number>({
  defaultModel: () => ({
    userId: undefined,
    deptId: undefined,
    username: undefined,
    nickName: undefined,
    password: undefined,
    phone: undefined,
    email: undefined,
    sex: undefined,
    status: STATUS_NORMAL,
    remark: undefined,
    postId: undefined,
    roleId: undefined
  }),
  idKey: 'userId',
  rules: userRules,
  api: { get: getUser, add: addUser, update: updateUser },
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysUser.addTitle')),
    edit: computed(() => t('admin.sysUser.editTitle'))
  },
  onSuccess: () => table.getList()
})

const handleAdd = () => userForm.openCreate({ password: initPassword.value })

// Hands over the selected row rather than its id: openEdit reads the key off it
// either way, and the row is already typed as a SysUser.
const handleEditSelected = () => userForm.openEdit(table.selection[0])

// ── Password reset ────────────────────────────────────────────────
interface PasswordModel {
  userId?: number
  username?: string
  password: string
}

/** Computed for the same reason userRules is. */
const passwordRules = computed<FormRules>(() => ({
  password: [
    { required: true, message: t('admin.sysUser.rules.newPassword'), trigger: 'blur' },
    { min: 6, max: 20, message: t('admin.sysUser.rules.passwordLength'), trigger: 'blur' }
  ]
}))

const passwordForm = useForm<PasswordModel>({
  defaultModel: () => ({ userId: undefined, username: undefined, password: '' }),
  rules: passwordRules,
  // Not a create/update pair, so it supplies its own handler. The old page used
  // ElMessageBox.prompt, which cannot validate a length or mask the input.
  submit: model => resetUserPwd(model.userId as number, model.password),
  // A function rather than a string: useForm keeps whatever it is given, and a
  // string would be resolved once, at setup.
  successMessage: () => t('admin.sysUser.resetOk')
})

const handleResetPwd = (row: SysUser) => {
  passwordForm.openCreate({ userId: row.userId, username: row.username })
}

// ── Row actions ───────────────────────────────────────────────────
const { remove } = useRemove({
  api: delUser,
  // The count is both a named value and the plural choice: Chinese needs one
  // form, English needs two, and passing it twice lets each pack decide.
  confirmText: count => t('admin.sysUser.removeConfirm', { count }, count),
  onSuccess: () => table.getList()
})

const handleStatusChange = async(row: SysUser) => {
  const enabling = row.status === '2'
  const revert = () => { row.status = enabling ? '1' : '2' }

  // Two whole sentences rather than a verb spliced into one: 启用/停用 is the
  // object of the Chinese sentence but the verb of the English one.
  const question = enabling
    ? t('admin.sysUser.enableConfirm', { name: row.username })
    : t('admin.sysUser.disableConfirm', { name: row.username })

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
    await changeUserStatus(row)
    msgSuccess(enabling ? t('admin.sysUser.enableOk') : t('admin.sysUser.disableOk'))
  } catch {
    // The switch has already moved; put it back so it matches the server
    revert()
  }
}
</script>

<style lang="scss" scoped>
// The toggle exists only on the narrow layout; on a desktop the tree is a
// sidebar and needs no lid.

.dept-filter {
  margin-bottom: 12px;
}

</style>
