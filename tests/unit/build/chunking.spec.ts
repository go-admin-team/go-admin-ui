import { describe, it, expect, beforeAll } from 'vitest'
import config from '../../../vite.config.mjs'

/**
 * What is allowed into the chunk every visitor downloads.
 *
 * scripts/check-first-paint.mjs guards the total, which catches something the
 * size of echarts. It cannot catch a few kilobytes -- and a language pack is a
 * few kilobytes, per language. Left unguarded, adding ja-JP and ko-KR would put
 * both in the entry and the budget would never notice.
 *
 * Measured, so the claim is honest: with the locale exclusion the first paint
 * is 481.44 kB and without it 481.60 kB. The exclusion buys 0.16 kB *today* and
 * is worth keeping anyway, for two reasons the numbers do not show.
 *
 * The first is that Element Plus's English pack cannot be excluded at all:
 * es/hooks/use-locale/index.mjs imports en.mjs statically as its default, so it
 * is in the entry no matter what this rule says. Only the languages loaded
 * through src/lang are affected.
 *
 * The second is that the cost is per language added later. zh-CN is the default
 * and belongs in the entry; a third language does not, and without the rule it
 * would be named into chunk-elementPlus and land there anyway.
 *
 * This tests the rule rather than the output, so it runs in milliseconds and
 * says which rule broke.
 */
let manualChunks: (id: string) => string | undefined

beforeAll(async() => {
  const resolved = await (config as unknown as (env: {
    mode: string, command: string
  }) => Promise<Record<string, never>> | Record<string, never>)({ mode: 'production', command: 'build' })
  manualChunks = (resolved as never as {
    build: { rollupOptions: { output: { manualChunks: (id: string) => string | undefined }}}
  }).build.rollupOptions.output.manualChunks
})

const id = (path: string) => `/repo/node_modules/${path}`

describe('what goes into the first paint', () => {
  it('names element-plus itself', () => {
    // The premise of the rest: if this stopped matching, every assertion below
    // would pass while checking nothing.
    expect(manualChunks(id('element-plus/es/components/button/index.mjs')))
      .toBe('chunk-elementPlus')
  })

  it('leaves element-plus locale packs out of it', () => {
    // Naming these would put every language Element Plus ships into the entry.
    // src/lang loads them with import() and needs them to stay separate.
    //
    // en.mjs is asserted here for the rule's sake, not because excluding it
    // achieves anything -- Element Plus imports it statically as its fallback
    // locale, so it reaches the entry through that edge regardless. ja is the
    // case this actually protects.
    expect(manualChunks(id('element-plus/es/locale/lang/en.mjs'))).toBeUndefined()
    expect(manualChunks(id('element-plus/es/locale/lang/zh-cn.mjs'))).toBeUndefined()
    expect(manualChunks(id('element-plus/es/locale/lang/ja.mjs'))).toBeUndefined()
  })

  it('leaves vue-i18n to the bundler rather than folding it into chunk-vue', () => {
    // The vue rule matches on /vue/ between separators, so vue-i18n is not
    // swept up by it. Worth pinning: widening that pattern to /vue.*/ would
    // change what the entry contains without any obvious sign.
    expect(manualChunks(id('vue-i18n/dist/vue-i18n.mjs'))).toBeUndefined()
    expect(manualChunks(id('vue/dist/vue.runtime.esm-bundler.js'))).toBe('chunk-vue')
  })

  it('leaves application code alone', () => {
    // The language packs this project writes are not in node_modules, so they
    // fall out at the first line and Vite splits them by their dynamic import.
    expect(manualChunks('/repo/src/lang/en-US/index.ts')).toBeUndefined()
  })

  it('leaves everything else to the bundler', () => {
    // Restating the rule the previous rewrite established: a library only a
    // lazy page reaches must not be named here.
    expect(manualChunks(id('echarts/core.js'))).toBeUndefined()
    expect(manualChunks(id('codemirror/lib/codemirror.js'))).toBeUndefined()
  })
})
