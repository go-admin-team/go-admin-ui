import type { AxiosError, AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types/api'

/**
 * The response interceptor, which is where the two contracts everything else is
 * written against are actually enforced:
 *
 *   1. a resolved response means code === 200
 *   2. a rejection the user has already seen carries `reported: true`
 *
 * Both were stated in prose in src/types/api.ts and in every composable's docs,
 * and neither had a test -- which is how the 6401 branch came to resolve with
 * `false` and the catch-all came to reject with a bare string.
 *
 * The interceptor handlers are captured from a stubbed axios instance and called
 * directly, so this exercises the real logic without a network or a server.
 */

type Fulfilled = (r: AxiosResponse<ApiResponse>) => unknown
type Rejected = (e: AxiosError) => unknown

// hoisted: vi.mock is lifted above ordinary declarations, so the factory below
// would otherwise close over a binding that is still in its temporal dead zone
const captured = vi.hoisted(() => ({}) as { fulfilled?: Fulfilled, rejected?: Rejected })
const requestSpy = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    create: () => ({
      request: requestSpy,
      interceptors: {
        request: { use: vi.fn() },
        response: {
          use: (onFulfilled: Fulfilled, onRejected: Rejected) => {
            captured.fulfilled = onFulfilled
            captured.rejected = onRejected
          }
        }
      }
    })
  }
}))

const resetToken = vi.hoisted(() => vi.fn())
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ token: 'tok', resetToken })
}))
vi.mock('@/utils/auth', () => ({ getToken: () => 'tok' }))

const message = vi.hoisted(() => vi.fn())
const confirm = vi.hoisted(() => vi.fn(() => Promise.resolve('confirm')))
vi.mock('element-plus', () => ({
  ElMessage: message,
  ElMessageBox: { confirm }
}))

// Importing for the side effect of registering the interceptors
import '@/utils/request'

/** An axios response carrying the given envelope. */
const envelope = (body: Partial<ApiResponse>): AxiosResponse<ApiResponse> => ({
  data: { code: 200, msg: 'ok', data: null, ...body } as ApiResponse,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {}
} as AxiosResponse<ApiResponse>)

describe('request response interceptor', () => {
  beforeEach(() => {
    message.mockClear()
    confirm.mockClear()
    resetToken.mockClear()
  })

  it('resolves with the envelope, not the axios response', async() => {
    const out = await Promise.resolve(captured.fulfilled!(envelope({ code: 200, data: { id: 1 }, msg: 'ok' })))

    // Callers read `.data` off this, so it has to be the body
    expect(out).toEqual({ code: 200, data: { id: 1 }, msg: 'ok' })
    expect(message).not.toHaveBeenCalled()
  })

  describe('every non-200 rejects, with a real Error carrying the message', () => {
    // A bare string leaves error.message undefined, which renders an empty toast
    // in any caller following the `error?.message || fallback` pattern.
    it.each([
      [400, '参数错误'],
      [403, '没有权限'],
      [500, '服务器开小差了'],
      [10001, '业务失败']
    ])('code %i', async(code, msg) => {
      const error = await Promise.resolve(captured.fulfilled!(envelope({ code, msg })))
        .catch((e: Error) => e)

      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe(msg)
      expect(message).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: msg }))
    })

    it('falls back to a message when the server sends none', async() => {
      const error = await Promise.resolve(captured.fulfilled!(envelope({ code: 500, msg: '' })))
        .catch((e: Error) => e)
      expect((error as Error).message).toBe('error')
    })
  })

  describe('session expiry', () => {
    it('401 rejects and offers a way back to login', async() => {
      const error = await Promise.resolve(captured.fulfilled!(envelope({ code: 401, msg: '' })))
        .catch((e: Error) => e)

      expect(error).toBeInstanceOf(Error)
      expect(confirm).toHaveBeenCalledTimes(1)
      expect(resetToken).toHaveBeenCalled()
    })

    // This branch used to `return false`, which resolves -- so an expired session
    // surfaced as a silently empty table and threw wherever `.data` was read.
    it('6401 rejects rather than resolving', async() => {
      const settled = await Promise.resolve(captured.fulfilled!(envelope({ code: 6401, msg: '' })))
        .then(() => 'resolved', (e: Error) => e)

      expect(settled).toBeInstanceOf(Error)
      expect(resetToken).toHaveBeenCalled()
    })
  })

  describe('reported flag', () => {
    // "The interceptor already told the user, do not report it again" is the
    // rule; this is what makes it checkable instead of aspirational.
    it.each([[401], [6401], [403], [500]])('marks the rejection from code %i', async(code) => {
      const error = await Promise.resolve(captured.fulfilled!(envelope({ code, msg: 'x' })))
        .catch((e: Error & { reported?: boolean }) => e)

      expect((error as { reported?: boolean }).reported).toBe(true)
    })

    it('marks a transport failure too', async() => {
      const error = await Promise.resolve(captured.rejected!({ message: 'Network Error' } as AxiosError))
        .catch((e: Error & { reported?: boolean }) => e)

      expect((error as { reported?: boolean }).reported).toBe(true)
      expect(message).toHaveBeenCalledWith(
        expect.objectContaining({ message: '服务器连接异常，请检查服务器！' })
      )
    })
  })
})
