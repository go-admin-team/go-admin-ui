<template>
  <div class="pro-table">
    <!--
      Two panels, not one. The search form changes *which* rows are on screen;
      the toolbar, table and pager act on the rows that already are. Sharing one
      surface read as a single block of controls, so the eye had to work out
      which button changed the query and which changed the data.
    -->
    <!--
      On a phone the filters are collapsed behind a button. Left open they cost
      181px -- a quarter of the screen -- before a single row is visible, and a
      list page whose first screen is a form is not a list page. The count on
      the button is what makes collapsing safe: a filter still applied while the
      panel is shut would otherwise be invisible, and an empty-looking list with
      no explanation is worse than the space the form took.
    -->
    <div v-if="asCards && $slots.search" class="pro-table__filter-bar">
      <el-button text @click="filtersOpen = !filtersOpen">
        <el-icon class="pro-table__filter-icon"><Search /></el-icon>
        筛选<template v-if="activeFilters"> · {{ activeFilters }}</template>
      </el-button>
    </div>

    <!--
      On a phone the filters live in a sheet that rises from the bottom, not in
      a panel that pushes the list down. Inline, they cost 181px before a single
      row is visible; in a sheet they cost a button, and the list stays the page.
      Rising from the bottom rather than the side puts the controls within reach
      of the thumb that opened them.
    -->
    <el-drawer
      v-if="asCards && $slots.search"
      v-model="filtersOpen"
      direction="btt"
      size="auto"
      :with-header="false"
      class="pro-table__sheet"
    >
      <div class="pro-table__sheet-grip" />
      <el-form :model="table.query" label-position="top" class="pro-table__sheet-form" @submit.prevent="submitFilters">
        <slot name="search" />
        <div class="pro-table__sheet-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" native-type="submit" :loading="table.loading">查看结果</el-button>
        </div>
      </el-form>
    </el-drawer>

    <el-form
      v-if="$slots.search && !asCards"
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
      <div v-if="$slots.toolbar && !asCards" class="pro-table__toolbar">
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
        :rows="stack as unknown as Record<string, unknown>[]"
        :columns="cardColumns()"
        :row-key="rowKey"
        :selection="selection"
        :actions="!!$slots.actions"
        :selected="selectedKeys"
        :loading="table.loading"
        :has-more="hasMore"
        :show-end="table.total > table.query.pageSize"
        @toggle="row => toggleCardRow(row as unknown as TRow)"
        @load-more="loadMore"
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
      <!--
        Page actions move to the thumb.
        A row of small buttons in the top-right corner is a pointer's layout:
        on a phone they are the furthest thing from the hand and the smallest
        target on screen. Collapsed into one floating button, which opens the
        page's own toolbar above it -- so a page contributes the same buttons to
        both layouts and states them once.
      -->
      <div v-if="asCards && $slots.toolbar" class="pro-table__fab">
        <div v-show="fabOpen" class="pro-table__fab-menu">
          <slot name="toolbar" />
          <el-button class="pro-table__fab-refresh" :loading="table.loading" @click="table.getList">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
        <button
          type="button"
          class="pro-table__fab-btn"
          :class="{ 'is-open': fabOpen }"
          :aria-expanded="fabOpen"
          aria-label="页面操作"
          @click="fabOpen = !fabOpen"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <Pagination
        v-if="paginated && !asCards"
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
import { ref, computed, watch, useSlots, type Ref } from 'vue'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import Pagination from '@/components/Pagination/index.vue'
import MobileCards from './MobileCards.vue'
import { readCardColumns } from './columns'
import { useNarrowScreen } from '@/composables/useNarrowScreen'
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

// Shared with the pages, which need the same answer -- see useNarrowScreen.
const slots = useSlots()
const narrow = useNarrowScreen(props.cardBreakpoint - 1)
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

const filtersOpen = ref(false)
const fabOpen = ref(false)

// The sheet closes on submit: on a phone the result *is* the feedback, and a
// panel left open would cover it.
const submitFilters = async() => {
  await props.table.search()
  filtersOpen.value = false
}

const resetFilters = async() => {
  await handleReset()
  filtersOpen.value = false
}

// Leaving the narrow layout with the menu open would leave it floating over a
// desktop toolbar that is visible again anyway.
watch(asCards, cards => { if (!cards) fabOpen.value = false })

/**
 * How many filters are actually applied, for the button's badge.
 *
 * Read off the query rather than the form, because a filter can be set from
 * outside it -- clicking the department tree on sys-user, or a chart
 * drill-down -- and those are exactly the ones a user would not think to look
 * for behind a collapsed panel.
 */
