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
        <el-form-item :label="$t('admin.sysDept.deptName')">
          <el-input
            v-model="table.query.deptName"
            :placeholder="$t('admin.sysDept.deptNamePlaceholder')"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysDept.status')">
          <el-select
            v-model="table.query.status"
            :placeholder="$t('admin.sysDept.statusPlaceholder')"
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
        <el-button v-permisaction="['admin:sysDept:add']" type="primary" @click="handleAdd()">
          {{ $t('common.add') }}
        </el-button>
      </template>

      <el-table-column
        prop="deptName"
        :label="$t('admin.sysDept.deptName')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column prop="sort" :label="$t('admin.sysDept.sort')" width="80" />
      <el-table-column prop="status" :label="$t('admin.sysDept.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="Number(row.status) === 1 ? 'danger' : 'success'" disable-transitions>
            {{ dictLabel(sys_normal_disable, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button
          v-permisaction="['admin:sysDept:edit']"
          link
          type="primary"
          @click="handleUpdate(row)"
        >{{ $t('common.edit') }}</el-button>
        <el-button
          v-permisaction="['admin:sysDept:add']"
          link
          type="primary"
          @click="handleAdd(row)"
        >{{ $t('common.add') }}</el-button>
        <!-- A root has no parent to fall back to, so it cannot be removed here -->
        <el-button
          v-if="row.parentId !== 0"
          v-permisaction="['admin:sysDept:remove']"
          link
          type="danger"
          @click="handleDelete(row)"
        >{{ $t('common.delete') }}</el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="form.visible"
      :title="form.isEdit ? $t('admin.sysDept.editTitle') : $t('admin.sysDept.addTitle')"
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
            <el-form-item :label="$t('admin.sysDept.parent')" prop="parentId">
              <!-- Disabled while editing: moving a department between parents is
                   not something this endpoint supports. -->
              <el-tree-select
                v-model="form.model.parentId"
                :data="parent.options"
                :props="{ label: 'deptName', children: 'children' }"
                node-key="deptId"
                :placeholder="$t('admin.sysDept.parentPlaceholder')"
                :disabled="form.isEdit"
                check-strictly
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.deptName')" prop="deptName">
              <el-input
                v-model="form.model.deptName"
                :placeholder="$t('admin.sysDept.deptNamePlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.displaySort')" prop="sort">
              <el-input-number v-model="form.model.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.leader')" prop="leader">
              <el-input
                v-model="form.model.leader"
                :placeholder="$t('admin.sysDept.leaderPlaceholder')"
                maxlength="20"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.phone')" prop="phone">
              <el-input
                v-model="form.model.phone"
                :placeholder="$t('admin.sysDept.phonePlaceholder')"
                maxlength="11"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.email')" prop="email">
              <el-input
                v-model="form.model.email"
                :placeholder="$t('admin.sysDept.emailPlaceholder')"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysDept.deptStatus')" prop="status">
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
        <el-button @click="form.close">{{ $t('common.dialogCancel') }}</el-button>
        <el-button type="primary" :loading="form.submitting" @click="form.submit">{{ $t('common.dialogConfirm') }}</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

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
  // Read once, the way useForm's rules were before they took a ref: the label
  // a reader already has on screen keeps the language the page was opened in.
  rootLabel: t('admin.sysDept.rootCategory'),
  rootId: ROOT_ID
})

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the page is set up, and the page
 * is kept alive -- so a message already rendered under a field, 部门名称不能为空,
 * would keep that language after the reader switched. useForm unwraps the ref,
 * so :rules="form.rules" is unchanged.
 */
const rules = computed<FormRules>(() => ({
  parentId: [{ required: true, message: t('admin.sysDept.rules.parentId'), trigger: 'change' }],
  deptName: [{ required: true, message: t('admin.sysDept.rules.deptName'), trigger: 'blur' }],
  sort: [{ required: true, message: t('admin.sysDept.rules.sort'), trigger: 'blur' }],
  leader: [{ required: true, message: t('admin.sysDept.rules.leader'), trigger: 'blur' }],
  email: [{ type: 'email', message: t('admin.sysDept.rules.emailFormat'), trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: t('admin.sysDept.rules.phoneFormat'), trigger: 'blur' }]
}))

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
  // No `title` option: useForm captures it once, so the dialog would keep the
  // language it was opened in. The dialog builds its own from `isEdit`.
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
  confirmText: () => t('admin.sysDept.removeConfirm'),
  onSuccess: () => {
    parent.invalidate()
    return table.getList()
  }
})

const handleDelete = (row: SysDept) => remove(row.deptId)
</script>
