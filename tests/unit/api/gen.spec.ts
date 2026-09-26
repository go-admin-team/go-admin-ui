import { importTable } from '@/api/tools/gen'

const request = vi.hoisted(() => vi.fn())
vi.mock('@/utils/request', () => ({ default: request }))

/**
 * Where the generator's import endpoint is sent its argument. The reasoning is
 * in src/api/tools/gen.ts; what matters here is that v3.2.0 shipped with the
 * list in the body, which older servers do not read, and nothing in the build
 * could tell -- a carrier is invisible to the type checker, the linter and the
 * mocked e2e alike.
 */
describe('importTable', () => {
  it('keeps the table list in the query, where every server reads it', () => {
    importTable('sys_user,sys_post')

    expect(request).toHaveBeenCalledWith({
      url: '/api/v1/sys/tables/info',
      method: 'post',
      params: { tables: 'sys_user,sys_post' }
    })
  })
})
