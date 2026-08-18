/**
 * The xlsx writer, which is plain JavaScript.
 *
 * `header`, `data` and `filename` carry no defaults in the implementation, so
 * TypeScript infers them away and an object literal naming them fails to match.
 * This declares the parameter as the function actually reads it.
 */
export function export_json_to_excel(options: {
  /** Extra heading rows above `header`. */
  multiHeader?: string[][]
  header: string[]
  /** One array per row, aligned with `header`. */
  data: unknown[][]
  /** Workbook name, without the extension. */
  filename?: string
  merges?: string[]
  autoWidth?: boolean
  bookType?: string
}): void
