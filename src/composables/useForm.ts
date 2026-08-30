import { ref, reactive, computed, nextTick } from 'vue'
import type { MaybeRef, Ref } from 'vue'
import { asReportedError } from '@/utils/request'
import type { ReportedError } from '@/utils/request'
import type { FormInstance, FormRules } from 'element-plus'
import { msgSuccess } from '@/utils/message'
import type { ApiResponse } from '@/types/api'

/**
 * A single form: its model, its validation, and one submission at a time.
 *
 * The unit is one form, not one page. A page that edits a record, resets a
 * password and imports a file calls this three times and names each result
 * after what it does. Under mixins/crud.js all three shared one `form`, one
 * `open` and one `submitForm`, so pages needing a second form abandoned the
 * mixin and wrote everything by hand -- which is why 16 of the 17 list pages
 * do not use it.
 *
 * Two defects of the mixin are fixed rather than carried over:
 *
 *   - Submission is guarded. `submitForm` had no in-flight check, so a
 *     double-clicked confirm button sent two POSTs and created two records.
 *   - Failures reject rather than vanish. The mixin ended its delete chain with
 *     `.catch(() => {})`, which was there to swallow the confirm dialog's
 *     cancellation but swallowed every server error with it.
 */

type SubmitFn<TModel> = (model: TModel) => Promise<unknown>

export interface UseFormOptions<TModel extends object, TId = unknown> {
  /** Initial model, as a factory so each open starts from a fresh object. */
  defaultModel: () => TModel

  /**
   * Element Plus validation rules.
   *
   * Accepts a computed as well as a plain object, and translated pages need
   * one: a plain `const rules = { ... }` is evaluated once, so a message built
   * from t() keeps whichever language was current when the module loaded. The
   * page still binds :rules="form.rules" -- the ref is unwrapped on the way
   * out.
   */
  rules?: MaybeRef<FormRules>

  /**
   * Primary-key field. Its presence on the model decides whether submitting
   * creates or updates.
   */
  idKey?: keyof TModel & string

  /**
   * Endpoints for the create/update pair. `get` is used by `openEdit` to load
   * the full record, since list rows are usually a subset of the fields.
   */
  api?: {
    get?: (id: TId) => Promise<ApiResponse<TModel>>
    add?: SubmitFn<TModel>
    update?: SubmitFn<TModel>
  }

  /**
   * Submit handler, for forms that are not a create/update pair -- a password
   * reset, an import. Takes precedence over `api`.
   */
  submit?: SubmitFn<TModel>

  /** Dialog titles. */
  title?: { create?: string, edit?: string }

  /** Toast shown after a successful submit. Pass null to stay silent. */
  successMessage?: string | ((model: TModel, isEdit: boolean) => string) | null

  /** Run after a successful submit -- typically the list's `getList`. */
  onSuccess?: (model: TModel) => void | Promise<void>

  /**
   * Called when a submit fails. The interceptor has already shown the user a
   * message, so this is for extra handling only -- do not report it again.
   */
  onError?: (error: ReportedError) => void
}

/**
 * What useForm hands back. Plain values, not Refs -- the object is wrapped in
 * reactive() before it is returned, so `v-model="form.visible"` and
 * `v-model="form.model.name"` work without `.value`. See UseTableReturn for why.
 */
export interface UseFormReturn<TModel extends object, TId = unknown> {
  /**
   * Attach the el-form with `:ref="form.bindFormRef"` -- bound, so it is a real
   * expression.
   *
   * An unbound `ref="form.formRef"` looks up a setup binding named literally
   * "form.formRef", finds none, and leaves the instance unset, which makes
   * submit() skip validation with no error at all. A function ref cannot fail
   * that way, and unlike a Ref it still works when reached through this
   * reactive object (property access would unwrap the Ref and lose the identity
   * Vue needs to write into).
   */
  bindFormRef: (el: unknown) => void
  /** The el-form instance, once mounted. Read-only; write via bindFormRef. */
  formRef: FormInstance | undefined
  model: TModel
  /**
   * The rules passed in, handed back so the page can bind :rules="form.rules"
   * rather than keeping its own copy. Unwrapped, so a computed passed in
   * arrives here as a plain object.
   */
  rules: FormRules | undefined
  /** True while a submit is in flight. Bind to the confirm button's `loading`. */
  submitting: boolean
  /** True while `openEdit` is fetching the record. */
  loading: boolean
  /** Dialog visibility. */
  visible: boolean
  /** Title for the current mode. */
  title: string
  /** True when the model carries a primary key. */
  isEdit: boolean
  /** Open for creation, optionally seeding fields. */
  openCreate: (patch?: Partial<TModel>) => void
  /** Open for editing: fetches the record by id, then shows the form. */
  openEdit: (idOrRow: TId | TModel) => Promise<void>
  /** Close and discard the current model. */
  close: () => void
  /** Validate, then submit. Resolves true only when the server accepted it. */
  submit: () => Promise<boolean>
  /** Restore the default model and clear validation state. */
  reset: () => void
}

