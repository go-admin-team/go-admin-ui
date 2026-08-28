import type { Slot, VNode } from 'vue'

/** Where a column goes once the table becomes a list of cards. */
export type CardRole = 'title' | 'badge' | 'hidden'

export interface CardColumn {
  label: string
  prop?: string
  role?: CardRole
  /** The column's own #default, so the card renders what the table renders. */
  render?: Slot
}

/**
 * Reads the columns out of ProTable's default slot.
 *
 * Columns stay as <el-table-column> in the slot rather than moving into a
 * `columns` array -- see the component's own note for why. The card layout
 * still needs to know what the columns are, so it reads them back off the
 * vnodes instead of asking pages to declare them a second time. Declaring them
 * twice is the failure this avoids: the two lists drift, and the mobile view
 * quietly shows a column the desktop dropped months ago.
 */
export function readCardColumns(slot: Slot | undefined): CardColumn[] {
  const found: CardColumn[] = []

  const walk = (nodes: VNode[]) => {
    for (const node of nodes) {
      // v-for and <template> produce fragments whose children are the real
      // columns; a page that generates columns in a loop is otherwise invisible
      // here. (sys-user does exactly that for its dictionary columns.)
      if (Array.isArray(node.children) && !node.props) {
        walk(node.children as VNode[])
        continue
      }
      if (!node.props) continue

      // Selection and index columns are table furniture with no value to show:
      // the card draws its own checkbox, and a row number means nothing once
      // the rows are cards.
      const type = node.props.type
      if (type === 'selection' || type === 'index' || type === 'expand') continue

      const label = node.props.label
      if (typeof label !== 'string' || !label) continue

      // Vue keeps attribute names as authored, so both spellings reach us
      // depending on how the page wrote it.
      const role = (node.props['card-role'] ?? node.props.cardRole) as CardRole | undefined
      if (role === 'hidden') continue

      const children = node.children as { default?: Slot } | null
      found.push({
        label,
        prop: node.props.prop,
        role,
        render: typeof children?.default === 'function' ? children.default : undefined
      })
    }
  }

  walk(slot?.() ?? [])
  return found
}

/**
 * A column that carries a primary key rather than something worth reading.
 *
 * Nine of the fifteen list pages lead with one -- userId, roleId, postId,
 * tableId, jobId, dictCode, and three plain `id`s. A card titled "1" says
 * nothing, so the identifier steps aside and the first meaningful column takes
 * the heading. It is still shown, just among the detail fields, because the
 * number does get quoted in support conversations.
 *
 * Matched on prop first, which is a code identifier and so predictable. The
 * label check covers the one that is not (`dictCode`, labelled 编码). A page
 * whose real title happens to look like this can say so with `card-role`.
 */
const isIdentifier = (column: CardColumn) => {
  const prop = column.prop ?? ''
  if (prop === 'id' || /Id$/.test(prop)) return true
  return /^(编号|编码|序号|ID)$/i.test(column.label)
}

/**
 * Splits the columns into the parts of a card.
 *
 * Position comes from declaration order rather than a per-page annotation, so
 * fifteen pages need no changes. The one adjustment order alone cannot make is
 * skipping the leading primary key -- see isIdentifier.
 */
export function splitCard(columns: CardColumn[]) {
  const explicitTitle = columns.find(column => column.role === 'title')
  const explicitBadge = columns.find(column => column.role === 'badge')

  // Falls back to columns[0] when every column looks like an identifier, so a
  // card always has a heading of some kind.
  const title = explicitTitle ?? columns.find(column => !isIdentifier(column)) ?? columns[0]
  const badge = explicitBadge ?? guessBadge(columns, title)

  const rest = columns.filter(column => column !== title && column !== badge)
  // Identifiers sink to the end. The two subtitle slots are the only fields
  // visible without expanding, and spending one on a primary key wastes it.
  const readable = rest.filter(column => !isIdentifier(column))
  const identifiers = rest.filter(isIdentifier)

  return {
    title,
    badge,
    /** Shown while collapsed, under the title. */
    subtitle: readable.slice(0, 2),
    /** Behind the expand toggle. */
    detail: [...readable.slice(2), ...identifiers]
  }
}

/**
 * A status-ish column, promoted to the badge beside the title.
 *
 * Only columns that render something of their own qualify: a status is drawn
 * as a tag or a switch, never as bare text. A plain text column named 状态
 * would read as a badge but arrive as an unstyled string, which looks broken --
 * better to leave it in the field list. Guessing wrong is cheap either way,
 * since the column still appears, just not beside the title.
 */
function guessBadge(columns: CardColumn[], title: CardColumn | undefined) {
  const NAMES = ['状态', '内置', '类型', '是否']
  return columns.find(column =>
    column !== title &&
    column.render &&
    NAMES.some(name => column.label.includes(name))
  )
}

/** Reads `a.b.c` off a row, the way el-table-column resolves a nested prop. */
export function readProp(row: Record<string, unknown>, prop?: string): unknown {
  if (!prop) return undefined
  if (!prop.includes('.')) return row[prop]
  return prop.split('.').reduce<unknown>(
    (value, key) => (value == null ? undefined : (value as Record<string, unknown>)[key]),
    row
  )
}
