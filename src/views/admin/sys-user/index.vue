<template>
  <PageContainer>
    <el-row :gutter="16">
      <!-- Department tree: clicking a node filters the list -->
      <el-col :span="4" :xs="24">
        <el-input
          v-model="deptName"
          placeholder="请输入部门名称"
          clearable
          class="dept-filter"
        />
        <el-tree
          ref="treeRef"
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
        <ProTable :table="table" selection row-key="userId">
          <template #search>
            <el-form-item label="用户名称">
              <el-input
                v-model="table.query.username"
                placeholder="请输入用户名称"
                clearable
                style="width: 160px"
              />
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input
                v-model="table.query.phone"
                placeholder="请输入手机号码"
                clearable
                style="width: 160px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="table.query.status"
                placeholder="用户状态"
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
            >新增</el-button>
            <!--
              Secondary, not filled. These act on a selection, so most of the
              time they are disabled -- and a disabled filled button is a tinted
              fill under white text: oklab(0.81) in light, which reads as a
              rendering fault rather than as "pick a row first", and oklab(0.36)
              in dark, which reads as enabled-but-muddy. A plain button greys out
              unambiguously, and it stops two bulk actions competing with 新增 for
              attention while they cannot even be used.
            -->
            <el-button
              v-permisaction="['admin:sysUser:edit']"
              :disabled="table.single"
              @click="handleEditSelected"
            >修改</el-button>
            <el-button
              v-permisaction="['admin:sysUser:remove']"
              type="danger"
              plain
              :disabled="table.multiple"
              @click="remove(table.selectedIds)"
            >删除</el-button>
          </template>

          <!--
            min-width, not width, on everything that holds text. `width` is rigid:
            the eight columns here summed to 925px inside an 841px container at a
            1280px window, so the table overflowed AND the fixed 操作 column sat on
            top of 创建时间. min-width lets el-table shrink columns to fit and hand
            any surplus back to them.
          -->
          <el-table-column label="编号" prop="userId" min-width="70" sortable="custom" />
          <el-table-column label="登录名" prop="username" min-width="100" sortable="custom" show-overflow-tooltip />
          <el-table-column label="昵称" prop="nickName" min-width="85" show-overflow-tooltip />
          <el-table-column label="部门" prop="dept.deptName" min-width="85" show-overflow-tooltip />
          <el-table-column label="手机号" prop="phone" min-width="110" />
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
          <!--
            Date only in the column, full timestamp on hover. A sortable header
            plus "2026-08-01 14:00" needs ~141px; at 1280 the six flexible
            columns have 584px between them, and spending a quarter of that on
            two digits nobody scans made the cell wrap and every row 14px taller.
          -->
          <el-table-column label="创建时间" prop="createdAt" min-width="110" sortable="custom">
            <template #default="{ row }">
              <span :title="parseTime(row.createdAt)">{{ parseTime(row.createdAt, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" class-name="row-actions">
            <template #default="{ row }">
              <el-button
                v-permisaction="['admin:sysUser:edit']"
                link
                type="primary"
                @click="userForm.openEdit(row)"
              >修改</el-button>
              <el-button
                v-if="row.userId !== 1"
                v-permisaction="['admin:sysUser:remove']"
                link
                type="danger"
                @click="remove(row.userId)"
              >删除</el-button>
              <!--
                The less-used action moves behind a menu. Three text buttons made
                this the widest column in the table, and it is pinned, so it was
                the one covering 创建时间.
              -->
              <el-dropdown v-permisaction="['admin:sysUser:resetPassword']" trigger="click">
                <el-button link type="primary" class="row-more" :title="`更多操作：${row.username}`">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleResetPwd(row)">重置密码</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
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
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="userForm.model.nickName" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select
                v-model="userForm.model.deptId"
                :data="deptOptions"
                :props="{ label: 'label', children: 'children' }"
                node-key="id"
                placeholder="请选择归属部门"
                check-strictly
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="userForm.model.phone" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.model.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户名称" prop="username">
              <el-input v-model="userForm.model.username" placeholder="请输入用户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <!-- Only on create: the edit endpoint does not take a password, and
                 el-form skips rules for items that are not rendered -->
            <el-form-item v-if="!userForm.isEdit" label="用户密码" prop="password">
              <el-input
                v-model="userForm.model.password"
                placeholder="请输入用户密码"
                type="password"
                show-password
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户性别" prop="sex">
              <el-select v-model="userForm.model.sex" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="状态" prop="status">
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
            <el-form-item label="岗位" prop="postId">
              <el-select v-model="userForm.model.postId" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="角色" prop="roleId">
              <el-select v-model="userForm.model.roleId" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="备注" prop="remark">
              <el-input v-model="userForm.model.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="userForm.close">取 消</el-button>
        <el-button type="primary" :loading="userForm.submitting" @click="userForm.submit">
          确 定
        </el-button>
      </template>
    </el-dialog>

    <!-- Password reset: a second form on the same page, with its own model,
         its own validation and its own in-flight state -->
    <el-dialog
      v-model="passwordForm.visible"
      title="重置密码"
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
        <el-form-item label="用户">
          <span>{{ passwordForm.model.username }}</span>
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.model.password"
            type="password"
            placeholder="请输入新密码"
            show-password
            @keyup.enter="passwordForm.submit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordForm.close">取 消</el-button>
        <el-button type="primary" :loading="passwordForm.submitting" @click="passwordForm.submit">
          确 定
        </el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import { useTable, useForm, useDict, useRemove } from '@/composables'
import { msgSuccess } from '@/utils/message'
import { parseTime } from '@/utils/costum'

import {
  listUser, getUser, addUser, updateUser, delUser, resetUserPwd, changeUserStatus
} from '@/api/admin/sys-user'
import { listPost } from '@/api/admin/sys-post'
import { listRole } from '@/api/admin/sys-role'
import { treeselect } from '@/api/admin/sys-dept'
import { getConfigKey } from '@/api/admin/sys-config'

import { asApi } from '@/types/api'
import type { PageResult } from '@/types/api'
import type { DeptTreeNode, SysPost, SysRole, SysUser, SysUserQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysUserManage' })

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
    asApi<DeptTreeNode[]>(treeselect()),
    asApi<PageResult<SysPost>>(listPost({ pageSize: 1000 })),
    asApi<PageResult<SysRole>>(listRole({ pageSize: 1000 })),
    asApi<{ configValue: string }>(getConfigKey('sys_user_initPassword'))
  ])
  // allSettled, not all: one failing lookup must not leave the other three
  // unset. The interceptor has already reported whichever failed.
  if (depts.status === 'fulfilled') deptOptions.value = depts.value.data ?? []
  if (posts.status === 'fulfilled') postOptions.value = posts.value.data?.list ?? []
  if (roles.status === 'fulfilled') roleOptions.value = roles.value.data?.list ?? []
  if (config.status === 'fulfilled') initPassword.value = config.value.data?.configValue ?? ''
})