export function useForm<TModel extends object, TId = unknown>(
  options: UseFormOptions<TModel, TId>
): UseFormReturn<TModel, TId> {
  const {
    defaultModel,
    rules,
    idKey,
    api = {},
    submit: submitOverride,
    title: titles = {},
    successMessage,
    onSuccess,
    onError
  } = options

  const formRef = ref<FormInstance>()

  /**
   * Guards the whole submit interaction, validation included. `submitting`
   * cannot do it: that drives the confirm button's loading state, so it must
   * only be true while the request is actually in flight.
   */
  let pending = false

  /**
   * Identifies the most recent openEdit. Clicking one row's edit button and
   * then another fires two detail requests, and without this the slower one
   * wins whichever row it belongs to -- so the dialog ends up showing the first
   * record while the user believes they opened the second, and saving writes to
   * the wrong one. Same token scheme as useTable.getList.
   */
  let loadToken = 0

  const bindFormRef = (el: unknown) => {
    formRef.value = (el as FormInstance | null) ?? undefined
  }
  const model = ref(defaultModel()) as Ref<TModel>
  const submitting = ref(false)
  const loading = ref(false)
  const visible = ref(false)

  const isEdit = computed(() => {
    if (!idKey) return false
    const id = model.value[idKey]
    return id !== undefined && id !== null && id !== ''
  })

  const title = computed(() =>
    isEdit.value ? (titles.edit ?? '修改') : (titles.create ?? '新增')
  )

  const reset = () => {
    model.value = defaultModel()
    // clearValidate, not resetFields: resetFields restores the values el-form
    // captured when it mounted, which for a reused dialog is whatever the
    // previously edited record happened to contain.
    void nextTick(() => formRef.value?.clearValidate())
  }

  const openCreate = (patch?: Partial<TModel>) => {
    reset()
    if (patch) Object.assign(model.value as object, patch)
    visible.value = true
  }

  const resolveId = (idOrRow: TId | TModel): TId => {
    if (idKey && idOrRow && typeof idOrRow === 'object' && idKey in idOrRow) {
      return (idOrRow as TModel)[idKey] as TId
    }
    return idOrRow as TId
  }

  const openEdit = async(idOrRow: TId | TModel) => {
    reset()
    if (!api.get) {
      // No detail endpoint: the row itself is the record.
      Object.assign(model.value as object, idOrRow as object)
      visible.value = true
      return
    }
    const token = ++loadToken
    loading.value = true
    try {
      const response = await api.get(resolveId(idOrRow))
      if (token !== loadToken) return
      // Merged onto the defaults rather than assigned: a record deleted by
      // someone else answers `{code:200, data:null}`, and assigning that
      // straight through renders the dialog against null. Merging also restores
      // any field the detail endpoint happens to omit.
      model.value = Object.assign(defaultModel(), response.data ?? {})
      visible.value = true
    } catch(error) {
      if (token !== loadToken) return
      onError?.(asReportedError(error))
    } finally {
      if (token === loadToken) loading.value = false
    }
  }

  const close = () => {
    visible.value = false
    reset()
  }

  const resolveSubmit = (): SubmitFn<TModel> | undefined => {
    if (submitOverride) return submitOverride
    return isEdit.value ? api.update : api.add
  }

  const submit = async(): Promise<boolean> => {
    // Guards from entry, not from the request. `submitting` is only set once
    // validation has passed, so keying the guard off it left the whole
    // `await form.validate()` window open: two Enter presses both got past it
    // and both submitted. Same shape of hole useRemove had around its confirm
    // dialog.
    if (pending) return false
    pending = true

    try {
      const form = formRef.value
      if (form) {
        // Element Plus rejects rather than resolving false when validation fails.
        const valid = await form.validate().catch(() => false)
        if (!valid) return false
      } else if (rules) {
        // Rules were declared but no el-form ever reached formRef, so every one
        // of them is being skipped rather than enforced.
        console.warn('useForm: validation rules were given but no el-form is attached, so nothing is being validated. Bind it with :ref="form.bindFormRef".')
      }

      const send = resolveSubmit()
      if (!send) {
        console.error('useForm: no submit handler -- pass `submit`, or `api.add`/`api.update` with an `idKey`.')
        return false
      }

      const editing = isEdit.value
      submitting.value = true
      await send(model.value)
      if (successMessage !== null) {
        const text = typeof successMessage === 'function'
          ? successMessage(model.value, editing)
          : successMessage ?? (editing ? '修改成功' : '新增成功')
        msgSuccess(text)
      }
      visible.value = false
      await onSuccess?.(model.value)
      return true
    } catch(error) {
      onError?.(asReportedError(error))
      return false
    } finally {
      pending = false
      submitting.value = false
    }
  }

  return reactive({
    bindFormRef,
    formRef,
    model,
    rules,
    submitting,
    loading,
    visible,
    title,
    isEdit,
    openCreate,
    openEdit,
    close,
    submit,
    reset
  }) as UseFormReturn<TModel, TId>
}
