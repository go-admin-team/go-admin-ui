import { Comment, Fragment, Static, Text, normalizeClass, type Slot, type VNode } from 'vue'

/** Columns a field marked `is-wide` asks for. */
const WIDE_SPAN = 2

/**
 * How many columns each filter in the search slot takes, in declaration order.
 *
 * The search panel lays its fields out on a grid and collapses whatever does
 * not fit the first row, so it has to know what is in that row before it can
 * decide anything -- and a field can be one column or two. Counting fields
 * rather than columns is what made collapsing pointless on sys-oper-log: its
 * datetime range is two columns wide, so "the first two fields" was already
 * more than a row could hold and the collapsed panel was as tall as the open
 * one.
 *
 * Read off the vnodes rather than the DOM: the answer is needed while
 * rendering, and a querySelectorAll would be one frame behind on any page whose
 * filters appear conditionally. sys-user has exactly that -- its department
 * filter is mounted only on the phone layout.
 *
 * A field switched off with v-if leaves a comment vnode behind, which is not a
 * field and is not an element either, so it is skipped here for the same reason
 * :nth-of-type does not count it in the stylesheet. The two must agree: the
 * length of this decides how many fields stay visible while collapsed, and the
 * CSS is what hides the rest.
 */
export function searchFieldSpans(slot: Slot | undefined): number[] {
  const spans: number[] = []

  const walk = (nodes: VNode[]) => {
    for (const node of nodes) {
      if (node.type === Comment || node.type === Text || node.type === Static) continue
      // v-for and <template> wrap their children in a fragment; the fields are
      // inside it, not the fragment itself.
      if (node.type === Fragment) {
        walk((node.children ?? []) as VNode[])
        continue
      }
      // normalizeClass because a page may write the class as a string, an
      // array or an object, and all three reach here as authored.
      const classes = normalizeClass(node.props?.class)
      spans.push(classes.split(/\s+/).includes('is-wide') ? WIDE_SPAN : 1)
    }
  }

  walk(slot?.() ?? [])
  return spans
}

/**
 * Panel widths at which one more column fits, widest first.
 *
 * These are panel widths, not window widths, so they sit below the ones a
 * window-based layout would use: a 1280px window leaves about 1050px once the
 * sidebar and the page gutter are taken off, sys-user gives its panel some
 * 850px of that, and the generator's import dialog about 770. All three should
 * lay out three columns -- at two, a collapsed panel shows a single filter,
 * which is a search bar with one thing in it.
 *
 * A single "minimum field width" would be tidier but says something the layout
 * does not mean: a three-column panel tolerates narrower columns than a
 * four-column one, because the pages that get three have shorter labels. Hence
 * a table, and hence it lives here where a test can read it.
 */
export const SEARCH_BREAKPOINTS: ReadonlyArray<readonly [number, number]> = [
  [1280, 4],
  [750, 3],
  [480, 2]
]

/** Columns the search grid gets at this panel width. */
export function colsFor(width: number): number {
  const match = SEARCH_BREAKPOINTS.find(([min]) => width >= min)
  return match ? match[1] : 1
}

/**
 * How many filters a collapsed panel shows, or 0 when it shows all of them --
 * which is also the answer to "is there anything to expand".
 *
 * Filled by column rather than by count: the buttons take the last column of
 * the first row, and whatever fits in the rest of it stays. A two-column field
 * therefore costs what it actually occupies, so collapsing always leaves one
 * row -- which is the only thing collapsing is for.
 *
 * The floor of one field is for the panel too narrow to fit even that:
 * collapsing to nothing leaves a search form with no search in it, which is
 * worse than a row that spills.
 */
export function collapseTo(spans: number[], cols: number): number {
  const budget = Math.max(1, cols - 1)
  let used = 0
  let visible = 0

  for (const span of spans) {
    // A field asking for more columns than exist gets the row it is in.
    const width = Math.min(span, cols)
    if (visible > 0 && used + width > budget) break
    used += width
    visible++
    if (used >= budget) break
  }

  return visible < spans.length ? visible : 0
}
