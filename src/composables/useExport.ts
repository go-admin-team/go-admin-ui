import { ref } from 'vue'
import type { Ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { i18n } from '@/lang'
import { buildSheet } from '@/utils/workbook'

/**
 * Ask, then write the rows to an .xlsx.
 *
 * The same twenty lines -- confirm, dynamic import, column projection, download,
 * loading flag -- sit in five list pages. The writer is a heavy dependency, so
 * the import stays dynamic: it is only pulled when someone actually exports.
 *
 * The rows are supplied by the caller, which means what gets written is what the
 * page is holding: one page of results, not the whole collection. The old pages
 * did the same while their confirm text promised "所有", which is where the
 * default confirm text here differs from theirs.
 *
 * Timestamps arrive from the API as strings and go into the sheet as text.
 * `dateFormat` covers a caller that hands over a real Date -- the format stores
 * one as a number and needs to be told how to display it, so a Date without a
 * format is an error rather than a default.
 */

const DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss'

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
    // Resolved per call, like the rest: this is a destructuring default, so it
    // runs when exportExcel does rather than when the module loaded.
    confirmText = i18n.global.t('composables.export.confirm')
  }: ExportOptions<TRow>): Promise<boolean> => {
    if (pending) return false
    if (!rows.length) return false

    pending = true
    try {
      if (confirmText !== null) {
        try {
          await ElMessageBox.confirm(confirmText, i18n.global.t('common.notice'), {
            type: 'warning',
            confirmButtonText: i18n.global.t('common.confirm'),
            cancelButtonText: i18n.global.t('common.cancel')
          })
        } catch {
          // Dismissing the confirm is a decision, not a failure
          return false
        }
      }

      exporting.value = true
      const { data, columns } = buildSheet(header, rows.map(row => fields.map(field => row[field])))

      // The browser entry, not the package root: the root offers none, and the
      // node one reaches for fs.
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      await writeXlsxFile(data, {
        sheet: 'Sheet1',
        columns,
        dateFormat: DATE_FORMAT
      }).toFile(`${filename}.xlsx`)
      return true
    } finally {
      pending = false
      exporting.value = false
    }
  }

  return { exportExcel, exporting }
}
