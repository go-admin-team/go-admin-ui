import { useDict, dictLabel, clearDictCache } from '@/composables/useDict'
import { flushPromises } from '../support/async'

const getDicts = vi.hoisted(() => vi.fn())
vi.mock('@/api/admin/dict/data', () => ({ getDicts }))

const options = (...pairs: Array<[string, string]>) => ({
  code: 200,
  msg: 'ok',
  data: pairs.map(([label, value]) => ({ label, value }))
})

describe('useDict', () => {
  beforeEach(() => {
    clearDictCache()
    getDicts.mockReset()
  })

  it('returns a ref per type, empty until the request lands', async() => {
    getDicts.mockResolvedValue(options(['正常', '1'], ['停用', '2']))

    const { sys_normal_disable } = useDict('sys_normal_disable')
    expect(sys_normal_disable.value).toEqual([])

    await flushPromises()
    expect(sys_normal_disable.value).toEqual([
      { label: '正常', value: '1' },
      { label: '停用', value: '2' }
    ])
  })

  it('fetches each requested type once', async() => {
    getDicts.mockResolvedValue(options(['正常', '1']))

    useDict('sys_normal_disable', 'sys_user_sex')
    await flushPromises()

    expect(getDicts).toHaveBeenCalledTimes(2)
    expect(getDicts).toHaveBeenCalledWith('sys_normal_disable')
    expect(getDicts).toHaveBeenCalledWith('sys_user_sex')
  })

  // Walking through five pages that each show a status column used to fetch
  // sys_normal_disable five times, because every created() hook asked again.
  it('serves a repeated type from cache instead of refetching', async() => {
    getDicts.mockResolvedValue(options(['正常', '1']))

    const first = useDict('sys_normal_disable')
    await flushPromises()
    const second = useDict('sys_normal_disable')
    await flushPromises()

    expect(getDicts).toHaveBeenCalledTimes(1)
    expect(second.sys_normal_disable.value).toEqual(first.sys_normal_disable.value)
  })

  it('shares one in-flight request between simultaneous callers', async() => {
    getDicts.mockResolvedValue(options(['正常', '1']))

    const first = useDict('sys_normal_disable')
    const second = useDict('sys_normal_disable')
    await flushPromises()

    expect(getDicts).toHaveBeenCalledTimes(1)
    expect(first.sys_normal_disable.value).toHaveLength(1)
    expect(second.sys_normal_disable.value).toHaveLength(1)
  })

  it('does not cache a failure, so a later page can retry', async() => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    getDicts.mockRejectedValueOnce(new Error('500'))

    const failed = useDict('sys_normal_disable')
    await flushPromises()
    expect(failed.sys_normal_disable.value).toEqual([])

    getDicts.mockResolvedValue(options(['正常', '1']))
    const retried = useDict('sys_normal_disable')
    await flushPromises()

    expect(getDicts).toHaveBeenCalledTimes(2)
    expect(retried.sys_normal_disable.value).toHaveLength(1)
    error.mockRestore()
  })

  it('clearDictCache forces the next call to refetch', async() => {
    getDicts.mockResolvedValue(options(['正常', '1']))

    useDict('sys_normal_disable')
    await flushPromises()
    clearDictCache('sys_normal_disable')
    useDict('sys_normal_disable')
    await flushPromises()

    expect(getDicts).toHaveBeenCalledTimes(2)
  })
})

describe('dictLabel', () => {
  const statuses = [
    { label: '正常', value: '1' },
    { label: '停用', value: '2' }
  ]

  it('maps a value to its label', () => {
    expect(dictLabel(statuses, '1')).toBe('正常')
  })

  // Dictionary values arrive as strings while several tables store the same
  // field as a number, so the comparison is deliberately loose.
  it('matches a number against a string value', () => {
    expect(dictLabel(statuses, 2)).toBe('停用')
  })

  it('falls back to the raw value when nothing matches', () => {
    expect(dictLabel(statuses, '9')).toBe('9')
  })

  it('renders nothing for a missing value', () => {
    expect(dictLabel(statuses, undefined)).toBe('')
    expect(dictLabel(statuses, null)).toBe('')
  })
})
