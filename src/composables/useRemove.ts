import { ref } from 'vue'
import type { Ref } from 'vue'
import { asReportedError } from '@/utils/request'
import type { ReportedError } from '@/utils/request'
import { ElMessageBox } from 'element-plus'
import { msgSuccess } from '@/utils/message'
import type { Id } from '@/types/api'

/**
 * Confirm, delete, reload -- the sequence every list page repeats.
 *
 * Kept out of useTable so that composable stays free of Element Plus; deleting
 * is the one list action that cannot avoid a dialog.
 *
 *   const { remove, removing } = useRemove({
 *     api: (ids: number[]) => delProduct({ ids }),
 *     onSuccess: () => table.getList()
 *   })
 *
 * The page then calls `remove(row.id)` or `remove(selectedIds)`.
 *
 * Two defects of the mixin's handleDelete are fixed rather than carried over:
 *
 *   - Cancelling is told apart from failing. The mixin ended the whole chain
 *     with `.catch(() => {})`, which was there to swallow the confirm dialog's
 *     rejection and swallowed every server error along with it.
 *   - Deletion is guarded while in flight, so a double-clicked confirm sends
 *     one DELETE.
 */

export interface UseRemoveOptions {
  /** Delete endpoint. Always receives an array, even for a single row. */
  api: (ids: Id[]) => Promise<unknown>

  /** Run after a successful delete -- typically the list's `getList`. */
  onSuccess?: (ids: Id[]) => void | Promise<void>

  /** Confirmation body. Defaults to a count. */
  confirmText?: (count: number) => string

  /** Toast after a successful delete. Pass null to stay silent. */
  successMessage?: string | null

  /**
   * Called when the delete fails. The interceptor has already shown the user a
   * message, so this is for extra handling only -- do not report it again.
   * Not called when the user simply cancels.
   */
  onError?: (error: ReportedError) => void
}

export interface UseRemoveReturn {
  /**
   * Ask, then delete. Resolves true only when the server accepted it -- false
   * when the user cancelled, when nothing was selected, or when it failed.
   */
  remove: (target: Id | Id[] | undefined) => Promise<boolean>
  /**
   * True while a delete is in flight. Bind to the button's `loading`.
   *
   * A Ref, unlike useTable's and useForm's plain-value returns: this composable
   * is meant to be destructured (`const { remove, removing } = useRemove(...)`),
   * and destructuring a reactive object snapshots its values instead of
   * tracking them. A destructured Ref is a top-level setup binding, so it
   * unwraps in templates anyway.
   */
  removing: Ref<boolean>
}

export function useRemove(options: UseRemoveOptions): UseRemoveReturn {
  const {
    api,
    onSuccess,
    confirmText = (count: number) => `确认删除选中的 ${count} 条数据？`,
    successMessage,
    onError
  } = options

  const removing = ref(false)

  /**
   * Guards the whole interaction, including the time the confirm dialog is on
   * screen. `removing` cannot do this job: it drives a button's loading state,
   * so it must only be true while the request is actually in flight -- but the
   * window that needs guarding opens the moment the trigger is clicked. Keying
   * the guard off `removing` let a double-clicked delete button queue two
   * dialogs and, once both were confirmed, send two DELETEs for the same ids.
   */
  let pending = false

  const remove = async(target: Id | Id[] | undefined): Promise<boolean> => {
    if (pending) return false

    const ids = (Array.isArray(target) ? target : [target])
      .filter((id): id is Id => id !== undefined && id !== null && id !== '')
    if (!ids.length) return false

    pending = true
    try {
      try {
        await ElMessageBox.confirm(confirmText(ids.length), '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
      } catch {
        // Dismissing the dialog is a decision, not a failure
        return false
      }

      removing.value = true
      await api(ids)
      if (successMessage !== null) msgSuccess(successMessage ?? '删除成功')
      await onSuccess?.(ids)
      return true
    } catch(error) {
      onError?.(asReportedError(error))
      return false
    } finally {
      pending = false
      removing.value = false
    }
  }

  return { remove, removing }
}