const PAGING_KEYS = new Set(['pageIndex', 'pageSize', 'orderBy', 'sort', 'order'])
const activeFilters = computed(() =>
  Object.entries(props.table.query as Record<string, unknown>).filter(([key, value]) => {
    if (PAGING_KEYS.has(key)) return false
    if (value === undefined || value === null || value === '') return false
    return !(Array.isArray(value) && value.length === 0)
  }).length
)

/**
 * Cards accumulate; the table paginates.
 *
 * A pager is a poor fit for a phone -- the controls alone measure 450px against
 * a 317px column, and nobody types a page number on a touch screen. So in card
 * mode each page is appended to what is already on screen and the pager is
 * replaced by a sentinel that loads the next one as it scrolls into view.
 *
 * Kept here rather than in useTable so the desktop path is untouched: useTable
 * still replaces `rows` per page, and this only stacks them for the cards.
 */
const stack = ref([]) as Ref<TRow[]>

watch(() => props.table.rows, rows => {
  if (!asCards.value) return
  // search() and resetQuery() both reset pageIndex, so page one is also the
  // signal that the list has been re-queried and the stack is stale.
  stack.value = props.table.query.pageIndex <= 1 ? [...rows] : [...stack.value, ...rows]
}, { immediate: true })

// Entering card mode mid-session starts from whatever page is loaded; leaving
// it hands the list back to the pager, which reads table.rows directly.
watch(asCards, cards => {
  if (cards) stack.value = [...props.table.rows]
})

const hasMore = computed(() => props.paginated && stack.value.length < props.table.total)

const loadMore = () => {
  if (props.table.loading || !hasMore.value) return
  return props.table.handlePagination({
    page: props.table.query.pageIndex + 1,
    limit: props.table.query.pageSize
  })
}

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
/*
 * Filters fill the width on a phone.
 *
 * Pages set an explicit width on their search controls -- `style="width: 160px"`
 * is the house style -- which is right for an inline row on a desktop and wrong
 * in a stacked column, where it leaves a ragged margin down the right. Overriding
 * inline styles needs !important; the alternative is editing that width on every
 * search field of every page.
 */
@media (max-width: 767px) {
  .pro-table__search {
    :deep(.el-form-item) {
      display: flex;
      width: 100%;
      margin-right: 0;
    }

    :deep(.el-form-item__content) { flex: 1; }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-tree-select),
    :deep(.el-date-editor) { width: 100% !important; }
  }
}

/*
 * The floating action button.
 *
 * Fixed to the viewport rather than the list, so it stays reachable while the
 * list scrolls. 56px is the Material size and comfortably past the 44px iOS
 * minimum; bottom-right is where a thumb rests on a phone held in either hand.
 */
.pro-table__fab {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.pro-table__fab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: #fff;
  cursor: pointer;
  background: var(--ga-brand, #1677ff);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
  transition: transform 0.2s ease;

  .el-icon { font-size: 24px; }

  &.is-open { transform: rotate(45deg); }
}

.pro-table__fab-menu {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 8px;
  background: var(--ga-bg-container, #fff);
  border: 1px solid var(--ga-border-light, #0505050f);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 12%);

  // The page's own buttons, restacked. Element Plus lays sibling buttons out
  // in a row with a left margin; here each one is a full-width menu entry.
  :deep(.el-button) {
    justify-content: flex-start;
    min-width: 120px;
    min-height: 40px;
    margin: 0 !important;
  }
}

.pro-table__fab-refresh { justify-content: flex-start; }

// Clears the button so it never covers the last card.
@media (max-width: 767px) {
  .pro-table__data { padding-bottom: 72px; }
}

/*
 * The filter sheet.
 *
 * label-position: top rather than left -- a left label column costs horizontal
 * room the controls need, and stacked labels are what a phone form looks like.
 */
:global(.pro-table__sheet) {
  border-radius: 16px 16px 0 0;

  .el-drawer__body { padding: 0 16px 16px; }
}

.pro-table__sheet-grip {
  width: 36px;
  height: 4px;
  margin: 8px auto 12px;
  background: var(--ga-border, #d9d9d9);
  border-radius: 2px;
}

.pro-table__sheet-form {
  :deep(.el-form-item) { margin-bottom: 14px; }

  :deep(.el-input),
  :deep(.el-select),
  :deep(.el-tree-select),
  :deep(.el-date-editor) { width: 100% !important; }
}

.pro-table__sheet-actions {
  display: flex;
  gap: 10px;
  padding-top: 4px;

  :deep(.el-button) {
    flex: 1;
    min-height: 44px;
    margin: 0;
  }
}

.pro-table__filter-bar {
  display: flex;
  justify-content: flex-start;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--ga-border-light);
}

.pro-table__filter-icon { margin-right: 4px; }

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
