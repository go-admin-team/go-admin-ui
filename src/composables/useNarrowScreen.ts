import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'

/** Width below which the UI switches to its phone layout. */
export const NARROW_MAX = 767

/**
 * Whether the viewport is phone-sized.
 *
 * matchMedia rather than a resize listener: it fires only when the answer
 * changes, so dragging a desktop window costs nothing.
 *
 * Shared so that ProTable and the pages around it agree on when the phone
 * layout applies. They must: sys-user offers a department filter that belongs
 * to one layout and a tree that belongs to the other, and if the two disagree
 * both are mounted at once -- which is not merely untidy, it puts two identical
 * option lists in the document and makes "the 测试部 option" ambiguous.
 *
 * Hiding one with CSS is not enough for the same reason: display:none leaves
 * the component mounted, and its dropdown is teleported to the body regardless.
 */
export function useNarrowScreen(maxWidth = NARROW_MAX): Ref<boolean> {
  const narrow = ref(false)
  let query: MediaQueryList | undefined
  const onChange = (event: MediaQueryListEvent) => { narrow.value = event.matches }

  onMounted(() => {
    query = window.matchMedia(`(max-width: ${maxWidth}px)`)
    narrow.value = query.matches
    query.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => query?.removeEventListener('change', onChange))

  return narrow
}
