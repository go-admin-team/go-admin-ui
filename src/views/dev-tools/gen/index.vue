<template>
  <PageContainer>
    <ProTable :table="table" selection row-key="tableId" :actions-width="170">
      <template #search>
        <el-form-item :label="$t('devTools.gen.tableName')">
          <el-input
            v-model="table.query.tableName"
            :placeholder="$t('devTools.gen.tableNamePlaceholder')"
            clearable
            style="width: 170px"
          />
        </el-form-item>
        <el-form-item :label="$t('devTools.gen.tableComment')">
          <el-input
            v-model="table.query.tableComment"
            :placeholder="$t('devTools.gen.tableCommentPlaceholder')"
            clearable
            style="width: 170px"
          />
        </el-form-item>
      </template>

      <template #toolbar>
        <el-button type="primary" @click="importVisible = true">{{ $t('devTools.gen.import') }}</el-button>
        <el-button
          type="danger"
          plain
          :disabled="table.multiple"
          @click="remove(table.selectedIds)"
        >{{ $t('common.delete') }}</el-button>
      </template>

      <el-table-column :label="$t('devTools.gen.tableId')" prop="tableId" width="70" />
      <el-table-column
        :label="$t('devTools.gen.tableName')"
        prop="tableName"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('devTools.gen.tableComment')"
        prop="tableComment"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column
        :label="$t('devTools.gen.className')"
        prop="className"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column :label="$t('common.createdAt')" prop="createdAt" min-width="110">
        <template #default="{ row }"><DateCell :value="row.createdAt" /></template>
      </el-table-column>

      <!--
        Six actions is four more than a pinned column can carry: at 340px it was
        the widest column in the table, and a pinned column covers its neighbours
        rather than scrolling past them. The two that get used land as buttons,
        the rest behind a menu.
      -->
      <template #actions="{ row }">
        <el-button link type="primary" @click="edit(row)">{{ $t('devTools.gen.edit') }}</el-button>
        <el-button link type="primary" @click="preview(row)">{{ $t('devTools.gen.preview') }}</el-button>
        <el-dropdown trigger="click" @command="(command: Command) => run(command, row)">
          <el-button link type="primary" class="row-icon-action" :title="$t('devTools.gen.moreActions')">
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="project">{{ $t('devTools.gen.generateToProject') }}</el-dropdown-item>
              <el-dropdown-item command="db">{{ $t('devTools.gen.generateConfig') }}</el-dropdown-item>
              <el-dropdown-item command="api">{{ $t('devTools.gen.generateMigration') }}</el-dropdown-item>
              <el-dropdown-item command="delete" divided>{{ $t('common.delete') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </ProTable>

    <!--
      v-model binds `previewOpen`. It used to bind `open`, which no data property
      ever declared, so Vue warned on every render and the dialog never appeared:
      clicking Preview fetched every template and showed none of them.
    -->
    <el-dialog
      v-model="previewOpen"
      :title="$t('devTools.gen.previewTitle')"
      fullscreen
      :close-on-click-modal="false"
    >
      <div class="gen-preview">
        <div class="gen-preview__tabs">
          <el-tag
            v-for="name in templateNames"
            :key="name"
            :type="name === activeTemplate ? 'primary' : 'info'"
            class="gen-preview__tab"
            @click="activeTemplate = name"
          >{{ shortName(name) }}</el-tag>
        </div>
        <Codemirror
          :model-value="templates[activeTemplate] ?? ''"
          :tab-size="4"
          disabled
          :style="{ height: 'calc(100vh - 210px)' }"
        />
      </div>
    </el-dialog>

    <ImportTable v-model="importVisible" @imported="table.search()" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Codemirror } from 'vue-codemirror'
import { MoreFilled } from '@element-plus/icons-vue'

import PageContainer from '@/components/PageContainer/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import DateCell from '@/components/DateCell/index.vue'
import ImportTable from './importTable.vue'
import { useTable, useRemove } from '@/composables'
import { msgSuccess } from '@/utils/message'

import {
  listTable, previewTable, delTable, toDBTable, toProjectTableCheckRole, apiToFile
} from '@/api/tools/gen'
import type { SysTables, GenTableQuery } from '@/api/tools/gen'

// Must match the menu_name the backend serves, or keep-alive silently misses
defineOptions({ name: 'Gen' })

const { t } = useI18n()
const router = useRouter()

const table = useTable<SysTables, GenTableQuery>({
  api: listTable,
  idKey: 'tableId',
  defaultQuery: () => ({ tableName: undefined, tableComment: undefined })
})

const { remove } = useRemove({
  api: delTable,
  // A function, so the sentence is built when the dialog opens rather than when
  // the page was set up -- the language may have changed in between
  confirmText: count => t('devTools.gen.deleteConfirm', { count }, count),
  onSuccess: () => table.getList()
})

const importVisible = ref(false)

const edit = (row: SysTables) =>
  router.push({ path: '/dev-tools/editTable', query: { tableId: String(row.tableId) }})

// ── Preview ───────────────────────────────────────────────────────
const previewOpen = ref(false)
const templates = ref<Record<string, string>>({})
const activeTemplate = ref('')

const templateNames = computed(() => Object.keys(templates.value))

/** `template/api.go.template` reads better as `api.go`. */
const shortName = (path: string) =>
  path.slice(path.lastIndexOf('/') + 1).replace(/\.template$/, '')

const preview = async(row: SysTables) => {
  try {
    const response = await previewTable(Number(row.tableId))
    templates.value = (response.data ?? {}) as Record<string, string>
    activeTemplate.value = templateNames.value[0] ?? ''
    previewOpen.value = true
  } catch {
    // Reported by the interceptor
  }
}

// ── The overflow menu ─────────────────────────────────────────────
type Command = 'project' | 'db' | 'api' | 'delete'

const GENERATORS = {
  // 0 means 'do not check the role table', which is what `false` meant here
  project: (id: number) => toProjectTableCheckRole(id, 0),
  db: (id: number) => toDBTable(id),
  api: (id: number) => apiToFile(id)
} as const

/** Guards the whole menu: generating twice writes the same files twice. */
let generating = false

const run = async(command: Command, row: SysTables) => {
  if (command === 'delete') {
    void remove(row.tableId as number)
    return
  }
  if (generating) return
  generating = true
  try {
    await GENERATORS[command](Number(row.tableId))
    msgSuccess(t('devTools.gen.generated'))
  } catch {
    // Reported by the interceptor
  } finally {
    generating = false
  }
}
</script>

<style lang="scss" scoped>
.gen-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gen-preview__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gen-preview__tab {
  cursor: pointer;
}
</style>
