import { Comment, Fragment, Static, Text, type Slot, type VNode } from 'vue'

/**
 * How many filters a page actually put in the search slot.
 *
 * The search panel lays its fields out on a grid and collapses whatever does
 * not fit the first row, so it has to know how many there are before it can
 * decide whether collapsing applies at all -- a page with two filters should
 * not grow an expand toggle that reveals nothing.
 *
 * Counted off the vnodes rather than the DOM: the answer is needed while
 * rendering, and a querySelectorAll would be one frame behind on any page whose
 * filters appear conditionally. sys-user has exactly that -- its department
 * filter is mounted only on the phone layout.
 *
 * A field switched off with v-if leaves a comment vnode behind, which is not a
 * field and is not an element either, so it is skipped here for the same reason
 * :nth-of-type does not count it in the stylesheet. The two must agree: this
 * number decides how many fields are visible while collapsed, and the CSS is
 * what hides the rest.
 */
export function countSearchFields(slot: Slot | undefined): number {
  let count = 0

  const walk = (nodes: VNode[]) => {
    for (const node of nodes) {
      if (node.type === Comment || node.type === Text || node.type === Static) continue
      // v-for and <template> wrap their children in a fragment; the fields are
      // inside it, not the fragment itself.
      if (node.type === Fragment) {
        walk((node.children ?? []) as VNode[])
        continue
      }
      count++
    }
  }

  walk(slot?.() ?? [])
  return count
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
 * The buttons take one column of the first row, so a three-column panel keeps
 * two filters and hides the rest. The floor of one is for the narrow panel:
 * collapsing to nothing leaves a search form with no search in it.
 */
export function collapseTo(count: number, cols: number): number {
  const visible = Math.max(1, cols - 1)
  return count > visible ? visible : 0
}
