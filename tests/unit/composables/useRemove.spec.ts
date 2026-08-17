import { nextTick } from 'vue'
import { useRemove } from '@/composables/useRemove'
import { deferred } from '../support/async'

const confirm = vi.hoisted(() => vi.fn())
vi.mock('element-plus', () => ({ ElMessageBox: { confirm }}))

vi.mock('@/utils/message', () => ({
  msgSuccess: vi.fn(),
  msgError: vi.fn(),
  msgInfo: vi.fn()
}))

import { msgSuccess } from '@/utils/message'

/** The user pressing 确定. */
const accepts = () => confirm.mockResolvedValue('confirm')
/** The user pressing 取消, which ElMessageBox reports as a rejection. */
const cancels = () => confirm.mockRejectedValue('cancel')

describe('useRemove', () => {
  beforeEach(() => {
    confirm.mockReset()
    vi.mocked(msgSuccess).mockClear()
  })

  it('asks before deleting, then reloads', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { remove } = useRemove({ api, onSuccess })

    const ok = await remove(7)

    expect(ok).toBe(true)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(api).toHaveBeenCalledWith([7])
    expect(onSuccess).toHaveBeenCalledWith([7])
    expect(msgSuccess).toHaveBeenCalledWith('删除成功')
  })

  it('accepts a list of ids for a bulk delete', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({ api })

    await remove([1, 2, 3])

    expect(api).toHaveBeenCalledWith([1, 2, 3])
    expect(confirm.mock.calls[0][0]).toContain('3')
  })

  // The mixin closed its delete chain with `.catch(() => {})`, which was there
  // to swallow the confirm dialog's rejection and swallowed server errors too.
  // Here the two are told apart.
  it('does nothing when the user cancels', async() => {
    cancels()
    const api = vi.fn().mockResolvedValue(undefined)
    const onError = vi.fn()
    const { remove } = useRemove({ api, onError })

    const ok = await remove(7)

    expect(ok).toBe(false)
    expect(api).not.toHaveBeenCalled()
    // Cancelling is a decision, not a failure
    expect(onError).not.toHaveBeenCalled()
    expect(msgSuccess).not.toHaveBeenCalled()
  })

  it('reports a failed delete and does not claim success', async() => {
    accepts()
    const api = vi.fn().mockRejectedValue(new Error('500'))
    const onError = vi.fn()
    const onSuccess = vi.fn()
    const { remove, removing } = useRemove({ api, onError, onSuccess })

    const ok = await remove(7)

    expect(ok).toBe(false)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
    expect(msgSuccess).not.toHaveBeenCalled()
    expect(removing.value).toBe(false)
  })

  it('refuses a second delete while the first is in flight', async() => {
    accepts()
    const pending = deferred<void>()
    const api = vi.fn().mockReturnValue(pending.promise)
    const { remove, removing } = useRemove({ api })

    const first = remove(7)
    await nextTick()
    await nextTick()
    expect(removing.value).toBe(true)

    expect(await remove(8)).toBe(false)
    expect(api).toHaveBeenCalledTimes(1)

    pending.resolve()
    expect(await first).toBe(true)
    expect(removing.value).toBe(false)
  })

  // The guard used to key off `removing`, which is only set after the dialog is
  // confirmed -- so two clicks both passed it, both queued a dialog, and
  // confirming both sent two DELETEs for the same ids.
  it('opens one dialog when the trigger is clicked twice', async() => {
    const gate = deferred<string>()
    confirm.mockReturnValue(gate.promise)
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({ api })

    const first = remove(7)
    const second = remove(7)

    expect(await second).toBe(false)
    expect(confirm).toHaveBeenCalledTimes(1)

    gate.resolve('confirm')
    expect(await first).toBe(true)
    expect(api).toHaveBeenCalledTimes(1)
  })

  it('asks nothing when there is nothing selected', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({ api })

    expect(await remove([])).toBe(false)
    expect(await remove(undefined)).toBe(false)

    expect(confirm).not.toHaveBeenCalled()
    expect(api).not.toHaveBeenCalled()
  })

  it('drops empty ids rather than sending them', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({ api })

    await remove([1, undefined as never, 2])

    expect(api).toHaveBeenCalledWith([1, 2])
  })

  it('uses the confirmation text and toast it is given', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({
      api,
      confirmText: count => `确认删除选中的 ${count} 个用户？`,
      successMessage: '用户已删除'
    })

    await remove([4, 5])

    expect(confirm.mock.calls[0][0]).toBe('确认删除选中的 2 个用户？')
    expect(msgSuccess).toHaveBeenCalledWith('用户已删除')
  })

  it('stays silent when successMessage is null', async() => {
    accepts()
    const api = vi.fn().mockResolvedValue(undefined)
    const { remove } = useRemove({ api, successMessage: null })

    await remove(1)

    expect(msgSuccess).not.toHaveBeenCalled()
  })
})
