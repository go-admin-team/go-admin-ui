<template>
  <div ref="rootEl" class="pro-cards">
    <div
      v-for="(row, index) in rows"
      :key="keyOf(row, index)"
      class="pro-card"
      :class="{ 'is-open': expanded.has(index), 'is-dragging': drag.index === index }"
    >
      <!--
        Actions sit underneath and the surface slides off them, so their width
        is whatever the buttons need. Measured rather than assumed: pages put
        different numbers of buttons here, and a fixed width would leave a gap
        or clip the last one.
      -->
      <div v-if="actions" class="pro-card__actions">
        <!--
          Bound as an object so the scope matches what el-table-column hands its
          own default slot; pages destructure `{ row }` and some read `$index`,
          which cannot be written as a plain attribute name.
        -->
        <slot name="actions" v-bind="{ row, column: {}, $index: index }" />
      </div>

      <div
        class="pro-card__surface"
        :style="{ transform: `translateX(${offsetOf(index)}px)` }"
        @pointerdown="onDown($event, index)"
        @pointermove="onMove($event, index)"
        @pointerup="onUp(index)"
        @pointercancel="onUp(index)"
        @click="onClick($event, index)"
      >
        <div class="pro-card__head">
          <el-checkbox
            v-if="selection"
            class="pro-card__check"
            :model-value="selected.has(keyOf(row, index))"
            @change="toggleRow(row, index)"
            @click.stop
          />
          <div class="pro-card__ident">
            <div class="pro-card__title">
              <Cell v-if="card.title" :column="card.title" :row="row" :index="index" />
            </div>
            <div v-if="card.subtitle.length" class="pro-card__sub">
              <span v-for="(column, at) in card.subtitle" :key="column.label" class="pro-card__sub-item">
                <span v-if="at" class="pro-card__dot">·</span>
                <Cell :column="column" :row="row" :index="index" />
              </span>
            </div>
          </div>
          <div v-if="card.badge" class="pro-card__badge">
            <Cell :column="card.badge" :row="row" :index="index" />
          </div>
        </div>

        <div class="pro-card__more">
          <div>
            <div class="pro-card__fields">
              <div v-for="column in card.detail" :key="column.label" class="pro-card__field">
                <span class="pro-card__k">{{ column.label }}</span>
                <span class="pro-card__v"><Cell :column="column" :row="row" :index="index" /></span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="card.detail.length || actions" class="pro-card__foot">
          <button v-if="card.detail.length" type="button" class="pro-card__toggle">
            <el-icon class="pro-card__chev"><ArrowDown /></el-icon>
            {{ expanded.has(index) ? $t('components.cards.collapse') : $t('components.cards.more', { count: card.detail.length }) }}
          </button>
          <span v-else />
          <!--
            Shown on the first card only. The gesture is invisible until someone
            tries it, so it has to be said once; repeating it on every card
            turns a hint into wallpaper and costs a line in each of them.
          -->
          <span v-if="actions && index === 0" class="pro-card__hint">{{ $t('components.cards.swipeHint') }}</span>
        </div>
      </div>
    </div>

    <!--
      Loads the next page as it scrolls into view, and stays as a button so the
      list is still reachable without the observer -- and so someone who wants
      the next page immediately does not have to scroll for it.
    -->
    <div v-if="hasMore || loading" ref="sentinelEl" class="pro-cards__more">
      <el-button text :loading="loading" @click="emit('loadMore')">
        {{ loading ? $t('common.loading') : $t('components.cards.loadMore') }}
      </el-button>
    </div>
    <div v-else-if="showEnd && rows.length" class="pro-cards__end">{{ $t('components.cards.noMore') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick, type Slot } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { splitCard, readProp, type CardColumn } from './columns'

/**
 * The card list a ProTable turns into on a narrow screen.
 *
 * Cells are rendered by the column's own #default where it has one, so a status
 * tag, a DateCell or a permission-guarded button behaves here exactly as it does
 * in the table. Rebuilding those for mobile is how this kind of adaptation
 * usually rots: two renderers drift, and six months later the desktop shows a
 * field the phone does not.
 */
const props = defineProps<{
  rows: Record<string, unknown>[]
  columns: CardColumn[]
  rowKey?: string
  selection?: boolean
  actions?: boolean
  selected: Set<unknown>
  loading?: boolean
  hasMore?: boolean
  /** Whether the list is long enough for "no more" to tell the reader anything. */
  showEnd?: boolean
}>()

const emit = defineEmits<{ toggle: [row: Record<string, unknown>], loadMore: [] }>()

defineSlots<{ actions?: Slot }>()

/** Renders one cell: the column's own slot when it has one, else the raw value. */
const Cell = (cellProps: { column: CardColumn, row: Record<string, unknown>, index: number }) => {
  const { column, row, index } = cellProps
  if (column.render) {
    // The scope el-table-column hands its default slot. `column` is passed as an
    // empty object rather than omitted: templates commonly destructure it.
    return column.render({ row, column: {}, $index: index })
  }
  const value = readProp(row, column.prop)
  return value === null || value === undefined ? '' : String(value)
}
Cell.props = ['column', 'row', 'index']

const card = computed(() => splitCard(props.columns))
/** Falls back to the index so a table with no rowKey still renders. */
const keyOf = (row: Record<string, unknown>, index: number): PropertyKey => {
  const value = props.rowKey ? readProp(row, props.rowKey) : undefined
  return (value as PropertyKey | undefined) ?? index
}

const expanded = ref(new Set<number>())
const swiped = ref(-1)
const drag = reactive({ index: -1, startX: 0, startY: 0, base: 0, offset: 0, axis: '', moved: false })

// A re-query replaces every row, and keeping the old indices would leave a card
// open or swiped over a different record. Appending a page is not that: the
// rows already on screen are unchanged, so their state stays.
watch(() => props.rows.length, (now, before) => {
  if (before !== undefined && now > before) return
  expanded.value = new Set()
  swiped.value = -1
  drag.index = -1
})

const rootEl = ref<HTMLElement>()
const actionWidth = ref(0)
/**
 * Queried rather than collected through a template ref on the v-for: Vue 3.5
 * no longer fills an array ref from a loop, so that read came back empty and
 * every swipe clamped straight back to zero.
 */
const measure = () => {
  const strip = rootEl.value?.querySelector('.pro-card__actions')
  const width = strip?.getBoundingClientRect().width
  if (width) actionWidth.value = Math.round(width)
}
onMounted(() => nextTick(measure))
watch(() => props.rows.length, () => nextTick(measure))

/**
 * Fires when the sentinel actually reaches the viewport.
 *
 * No lead time, deliberately. A rootMargin wide enough to prefetch is also wide
 * enough to reach the sentinel before the user has scrolled at all: a first page
 * of ten cards stands about 90px past the fold, so a 600px margin loaded page
 * two on arrival, then page three, until the list ran out -- turning a paged
 * list into an eager one and firing every request the pager existed to avoid.
 *
 * The margin cannot be tuned around that, because the distance depends on how
 * tall the cards happen to be. Zero is the one value that means what it says.
 */
const sentinelEl = ref<HTMLElement>()
let observer: IntersectionObserver | undefined

const watchSentinel = () => {
  observer?.disconnect()
  const target = sentinelEl.value
  if (!target || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(entries => {
    // Guarded on loading as well as intersecting: the sentinel stays on screen
    // while the request is in flight, and would otherwise fire for every page
    // at once.
    if (entries.some(entry => entry.isIntersecting) && !props.loading && props.hasMore) {
      emit('loadMore')
    }
  }, { rootMargin: '0px' })
  observer.observe(target)
}

watch(sentinelEl, watchSentinel)
watch(() => [props.hasMore, props.loading], () => nextTick(watchSentinel))
onMounted(() => nextTick(watchSentinel))
onBeforeUnmount(() => observer?.disconnect())

const offsetOf = (index: number) => {
  if (drag.index === index && drag.axis === 'x') return drag.offset
  return swiped.value === index ? -actionWidth.value : 0
}

const AXIS_THRESHOLD = 8

function onDown(event: PointerEvent, index: number) {
  if ((event.target as HTMLElement).closest('.pro-card__actions, .el-checkbox')) return
  measure()
  drag.index = index
  drag.startX = event.clientX
  drag.startY = event.clientY
  drag.base = swiped.value === index ? -actionWidth.value : 0
  drag.offset = drag.base
  drag.axis = ''
  drag.moved = false
}

function onMove(event: PointerEvent, index: number) {
  if (drag.index !== index) return
  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY

  // Decide the axis once and stay on it, or every diagonal drag fights the
  // page for the gesture. touch-action: pan-y keeps vertical scrolling native.
  if (!drag.axis) {
    if (Math.abs(dx) < AXIS_THRESHOLD && Math.abs(dy) < AXIS_THRESHOLD) return
    drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (drag.axis === 'x') {
      // Capture keeps the gesture even if the finger leaves the card, but it
      // throws when the pointer id is not active -- which happens for
      // synthesised events and for a pointer released between two frames.
      // Losing capture degrades the swipe; letting it throw kills the drag.
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      } catch { /* not capturable; the drag still tracks via pointermove */ }
    }
  }
  if (drag.axis !== 'x') return

  drag.moved = true
  const limit = actionWidth.value
  let next = drag.base + dx
  if (next > 0) next *= 0.25
  if (next < -limit) next = -limit + (next + limit) * 0.25
  drag.offset = next
}

function onUp(index: number) {
  if (drag.index !== index) return
  // Snap by distance rather than velocity: in an admin list a slow deliberate
  // drag is the norm, and a flick-based rule makes those feel unresponsive.
  const open = drag.axis === 'x' && drag.offset < -actionWidth.value / 2
  swiped.value = open ? index : (swiped.value === index ? -1 : swiped.value)
  drag.index = -1
  drag.axis = ''
}

function onClick(event: MouseEvent, index: number) {
  // A drag is not a tap.
  if (drag.moved) {
    drag.moved = false
    event.preventDefault()
    event.stopPropagation()
    return
  }
  if ((event.target as HTMLElement).closest('.pro-card__actions, .el-checkbox')) return
  // A swiped-open card closes on the next tap instead of expanding, matching
  // what every native list does.
  if (swiped.value === index) { swiped.value = -1; return }
  if (!card.value.detail.length) return

  const next = new Set(expanded.value)
  next.has(index) ? next.delete(index) : next.add(index)
  expanded.value = next
}

function toggleRow(row: Record<string, unknown>, index: number) {
  void index
  emit('toggle', row)
}
</script>

<style lang="scss" scoped>
.pro-cards { display: flex; flex-direction: column; gap: 8px; }

.pro-cards__more { display: flex; justify-content: center; padding: 4px 0 8px; }

.pro-cards__end {
  padding: 12px 0 4px;
  font-size: 13px;
  color: var(--ga-text-4, #00000040);
  text-align: center;
}

.pro-card {
  position: relative;
  overflow: hidden;
  background: var(--ga-bg-container, #fff);
  border: 1px solid var(--ga-border, #d9d9d9);
  border-radius: 8px;
}

.pro-card__actions {
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
  align-items: stretch;

  // Element Plus buttons carry their own radius, margins and small size; the
  // swipe strip needs them square, full-height and touchable.
  :deep(.el-button) {
    height: auto;
    margin: 0 !important;
    padding: 0 20px;
    font-size: 15px;
    border: none;
    border-radius: 0;
  }
}

.pro-card__surface {
  position: relative;
  background: var(--ga-bg-container, #fff);
  touch-action: pan-y;
  transition: transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform;

  .pro-card.is-dragging & { transition: none; }
}

.pro-card__head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; }

.pro-card__check {
  flex-shrink: 0;
  height: auto;
  margin: 2px -4px 0 0;
}

.pro-card__ident { flex: 1; min-width: 0; }

.pro-card__title {
  overflow: hidden;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--ga-text-1);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pro-card__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  margin-top: 2px;
  font-size: 13px;
  color: var(--ga-text-3);
}

.pro-card__sub-item { display: inline-flex; align-items: baseline; }

.pro-card__dot { margin: 0 6px; color: var(--ga-text-4, #00000040); }

// Only the expanded rows caption their values; the subtitle reads as a phrase
// and labelling each half of it doubles the words for no gain.
.pro-card__k { color: var(--ga-text-3); }

.pro-card__badge { flex-shrink: 0; }

// grid-template-rows animates to content height without measuring it.
.pro-card__more {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.22s ease;

  // min-height: 0 as well as overflow: hidden -- a grid item defaults to
  // min-height: auto, which pushes the 0fr track back open and leaves the
  // collapsed rows at full height.
  > div { min-height: 0; overflow: hidden; }

  .pro-card.is-open & { grid-template-rows: 1fr; }
}

.pro-card__fields { padding: 0 12px 2px; }

.pro-card__field {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  font-size: 13px;
  border-top: 1px solid var(--ga-border-light, #0505050f);
}

.pro-card__v {
  // Clamped rather than left to grow. A table column truncates long text at its
  // width and nothing looks wrong; a card has no such limit, so one JSON blob
  // would push the rest of the list several screens down. Capping it here means
  // a page cannot break the layout by forgetting to mark a column hidden.
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: right;
  word-break: break-all;
}

.pro-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--ga-bg-sunken, #fafafa);
  border-top: 1px solid var(--ga-border-light, #0505050f);
}

.pro-card__toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  // 44px, per the iOS HIG minimum -- the visible text is much shorter.
  min-height: 40px;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--ga-brand, #1677ff);
  cursor: pointer;
  background: none;
  border: none;
}

.pro-card__chev {
  transition: transform 0.2s ease;

  .pro-card.is-open & { transform: rotate(180deg); }
}

.pro-card__hint {
  font-size: 12px;
  color: var(--ga-text-4, #00000040);
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .pro-card__surface,
  .pro-card__more,
  .pro-card__chev { transition: none; }
}
</style>
