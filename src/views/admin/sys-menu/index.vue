<template>
  <PageContainer>
    <!-- /api/v1/menu answers with the whole tree; this page never had a pager -->
    <ProTable
      :table="table"
      :paginated="false"
      row-key="menuId"
      :actions-width="132"
      default-expand-all
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <template #search>
        <el-form-item :label="$t('admin.sysMenu.menuName')">
          <el-input
            v-model="table.query.title"
            :placeholder="$t('admin.sysMenu.menuNamePlaceholder')"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item :label="$t('admin.sysMenu.status')">
          <el-select
            v-model="table.query.visible"
            :placeholder="$t('admin.sysMenu.statusPlaceholder')"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in sys_show_hide"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button v-permisaction="['admin:sysMenu:add']" type="primary" @click="handleAdd()">
          {{ $t('common.add') }}
        </el-button>
      </template>

      <el-table-column
        prop="title"
        :label="$t('admin.sysMenu.menuName')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column prop="icon" :label="$t('admin.sysMenu.icon')" width="70">
        <template #default="{ row }">
          <svg-icon v-if="row.icon" :icon-class="row.icon" />
        </template>
      </el-table-column>
      <el-table-column prop="sort" :label="$t('admin.sysMenu.sort')" width="70" />
      <el-table-column
        prop="permission"
        :label="$t('admin.sysMenu.permission')"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-popover v-if="row.sysApi && row.sysApi.length" trigger="hover" placement="top" :width="520">
            <el-table :data="row.sysApi" size="small" max-height="260">
              <el-table-column prop="title" :label="$t('admin.sysMenu.api')" min-width="200">
                <template #default="{ row: api }">
                  <el-tag v-if="!api.title" type="danger" disable-transitions>{{ $t('admin.sysMenu.apiUntitled') }}</el-tag>
                  <el-tag v-else :type="api.type === 'SYS' ? 'success' : 'info'" disable-transitions>
                    [{{ api.type }}] {{ api.title }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="path" :label="$t('admin.sysMenu.path')" min-width="240">
                <template #default="{ row: api }">
                  <MethodTag :method="api.action" />
                  {{ api.path }}
                </template>
              </el-table-column>
            </el-table>
            <template #reference><span>{{ row.permission || '-' }}</span></template>
          </el-popover>
          <span v-else>{{ row.permission || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        prop="component"
        :label="$t('admin.sysMenu.componentPath')"
        min-width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ row.menuType === 'A' ? row.path : row.component }}</template>
      </el-table-column>
      <el-table-column prop="visible" :label="$t('admin.sysMenu.visible')" width="90">
        <template #default="{ row }">
          <!-- A button-level entry is never in the menu, so visibility is moot -->
          <span v-if="row.menuType === 'F'">--</span>
          <el-tag v-else :type="row.visible === '1' ? 'danger' : 'success'" disable-transitions>
            {{ dictLabel(sys_show_hide, row.visible) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <template #actions="{ row }">
        <el-button v-permisaction="['admin:sysMenu:edit']" link type="primary" @click="handleEdit(row)">
          {{ $t('common.edit') }}
        </el-button>
        <el-button v-permisaction="['admin:sysMenu:remove']" link type="danger" @click="remove(row.menuId)">
          {{ $t('common.delete') }}
        </el-button>
        <!-- Icon rather than the words, per the two-button rule: this column is
             pinned, so every pixel it takes comes out of the columns that would
             otherwise scroll past it. -->
        <el-button
          v-permisaction="['admin:sysMenu:add']"
          link
          type="primary"
          class="row-icon-action"
          :title="$t('admin.sysMenu.addUnder', { title: row.title })"
          @click="handleAdd(row)"
        >
          <el-icon><Plus /></el-icon>
        </el-button>
      </template>
    </ProTable>

    <el-dialog
      v-model="form.visible"
      :title="form.title"
      width="820px"
      :close-on-click-modal="false"
      @closed="form.reset"
    >
      <el-form
        :ref="form.bindFormRef"
        v-loading="form.loading"
        :model="form.model"
        :rules="form.rules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item :label="$t('admin.sysMenu.parent')" prop="parentId">
              <el-tree-select
                v-model="form.model.parentId"
                :data="parent.options"
                :props="{ label: 'title', children: 'children' }"
                node-key="menuId"
                :placeholder="$t('admin.sysMenu.parentPlaceholder')"
                check-strictly
                :render-after-expand="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('admin.sysMenu.menuType')" prop="menuType">
              <el-radio-group v-model="form.model.menuType">
                <el-radio value="M">{{ $t('admin.sysMenu.typeDirectory') }}</el-radio>
                <el-radio value="C">{{ $t('admin.sysMenu.typeMenu') }}</el-radio>
                <el-radio value="F">{{ $t('admin.sysMenu.typeButton') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('admin.sysMenu.title')" prop="title">
              <el-input v-model="form.model.title" :placeholder="$t('admin.sysMenu.titlePlaceholder')" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="$t('admin.sysMenu.displaySort')" prop="sort">
              <el-input-number v-model="form.model.sort" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="!isButton" :label="$t('admin.sysMenu.menuIcon')">
              <el-popover placement="bottom-start" :width="460" trigger="click">
                <IconSelect @selected="name => (form.model.icon = name)" />
                <template #reference>
                  <el-input v-model="form.model.icon" :placeholder="$t('admin.sysMenu.iconPlaceholder')" readonly>
                    <template #prefix>
                      <svg-icon v-if="form.model.icon" :icon-class="form.model.icon" />
                    </template>
                  </el-input>
                </template>
              </el-popover>
            </el-form-item>
          </el-col>

          <el-col v-if="!isButton" :span="12">
            <el-form-item prop="menuName">
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.routeName')"
                  :tip="$t('admin.sysMenu.routeNameTip')"
                />
              </template>
              <el-input
                v-model="form.model.menuName"
                :placeholder="$t('admin.sysMenu.routeNamePlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="!isButton" :span="12">
            <el-form-item prop="component">
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.componentPath')"
                  :tip="$t('admin.sysMenu.componentPathTip')"
                />
              </template>
              <el-input
                v-model="form.model.component"
                :placeholder="$t('admin.sysMenu.componentPathPlaceholder')"
              />
            </el-form-item>
          </el-col>

          <el-col v-if="!isButton" :span="12">
            <el-form-item prop="path">
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.routePath')"
                  :tip="$t('admin.sysMenu.routePathTip')"
                />
              </template>
              <el-input
                v-model="form.model.path"
                :placeholder="$t('admin.sysMenu.routePathPlaceholder')"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="!isButton" :span="12">
            <el-form-item>
              <template #label>
                <FieldLabel :label="$t('admin.sysMenu.isFrame')" :tip="$t('admin.sysMenu.isFrameTip')" />
              </template>
              <el-radio-group v-model="form.model.isFrame">
                <el-radio value="0">{{ $t('admin.sysMenu.yes') }}</el-radio>
                <el-radio value="1">{{ $t('admin.sysMenu.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col v-if="hasPermission" :span="12">
            <el-form-item>
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.permission')"
                  :tip="$t('admin.sysMenu.permissionTip')"
                />
              </template>
              <el-input
                v-model="form.model.permission"
                :placeholder="$t('admin.sysMenu.permissionPlaceholder')"
                maxlength="50"
              />
            </el-form-item>
          </el-col>
          <el-col v-if="!isButton" :span="12">
            <el-form-item>
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.menuStatus')"
                  :tip="$t('admin.sysMenu.menuStatusTip')"
                />
              </template>
              <el-radio-group v-model="form.model.visible">
                <el-radio
                  v-for="item in sys_show_hide"
                  :key="item.value"
                  :value="item.value"
                >{{ item.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col v-if="hasPermission" :span="24">
            <el-form-item>
              <template #label>
                <FieldLabel
                  :label="$t('admin.sysMenu.apiPermission')"
                  :tip="$t('admin.sysMenu.apiPermissionTip')"
                />
              </template>
              <el-transfer
                v-model="grantedApiIds"
                filterable
                :props="{ key: 'id', label: 'title' }"
                :titles="[$t('admin.sysMenu.unauthorized'), $t('admin.sysMenu.authorized')]"
                :button-texts="[$t('admin.sysMenu.revoke'), $t('admin.sysMenu.authorize')]"
                :data="apiOptions"
                class="api-transfer"
              />
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormRules } from 'element-plus'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import MethodTag from '@/components/MethodTag/index.vue'
import FieldLabel from '@/components/FieldLabel/index.vue'
import IconSelect from '@/components/IconSelect/index.vue'
import { useTable, useForm, useRemove, useDict, useTreePicker, dictLabel } from '@/composables'

import { listMenu, getMenu, addMenu, updateMenu, delMenu } from '@/api/admin/sys-menu'
import { listSysApi } from '@/api/admin/sys-api'
import type { SysApi, SysMenu, SysMenuQuery } from '@/types/admin'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'SysMenuManage' })

const { t } = useI18n()

const { sys_show_hide } = useDict('sys_show_hide')

const table = useTable<SysMenu, SysMenuQuery>({
  api: listMenu,
  idKey: 'menuId',
  paginated: false,
  defaultQuery: () => ({ title: undefined, visible: undefined })
})

const ROOT_ID = 0

/** The unfiltered tree; see useTreePicker for why it is not `table.rows`. */
const parent = useTreePicker<SysMenu>({
  api: () => listMenu({}),
  idKey: 'menuId',
  labelKey: 'title',
  rootLabel: computed(() => t('admin.sysMenu.rootCategory')),
  rootId: ROOT_ID
})

// ── The API permission transfer ───────────────────────────────────
const apiOptions = ref<SysApi[]>([])

const loadApiOptions = async() => {
  try {
    // BUS routes only: the SYS ones are infrastructure, not grantable
    const response = await listSysApi({ pageSize: 10000, type: 'BUS' })
    apiOptions.value = response.data?.list ?? []
  } catch {
    // Reported by the interceptor. Without the catch this rejects inside the
    // mounted hook with nobody attached, and the transfer silently renders
    // empty -- from which any move writes `sysApi: []` onto the model.
  }
}

onMounted(loadApiOptions)

/**
 * Rebuilt whenever the language changes.
 *
 * A plain object here is evaluated once, when the page is set up, and the page
 * is kept alive -- so a message already rendered under a field would keep the
 * language it was built in. useForm unwraps the ref, so :rules="form.rules" is
 * unchanged.
 */
const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t('admin.sysMenu.rules.title'), trigger: 'blur' }],
  sort: [{ required: true, message: t('admin.sysMenu.rules.sort'), trigger: 'blur' }]
}))

const form = useForm<SysMenu, number>({
  defaultModel: () => ({
    menuId: undefined,
    parentId: ROOT_ID,
    menuName: undefined,
    title: undefined,
    icon: undefined,
    menuType: 'M',
    component: undefined,
    path: undefined,
    permission: undefined,
    sort: 0,
    isFrame: '1',
    visible: '0',
    apis: [],
    sysApi: []
  }),
  idKey: 'menuId',
  rules,
  // Computed, not `t(...)` directly: useForm reads the option on every render,
  // so a string resolved here once would pin the dialog to the language the
  // page was opened in.
  title: {
    create: computed(() => t('admin.sysMenu.addTitle')),
    edit: computed(() => t('admin.sysMenu.editTitle'))
  },
  api: {
    get: getMenu,
    add: addMenu,
    update: model => updateMenu(model, model.menuId as number)
  },
  onSuccess: () => {
    parent.invalidate()
    return table.getList()
  }
})

/** 'F' is a button-level entry: it has no route, icon or visibility of its own. */
const isButton = computed(() => form.model.menuType === 'F')
/** Only menus and buttons carry a permission code and grant API routes. */
const hasPermission = computed(() => form.model.menuType === 'C' || form.model.menuType === 'F')

/**
 * Granted route ids, with the expanded `sysApi` list kept in step.
 *
 * The previous version maintained `sysApi` incrementally from the transfer's
 * move events, and its removal branch called `list.push()` with no argument --
 * so revoking a route emptied the list instead of shrinking it. Deriving it from
 * the ids on write makes that impossible to get wrong.
 */
const grantedApiIds = computed<number[]>({
  get: () => form.model.apis ?? [],
  set: (ids) => {
    form.model.apis = ids
    form.model.sysApi = apiOptions.value.filter(api => ids.includes(api.id as number))
  }
})

const handleAdd = (row?: SysMenu) => {
  void parent.ensure()
  form.openCreate(row ? { parentId: row.menuId } : { parentId: ROOT_ID })
}

const handleEdit = (row: SysMenu) => {
  void parent.ensure()
  return form.openEdit(row)
}

const { remove } = useRemove({
  api: delMenu,
  confirmText: () => t('admin.sysMenu.removeConfirm'),
  onSuccess: () => {
    parent.invalidate()
    return table.getList()
  }
})
</script>

<style lang="scss" scoped>

.api-transfer {
  display: inline-block;
  text-align: left;
}
</style>
