import { describe, it, expect, afterAll } from 'vitest'
import { i18n, setLocale } from '@/lang'
import { nestByPackage } from '@/lang/gen-namespace'

/**
 * PRD 010, F9: a language pack the code generator writes into
 * `src/lang/{locale}/gen/{packageName}/{businessName}.ts` has to actually be
 * loaded by vue-i18n, not just sit on disk. Before this wiring existed, a file
 * placed there was invisible to `t()` -- silently, with no build error -- so
 * the assertions below go through the real `i18n` instance rather than
 * inspecting the exported object, to prove the whole chain and not just the
 * reducer.
 */
describe('the generator language namespace (F9)', () => {
  it('t() resolves a fixture file physically placed under lang/zh-CN/gen', () => {
    // zh-CN is loaded synchronously and is the default locale, so no
    // setLocale() is needed to observe it -- this is the case createI18n()
    // itself depends on (src/lang/index.ts).
    expect(i18n.global.locale.value).toBe('zh-CN')
    expect(i18n.global.t('gen.__fixture__.sample.title')).toBe('示例标题')
  })

  it('t() resolves the en-US half once that language is loaded', async() => {
    // en-US ships as a lazy chunk (src/lang/index.ts), so this exercises the
    // path F9 actually has to work on: a file the generator wrote is only
    // useful once someone's browser has switched language.
    await setLocale('en-US')
    expect(i18n.global.t('gen.__fixture__.sample.title')).toBe('Sample Title')
  })

  // setLocale() mutates the shared i18n singleton other spec files reuse
  // (tests/unit/support/setup.ts); leaving it on en-US would make whichever
  // spec runs next silently assert against the wrong language.
  afterAll(async() => {
    await setLocale('zh-CN')
  })
})

/**
 * The reducer in isolation, independent of the fixture file above.
 *
 * This is what a change to the path shape (say, a third nesting level) has to
 * keep working; the fixture test above is what a change to the glob call or
 * the aggregators' own wiring has to keep working. Neither catches what the
 * other does.
 */
describe('nestByPackage', () => {
  it('groups business files by their package directory', () => {
    const modules = {
      './admin/userProfile.ts': { default: { name: '姓名' }},
      './admin/sysUser.ts': { default: { name: '用户名' }},
      './order/sysUser.ts': { default: { name: 'Order name' }}
    }

    expect(nestByPackage(modules)).toEqual({
      admin: {
        userProfile: { name: '姓名' },
        sysUser: { name: '用户名' }
      },
      order: {
        sysUser: { name: 'Order name' }
      }
    })
  })

  it('ignores a path that is not exactly two segments deep', () => {
    const modules = {
      './index.ts': { default: { stray: 'should not appear' }},
      './admin/nested/tooDeep.ts': { default: { stray: 'should not appear' }},
      './admin/sysUser.ts': { default: { name: '用户名' }}
    }

    expect(nestByPackage(modules)).toEqual({
      admin: { sysUser: { name: '用户名' }}
    })
  })

  it('returns an empty object for an empty glob, the pre-generation state', () => {
    expect(nestByPackage({})).toEqual({})
  })
})
