import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { i18n, setLocale } from '@/lang'
import {
  translateMenuTitle, translateDictLabel, translateDictTypeName, routeTitle
} from '@/lang/backend'

/**
 * Translating text that arrived from the database.
 *
 * The failure mode this guards is silence: a menu whose translation is missing
 * renders blank or as a key instead of its Chinese, and nothing throws. The
 * whole design rests on the fallback, so the fallback is what gets tested.
 */
describe('with the interface in Chinese', () => {
  beforeEach(async() => { await setLocale('zh-CN') })

  it('returns the database value unchanged', () => {
    // zh-CN deliberately ships no menu.ts or dict.ts, so every one of these
    // falls through. This is what keeps the Chinese interface byte-for-byte
    // what it was before the migration -- PRD R5 and the 309 e2e assertions.
    expect(translateMenuTitle('SysUserManage', '用户管理')).toBe('用户管理')
    expect(translateDictLabel('sys_user_sex', '0', '男')).toBe('男')
    expect(translateDictTypeName('sys_user_sex', '用户性别')).toBe('用户性别')
  })
})

describe('with the interface in English', () => {
  beforeEach(async() => { await setLocale('en-US') })
  afterAll(async() => { await setLocale('zh-CN') })

  it('translates a menu by its menu_name', () => {
    expect(translateMenuTitle('SysUserManage', '用户管理')).toBe('User Management')
    expect(translateMenuTitle('SysPostManage', '岗位管理')).toBe('Position Management')
  })

  it('falls back to the Chinese for a menu the user created', () => {
    // Not an error state. A deployment's own menus will never be in menu.ts,
    // and PRD R2 says they must show their Chinese rather than a blank or a
    // key. This is the single most likely thing to break in real use.
    expect(translateMenuTitle('OurOwnMenu', '我们自己的菜单')).toBe('我们自己的菜单')
    expect(translateMenuTitle(undefined, '没有名字')).toBe('没有名字')
  })

  it('translates a dictionary label by type and value', () => {
    expect(translateDictLabel('sys_user_sex', '0', '男')).toBe('Male')
    // The number the table actually stores, rather than the string the dict API
    // sends. Several pages hold the same field as a number.
    expect(translateDictLabel('sys_user_sex', 0, '男')).toBe('Male')
  })

  it('keeps the three ways Chinese says "not normal" apart', () => {
    // 停用 / 关闭 / 禁用 are three words for one idea in three dict types.
    // Unifying the English while the Chinese stays split would make the two
    // sides stop corresponding -- see 术语表.md.
    expect(translateDictLabel('sys_normal_disable', '1', '停用')).toBe('Disabled')
    expect(translateDictLabel('sys_common_status', '1', '关闭')).toBe('Closed')
    expect(translateDictLabel('sys_content_status', '2', '禁用')).toBe('Banned')
  })

  it('falls back for a dictionary the user created', () => {
    expect(translateDictLabel('our_own_type', 'X', '自定义')).toBe('自定义')
    expect(translateDictTypeName('our_own_type', '自定义类型')).toBe('自定义类型')
  })

  it('looks up a dict_value containing a dot', () => {
    // The seed data has none, but a user-created dictionary can hold anything.
    // Had this gone through vue-i18n's t(), the dots would be split into a path
    // and the lookup would silently miss -- which is why these functions do
    // plain object access instead.
    i18n.global.mergeLocaleMessage('en-US', {
      dict: { values: { app_version: { '1.2.3': 'Version 1.2.3' }}}
    })
    expect(translateDictLabel('app_version', '1.2.3', '版本 1.2.3')).toBe('Version 1.2.3')
  })

  it('treats an empty translation as missing', () => {
    // A key present with an empty value would render a blank label, which reads
    // as a broken page rather than an untranslated one.
    i18n.global.mergeLocaleMessage('en-US', { menu: { BlankOne: '' }})
    expect(translateMenuTitle('BlankOne', '空的')).toBe('空的')
  })
})

describe('routeTitle', () => {
  afterAll(async() => { await setLocale('zh-CN') })

  it('sends a static route through the ordinary language pack', async() => {
    // meta.titleKey means the frontend owns the string, so a miss there is a
    // migration bug and should warn -- the opposite of a database title.
    await setLocale('en-US')
    expect(routeTitle({ name: 'Dashboard', meta: { title: '首页', titleKey: 'route.dashboard' }}))
      .toBe('Home')

    await setLocale('zh-CN')
    expect(routeTitle({ name: 'Dashboard', meta: { title: '首页', titleKey: 'route.dashboard' }}))
      .toBe('首页')
  })

  it('sends a menu route through its menu_name', async() => {
    await setLocale('en-US')
    expect(routeTitle({ name: 'SysDeptManage', meta: { title: '部门管理' }}))
      .toBe('Department Management')
  })

  it('survives a route with no meta at all', () => {
    // Menu data comes from a database an operator can edit.
    expect(routeTitle({ name: 'Whatever' })).toBe('')
    expect(routeTitle(null)).toBe('')
    expect(routeTitle(undefined)).toBe('')
  })
})
