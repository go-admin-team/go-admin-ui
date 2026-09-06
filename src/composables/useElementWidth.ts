import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** clientWidth includes horizontal padding; a ResizeObserver reports the content box. */
const contentWidth = (el: HTMLElement) => {
  const style = getComputedStyle(el)
  return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
}

/**
 * How wide an element is, kept up to date as it changes.
 *
 * The companion to useNarrowScreen, which answers the other question -- how
 * wide the *viewport* is. Both are needed, and neither substitutes for the
 * other: an element that shares the page with something else is a good deal
 * narrower than the window around it (sys-user gives a fifth of the page to its
 * department tree), so a layout that sizes itself off the window puts columns
 * in room it does not have.
 *
 * ResizeObserver rather than a resize listener, because the element also
 * changes width when the window does not -- collapsing the sidebar is the
 * common one here, and it animates, so the callback must be cheap. Keep what
 * reads this behind a computed with a few thresholds: Vue skips the re-render
 * when a computed's value has not changed, so the frames within one threshold
 * cost nothing.
 */
export function useElementWidth(target: Ref<HTMLElement | undefined>): Ref<number> {
  const width = ref(0)
  let observer: ResizeObserver | undefined

  onMounted(() => {
    const el = target.value
    if (!el) return

    // Read once before observing: the observer's first callback arrives after
    // paint, so anything sized from this renders at 0 first and then jumps.
    width.value = contentWidth(el)

    observer = new ResizeObserver(([entry]) => {
      // Zero means hidden, not narrow. A list page cached by keep-alive reports
      // it the moment its tab stops being the current one, and relaying out for
      // a width nobody is looking at is undone as soon as they look again.
      // mixins/chartResize.js skips zero for the same reason.
      if (entry.contentRect.width) width.value = entry.contentRect.width
    })
    observer.observe(el)
  })

  // keep-alive deactivation does not run this, so a cached page keeps its
  // observer -- one element each, which is why it is not worth the activated /
  // deactivated pair the chart mixin needs.
  onBeforeUnmount(() => observer?.disconnect())

  return width
}
