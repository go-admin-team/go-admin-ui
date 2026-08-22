import { nextTick } from 'vue'
import { useForm } from '@/composables/useForm'
import type { ApiResponse } from '@/types/api'
import { deferred } from '../support/async'

vi.mock('@/utils/message', () => ({
  msgSuccess: vi.fn(),
  msgError: vi.fn(),
  msgInfo: vi.fn()
}))

import { msgSuccess } from '@/utils/message'

interface User {
  userId?: number
  username?: string
  nickName?: string
}

/** Stands in for the el-form instance the template would provide. */
const formStub = (valid: boolean) => ({
  validate: valid
    ? () => Promise.resolve(true)
    : () => Promise.reject(new Error('invalid')),
  clearValidate: vi.fn(),
  resetFields: vi.fn()
})

const defaultUser = (): User => ({ userId: undefined, username: '', nickName: '' })

describe('useForm', () => {
  beforeEach(() => {
    vi.mocked(msgSuccess).mockClear()
  })

  describe('opening', () => {
    it('openCreate starts from the default model and shows the form', () => {
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId' })

      form.model.username = 'left over'
      form.openCreate()

      expect(form.model).toEqual(defaultUser())
      expect(form.visible).toBe(true)
      expect(form.isEdit).toBe(false)
      expect(form.title).toBe('新增')
    })

    it('openCreate seeds the fields it is given', () => {
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId' })

      form.openCreate({ username: 'seeded' })

      expect(form.model.username).toBe('seeded')
      // Seeding a non-key field must not flip the form into edit mode
      expect(form.isEdit).toBe(false)
    })

    it('openEdit loads the record before showing the form', async() => {
      const get = vi.fn().mockResolvedValue({
        code: 200,
        msg: 'ok',
        data: { userId: 7, username: 'admin', nickName: 'Admin' }
      } as ApiResponse<User>)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { get }})

      await form.openEdit({ userId: 7 })

      expect(get).toHaveBeenCalledWith(7)
      expect(form.model.username).toBe('admin')
      expect(form.visible).toBe(true)
      expect(form.isEdit).toBe(true)
      expect(form.title).toBe('修改')
      expect(form.loading).toBe(false)
    })

    it('openEdit accepts a bare id as well as a row', async() => {
      const get = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: { userId: 9 }})
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { get }})

      await form.openEdit(9)

      expect(get).toHaveBeenCalledWith(9)
    })

    it('openEdit uses the row itself when there is no detail endpoint', async() => {
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId' })

      await form.openEdit({ userId: 3, username: 'from-row' })

      expect(form.model.username).toBe('from-row')
      expect(form.visible).toBe(true)
    })

    // Clicking one row's edit button then another fires two detail requests.
    // Without a token the slower one wins: the dialog shows the first record
    // while the user believes they opened the second, and saving writes to the
    // wrong one.
    it('ignores a detail response that a later openEdit superseded', async() => {
      const first = deferred<ApiResponse<User>>()
      const second = deferred<ApiResponse<User>>()
      const get = vi.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { get }})

      const firstCall = form.openEdit(1)
      const secondCall = form.openEdit(2)

      second.resolve({ code: 200, msg: 'ok', data: { userId: 2, username: 'row-two' }})
      await secondCall
      first.resolve({ code: 200, msg: 'ok', data: { userId: 1, username: 'row-one' }})
      await firstCall

      expect(form.model.username).toBe('row-two')
      expect(form.loading).toBe(false)
    })

    it('keeps the form closed and clears loading when the record fails to load', async() => {
      const get = vi.fn().mockRejectedValue(new Error('404'))
      const onError = vi.fn()
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { get },
        onError
      })

      await form.openEdit(7)

      expect(form.visible).toBe(false)
      expect(form.loading).toBe(false)
      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('uses the titles it is given', async() => {
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        title: { create: '添加用户', edit: '修改用户' }
      })

      form.openCreate()
      expect(form.title).toBe('添加用户')

      await form.openEdit({ userId: 1 })
      expect(form.title).toBe('修改用户')
    })
  })

  describe('submitting', () => {
    it('calls add when the model has no primary key', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const update = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add, update }
      })

      form.openCreate({ username: 'new' })
      const ok = await form.submit()

      expect(ok).toBe(true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(update).not.toHaveBeenCalled()
      expect(form.visible).toBe(false)
      expect(msgSuccess).toHaveBeenCalledWith('新增成功')
    })

    it('calls update when the model carries a primary key', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const update = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add, update }
      })

      await form.openEdit({ userId: 5, username: 'admin' })
      const ok = await form.submit()

      expect(ok).toBe(true)
      expect(update).toHaveBeenCalledTimes(1)
      expect(add).not.toHaveBeenCalled()
      expect(msgSuccess).toHaveBeenCalledWith('修改成功')
    })

    // The defect this covers: mixins/crud.js had no in-flight check, so a
    // double-clicked confirm button sent two POSTs and created two records.
    it('refuses a second submit while the first is in flight', async() => {
      const pending = deferred<void>()
      const add = vi.fn().mockReturnValue(pending.promise)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { add }})

      form.openCreate()
      const first = form.submit()
      await nextTick()
      expect(form.submitting).toBe(true)

      const second = await form.submit()

      expect(second).toBe(false)
      expect(add).toHaveBeenCalledTimes(1)

      pending.resolve()
      expect(await first).toBe(true)
      expect(form.submitting).toBe(false)
    })

    // The guard has to cover validation too. `submitting` is only set after
    // `await form.validate()`, so with a real el-form attached two calls can
    // both get past `if (submitting.value)` while the first is still
    // validating -- the same shape of hole useRemove had around its dialog.
    // The existing in-flight test cannot see it: with no form attached there is
    // no await before the flag is set.
    it('refuses a second submit while the first is still validating', async() => {
      const gate = deferred<boolean>()
      const add = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { add }})

      form.formRef = {
        validate: () => gate.promise,
        clearValidate: vi.fn(),
        resetFields: vi.fn()
      } as never
      form.openCreate()

      const first = form.submit()
      const second = form.submit()

      gate.resolve(true)

      expect(await first).toBe(true)
      expect(await second).toBe(false)
      expect(add).toHaveBeenCalledTimes(1)
    })

    it('does not submit when validation fails', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { add }})

      form.formRef = formStub(false) as never
      form.openCreate()
      const ok = await form.submit()

      expect(ok).toBe(false)
      expect(add).not.toHaveBeenCalled()
      // A form that failed validation stays open so the user can fix it
      expect(form.visible).toBe(true)
      expect(form.submitting).toBe(false)
    })

    it('submits once validation passes', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { add }})

      form.formRef = formStub(true) as never
      form.openCreate()

      expect(await form.submit()).toBe(true)
      expect(add).toHaveBeenCalledTimes(1)
    })

    // mixins/crud.js ended its chain with .catch(() => {}), so a server error
    // left the dialog looking as if nothing had happened.
    it('keeps the form open and clears submitting when the server rejects', async() => {
      const add = vi.fn().mockRejectedValue(new Error('500'))
      const onError = vi.fn()
      const onSuccess = vi.fn()
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add },
        onError,
        onSuccess
      })

      form.openCreate()
      const ok = await form.submit()

      expect(ok).toBe(false)
      expect(form.visible).toBe(true)
      expect(form.submitting).toBe(false)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onSuccess).not.toHaveBeenCalled()
      expect(msgSuccess).not.toHaveBeenCalled()
    })

    it('allows a retry after a failure', async() => {
      const add = vi.fn()
        .mockRejectedValueOnce(new Error('500'))
        .mockResolvedValueOnce(undefined)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { add }})

      form.openCreate()
      expect(await form.submit()).toBe(false)
      expect(await form.submit()).toBe(true)
      expect(add).toHaveBeenCalledTimes(2)
    })

    it('runs onSuccess after a successful submit', async() => {
      const order: string[] = []
      const add = vi.fn().mockImplementation(() => {
        order.push('add')
        return Promise.resolve()
      })
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add },
        onSuccess: () => { order.push('onSuccess') }
      })

      form.openCreate()
      await form.submit()

      expect(order).toEqual(['add', 'onSuccess'])
    })

    it('prefers an explicit submit handler over the api pair', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const submit = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add },
        submit
      })

      form.openCreate({ username: 'x' })
      await form.submit()

      expect(submit).toHaveBeenCalledWith(expect.objectContaining({ username: 'x' }))
      expect(add).not.toHaveBeenCalled()
    })

    it('builds the toast from a function when given one', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add },
        successMessage: (model, isEdit) => `${isEdit ? '改了' : '加了'} ${model.username}`
      })

      form.openCreate({ username: 'bob' })
      await form.submit()

      expect(msgSuccess).toHaveBeenCalledWith('加了 bob')
    })

    it('stays silent when successMessage is null', async() => {
      const add = vi.fn().mockResolvedValue(undefined)
      const form = useForm<User, number>({
        defaultModel: defaultUser,
        idKey: 'userId',
        api: { add },
        successMessage: null
      })

      form.openCreate()
      await form.submit()

      expect(msgSuccess).not.toHaveBeenCalled()
    })

    it('reports a missing handler instead of failing silently', async() => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId' })

      form.openCreate()
      const ok = await form.submit()

      expect(ok).toBe(false)
      expect(error).toHaveBeenCalled()
      error.mockRestore()
    })
  })

  describe('closing', () => {
    it('close hides the form and discards the model', async() => {
      const get = vi.fn().mockResolvedValue({ code: 200, msg: 'ok', data: { userId: 4, username: 'admin' }})
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId', api: { get }})

      await form.openEdit(4)
      form.close()

      expect(form.visible).toBe(false)
      expect(form.model).toEqual(defaultUser())
      expect(form.isEdit).toBe(false)
    })

    it('clears validation state rather than resetting to the previous record', async() => {
      const stub = formStub(true)
      const form = useForm<User, number>({ defaultModel: defaultUser, idKey: 'userId' })
      form.formRef = stub as never

      form.close()
      await nextTick()

      // resetFields() would restore whatever el-form captured on mount, which
      // for a reused dialog is the record edited before this one
      expect(stub.clearValidate).toHaveBeenCalled()
      expect(stub.resetFields).not.toHaveBeenCalled()
    })
  })

  it('treats an empty-string key as not-yet-created', () => {
    const form = useForm<User, string>({
      defaultModel: () => ({ userId: undefined }),
      idKey: 'userId'
    })

    form.model = { userId: undefined }
    expect(form.isEdit).toBe(false)
  })
})
