<template>
  <div class="pro-table">
    <!--
      Two panels, not one. The search form changes *which* rows are on screen;
      the toolbar, table and pager act on the rows that already are. Sharing one
      surface read as a single block of controls, so the eye had to work out
      which button changed the query and which changed the data.
    -->
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

    <div class="pro-table__data">
      <div v-if="$slots.toolbar" class="pro-table__toolbar">
        <slot name="toolbar" />
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

      <!--
        Below the breakpoint the table is replaced rather than restyled. A
        table squeezed into 375px still has to be dragged sideways to read;
        62% of a typical list here sits outside the viewport. The default slot
        is still read for its column definitions -- it is simply not rendered.
      -->
      <MobileCards
        v-if="asCards"
        :rows="table.rows as unknown as Record<string, unknown>[]"
        :columns="cardColumns()"
        :row-key="rowKey"
        :selection="selection"
        :actions="!!$slots.actions"
        :selected="selectedKeys"
        @toggle="row => toggleCardRow(row as unknown as TRow)"
      >
        <template v-if="$slots.actions" #actions="scope">
          <slot name="actions" v-bind="scope" />
        </template>
      </MobileCards>

      <el-table
        v-else
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
  </div>
</template>

<script setup lang="ts" generic="TRow extends object, TQuery extends object">
import { ref, computed, watch, useSlots, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination/index.vue'
import MobileCards from './MobileCards.vue'
import { readCardColumns } from './columns'
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
  /**
   * Swap the table for a card list below `cardBreakpoint`. Turn off for tables
   * whose value is the side-by-side comparison itself -- the generator's field
   * editor is the one such page here.
   */
  card?: boolean
  /** Viewport width, in px, below which cards take over. */
  cardBreakpoint?: number
}>(), {
  card: true,
  cardBreakpoint: 768,
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
 * Cards below the breakpoint.
 *
 * matchMedia rather than a resize listener: it fires only when the answer
 * changes, so a drag across the desktop range costs nothing. Registered on
 * mount because the initial paint is server-agnostic here -- there is no SSR
 * pass whose markup this would have to match.
 */
const slots = useSlots()
const narrow = ref(false)
let query: MediaQueryList | undefined
const onQueryChange = (event: MediaQueryListEvent) => { narrow.value = event.matches }

onMounted(() => {
  query = window.matchMedia(`(max-width: ${props.cardBreakpoint - 1}px)`)
  narrow.value = query.matches
  query.addEventListener('change', onQueryChange)
})
onBeforeUnmount(() => query?.removeEventListener('change', onQueryChange))

const asCards = computed(() => props.card && narrow.value)

/**
 * Read on every render rather than memoised: a page may add or drop a column
 * with v-if, and a cached list would keep showing the old one. Reading is a
 * walk over a handful of vnodes, which is cheaper than being wrong.
 */
const cardColumns = () => readCardColumns(slots.default)

/**
 * el-table owns selection in table mode; in card mode nothing does, so this
 * holds it and reports through the same handler useTable already listens to.
 */
// `ref([]) as Ref<TRow[]>`, not `ref<TRow[]>([])`: UnwrapRefSimple rewrites
// the generic and the result stops matching TRow. useTable does the same.
const cardSelection = ref([]) as Ref<TRow[]>
const selectedKeys = computed(() => new Set(
  cardSelection.value.map(row => keyOf(row))
))

const keyOf = (row: TRow) => {
  if (!props.rowKey) return row
  return props.rowKey.split('.').reduce<unknown>(
    (value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]),
    row as unknown
  )
}

const toggleCardRow = (row: TRow) => {
  const key = keyOf(row)
  const next = cardSelection.value.filter(picked => keyOf(picked) !== key)
  if (next.length === cardSelection.value.length) next.push(row)
  cardSelection.value = next
  props.table.handleSelectionChange(next)
}

// Leaving the card view hands selection back to el-table, which starts empty;
// carrying stale rows across would leave the bulk buttons enabled for rows
// nothing is showing as ticked.
watch(asCards, () => {
  if (cardSelection.value.length) {
    cardSelection.value = []
    props.table.handleSelectionChange([])
  }
})

/**
 * Ticking a row from a click on the row: the one thing el-table's own instance
 * does that `table` cannot. Exposed by name rather than by handing out the
 * instance, so the rest of its imperative API does not become an ambient escape
 * hatch -- the same reason the generator's forms expose `validate` and not their
 * FormInstance.
 */
defineExpose({
  toggleRowSelection: (row: TRow, selected?: boolean) =>
    tableRef.value?.toggleRowSelection(row, selected)
})
</script>

<style lang="scss" scoped>
/*
 * Two surfaces: the query above, the data below.
 *
 * PageContainer supplies the card these sit in, so the panels are drawn here
 * rather than by each page -- 27 pages would otherwise each decide where the
 * seam goes. The search panel keeps the card's own background and is separated
 * by a rule instead of a gap: two floating cards on a grey page put a stripe of
 * page colour between them, which reads as a bigger break than "these filter
 * the thing below".
 */
.pro-table__search {
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--ga-border-light);
}

/*
 * The toolbar sits on the right, over the table's right edge, where the row
 * actions and the pager also are. Left-aligned it started a second column of
 * interaction on a page that already has one, and the refresh button was
 * stranded on the far side of it.
 */
.pro-table__toolbar {
  display: flex;
  align-items: center;
  /*
   * row-reverse rather than reordering the markup. Pages declare their toolbar
   * most-important-first -- add, then edit, then delete -- which is the order
   * Tab and a screen reader should follow, and the order 27 pages already
   * write. Visually the run reads toward the right edge, so the primary action
   * belongs at that end; reversing here puts it there without moving it in the
   * DOM or asking every page to rewrite its slot backwards.
   *
   * justify-content: flex-start with the row reversed packs the row against
   * the right -- the main axis now runs right to left.
   */
  flex-direction: row-reverse;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

/*
 * One step down from the page's default button. These are secondary to the
 * table -- the row is chrome above the data, not the point of the screen --
 * and at the default 32px with 14px text they carried more weight than the
 * rows they act on.
 */
.pro-table__toolbar :deep(.el-button) {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
}

.pro-table__refresh {
  flex-shrink: 0;
  /*
   * Last in the markup, which the reversed row would otherwise put at the far
   * left -- adrift from the buttons it belongs beside. A negative order pulls
   * it back to the start of the reversed line, i.e. the right-hand end of the
   * run, leaving the primary action against the table's edge and refresh just
   * inside it.
   */
  order: -1;
  /* It re-reads what is on screen rather than changing it, so it sits slightly
     apart from the actions instead of in the same run. */
  margin-left: 4px;
  /* Square: overrides the toolbar's button padding, which would stretch a
     circular icon button into a lozenge. */
  width: 28px;
  padding: 0;
}

/* el-table renders the cell, so this needs :deep to reach it. Lives with the
   component that emits the class rather than in the global stylesheet. */
.pro-table :deep(.pro-table__actions .cell) {
  white-space: nowrap;
}
</style>
