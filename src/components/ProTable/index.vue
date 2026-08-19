<template>
  <div class="pro-table">
    <el-form
      v-if="$slots.search"
      :model="table.query"
      inline
      label-width="auto"
      class="pro-table__search"
      @submit.prevent="table.search"
    >
      <slot name="search" />
      <el-form-item>
        <!--
          native-type="submit" makes this the form's default submit button, so
          Enter in any search field reaches @submit.prevent above and nothing
          else needs a @keyup.enter of its own. Without it the browser's implicit
          submission rule applies, which only fires when the form has exactly one
          field that blocks it -- so Enter worked on some search bars, did
          nothing on others, and double-fired on any page that added its own
          @keyup.enter to compensate.
        -->
        <el-button type="primary" native-type="submit" :loading="table.loading">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div v-if="$slots.toolbar" class="pro-table__toolbar">
      <div class="pro-table__toolbar-actions">
        <slot name="toolbar" />
      </div>
      <el-button
        class="pro-table__refresh"
        :loading="table.loading"
        circle
        title="刷新"
        @click="table.getList"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <el-table
      ref="tableRef"
      v-loading="table.loading"
      :data="table.rows"
      :row-key="rowKey"
      v-bind="$attrs"
      @selection-change="table.handleSelectionChange"
      @sort-change="table.handleSortChange"
    >
      <!--
        No reserve-selection: it makes el-table keep rows selected across a data
        change and, crucially, skip the selection-change event. After a bulk
        delete the deleted ids stayed in the selection, the bulk button stayed
        enabled, and a second click deleted ids that no longer existed.
      -->
      <el-table-column v-if="selection" type="selection" width="45" />
      <slot />
      <!--
        The pinned action column is rendered here rather than by each page, so the
        class the nowrap rule needs cannot be misspelled or forgotten. Pages that
        wrote it themselves used at least two different class conventions, none of
        them documented, and getting it wrong wraps the cell -- which changes the
        row height of the pinned column only, so the pinned rows stop lining up
        with the scrolling ones.
      -->
      <el-table-column
        v-if="$slots.actions"
        label="操作"
        fixed="right"
        :width="actionsWidth"
        class-name="pro-table__actions"
      >
        <template #default="scope">
          <slot name="actions" v-bind="scope" />
        </template>
      </el-table-column>
      <template #empty>
        <slot name="empty">
          <el-empty :image-size="80" description="暂无数据" />
        </slot>
      </template>
    </el-table>

    <!--
      `pagination` carries both the page and the size, and handlePagination
      writes both back into the query -- which flows straight back down as
      :page and :limit. Handling update:page and update:limit as well would
      only set the same values a moment earlier.
    -->
    <Pagination
      v-if="paginated"
      v-show="table.total > 0"
      :total="table.total"
      :page="table.query.pageIndex"
      :limit="table.query.pageSize"
      @pagination="table.handlePagination"
    />
  </div>
</template>

<script setup lang="ts" generic="TRow extends object, TQuery extends object">
import { ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination/index.vue'
import type { UseTableReturn } from '@/composables/useTable'

/**
 * Wiring for a list page: search form, toolbar, table and pagination, all bound
 * to one useTable result.
 *
 * Columns stay as <el-table-column> in the default slot rather than moving into
 * a `columns` array. A column config looks tidier until the first page needs a
 * switch, a tag, a nested prop or a conditional button -- then it grows render
 * functions and per-type flags, and ends up a worse version of the slot API
 * Element Plus already has. What repeats across pages is the plumbing, so only
 * the plumbing is here.
 *
 *   <ProTable :table="table" selection row-key="userId">
 *     <template #search>...el-form-items...</template>
 *     <template #toolbar>...buttons...</template>
 *     <el-table-column label="登录名" prop="username" />
 *   </ProTable>
 *
 * Attributes not listed below land on the inner el-table, so `border`,
 * `max-height`, `row-class-name` and the rest work as usual.
 */
defineOptions({ name: 'ProTable', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * The useTable result driving this table.
   *
   * The component is generic in the row and query types rather than declaring
   * them as some open Record: `UseTableReturn` is invariant in both -- among
   * other things it holds `(rows: TRow[]) => void` -- so a widened parameter
   * would reject every page that types its own rows, which is the point of
   * typing them.
   */
  table: UseTableReturn<TRow, TQuery>
  /** Render a leading selection column. */
  selection?: boolean
  /** Primary key. Also enables selection that survives paging. */
  rowKey?: string
  /**
   * Render the pager. Turn off for the endpoints that answer with the whole
   * collection -- pass `paginated: false` to useTable as well, so it stops
   * sending paging keys the endpoint does not read.
   */
  paginated?: boolean
  /**
   * Width of the action column. Two text buttons need about 120px, two plus an
   * overflow menu about 140. Keep it tight: this column is pinned, so whatever
   * it takes is taken from the columns that have to scroll past it.
   */
  actionsWidth?: number | string
}>(), {
  selection: false,
  rowKey: '',
  paginated: true,
  actionsWidth: 120
})

const tableRef = ref()

/**
 * resetQuery drops the sort key from the query, but the header keeps drawing
 * its arrow until el-table is told as well -- leaving the column marked as
 * sorted while the list is not. Clearing it lives here rather than in useTable,
 * which stays free of anything Element Plus.
 */
const handleReset = async() => {
  tableRef.value?.clearSort()
  // Not required for correctness: with reserve-selection gone, el-table clears
  // its own selection as soon as `rows` is reassigned, and emits
  // selection-change so useTable follows. This only makes the boxes untick on
  // the click rather than when the response lands -- otherwise a slow list
  // request leaves them visibly ticked while the bulk buttons are already
  // disabled. Do NOT copy this onto every data-changing path; the others are
  // handled by that reassignment.
  tableRef.value?.clearSelection()
  await props.table.resetQuery()
}

/**
 * The inner el-table, for the few things only it can do -- toggling a row's
 * checkbox from a row click, for instance. Everything routine is on `table`;
 * reach for this only when el-table's own instance API is the answer.
 */
defineExpose({ tableRef })
</script>

<style lang="scss" scoped>
.pro-table__search {
  margin-bottom: 4px;
}

.pro-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.pro-table__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pro-table__refresh {
  flex-shrink: 0;
}

/* el-table renders the cell, so this needs :deep to reach it. Lives with the
   component that emits the class rather than in the global stylesheet. */
.pro-table :deep(.pro-table__actions .cell) {
  white-space: nowrap;
}
</style>
