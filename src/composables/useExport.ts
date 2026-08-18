import { ref } from 'vue'
import type { Ref } from 'vue'
import { ElMessageBox } from 'element-plus'

/**
 * Ask, then write the rows to an .xlsx.
 *
 * The same twenty lines -- confirm, dynamic import, column projection, download,
 * loading flag -- sit in five list pages. The xlsx writer is a heavy dependency,
 * so the import stays dynamic: it is only pulled when someone actually exports.
 *
 * The rows are supplied by the caller, which means what gets written is what the
 * page is holding: one page of results, not the whole collection. The old pages
 * did the same while their confirm text promised "所有", which is where the
 * default confirm text here differs from theirs.
 */

export interface ExportOptions<TRow> {
  /** Column headings, in order. */
  header: string[]
  /** Row fields to project, aligned with `header`. */
  fields: Array<keyof TRow & string>
  rows: TRow[]
  /** Workbook name, without the extension. */
  filename: string
  /** Confirmation body. Pass null to export without asking. */
  confirmText?: string | null
}

export interface UseExportReturn {
  exportExcel: <TRow extends Record<string, unknown>>(
    options: ExportOptions<TRow>
  ) => Promise<boolean>
  /** True while the writer is loading or running. Bind to the button's `loading`. */
  exporting: Ref<boolean>
}

export function useExport(): UseExportReturn {
  const exporting = ref(false)

  /** Guards the whole interaction, dialog included -- see useRemove. */
  let pending = false

  const exportExcel = async<TRow extends Record<string, unknown>>({
    header,
    fields,
    rows,
    filename,
    confirmText = '是否确认导出当前列表数据？'
  }: ExportOptions<TRow>): Promise<boolean> => {
    if (pending) return false
    if (!rows.length) return false

    pending = true
    try {
      if (confirmText !== null) {
        try {
          await ElMessageBox.confirm(confirmText, '提示', {
            type: 'warning',
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          })
        } catch {
          // Dismissing the confirm is a decision, not a failure
          return false
        }
      }

      exporting.value = true
      // Destructured rather than held as a namespace: reaching through the
      // module object keeps its other export alive in the chunk.
      const { export_json_to_excel } = await import('@/vendor/Export2Excel')
      export_json_to_excel({
        header,
        data: rows.map(row => fields.map(field => row[field])),
        filename,
        autoWidth: true,
        bookType: 'xlsx'
      })
      return true
    } finally {
      pending = false
      exporting.value = false
    }
  }

  return { exportExcel, exporting }
}