// ── Create / edit ─────────────────────────────────────────────────
const userRules: FormRules = {
  username: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
  nickName: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  deptId: [{ required: true, message: '归属部门不能为空', trigger: 'change' }],
  password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: '手机号码不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

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
    status: '2',
    remark: undefined,
    postId: undefined,
    roleId: undefined
  }),
  idKey: 'userId',
  rules: userRules,
  api: { get: getUser, add: addUser, update: updateUser },
  title: { create: '添加用户', edit: '修改用户' },
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

const passwordRules: FormRules = {
  password: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6 到 20 位', trigger: 'blur' }
  ]
}

const passwordForm = useForm<PasswordModel>({
  defaultModel: () => ({ userId: undefined, username: undefined, password: '' }),
  rules: passwordRules,
  // Not a create/update pair, so it supplies its own handler. The old page used
  // ElMessageBox.prompt, which cannot validate a length or mask the input.
  submit: model => resetUserPwd(model.userId as number, model.password),
  successMessage: '密码重置成功'
})

const handleResetPwd = (row: SysUser) => {
  passwordForm.openCreate({ userId: row.userId, username: row.username })
}

// ── Row actions ───────────────────────────────────────────────────
const { remove } = useRemove({
  api: ids => delUser({ ids: ids.map(Number) }),
  confirmText: count => `确认删除选中的 ${count} 个用户？`,
  onSuccess: () => table.getList()
})

const handleStatusChange = async(row: SysUser) => {
  const enabling = row.status === '2'
  const label = enabling ? '启用' : '停用'
  const revert = () => { row.status = enabling ? '1' : '2' }

  try {
    await ElMessageBox.confirm(`确认${label}用户「${row.username}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    revert()
    return
  }

  try {
    await changeUserStatus(row)
    msgSuccess(`${label}成功`)
  } catch {
    // The switch has already moved; put it back so it matches the server
    revert()
  }
}
</script>

<style lang="scss" scoped>
.dept-filter {
  margin-bottom: 12px;
}

/* Keeps the trigger on the text baseline of the two buttons beside it */
.row-more {
  vertical-align: middle;
  margin-left: 4px;
}
</style>
