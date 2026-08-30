import { describe, it, expect, beforeEach } from 'vitest'
import { applyThemeColor } from '@/utils/theme-color'

/**
 * The colour maths, and the dark-mode half that is easy to get wrong.
 *
 * This replaced a mechanism that fetched element-plus's stylesheet from a CDN
 * and string-replaced colours in it. Whether that still worked was never
 * established -- it walked document.querySelectorAll('style'), and a production
 * build serves its CSS as files rather than style tags. So rather than port its
 * behaviour, these assert what Element Plus actually needs.
 */
const read = (name: string) =>
  document.documentElement.style.getPropertyValue(name)

describe('applyThemeColor', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ''
    document.documentElement.className = ''
  })

  it('sets the primary colour and every tint Element Plus derives', () => {
    // Missing any one of these leaves half the components on the old colour --
    // el-button's hover, el-tag's background, the focused input border.
    applyThemeColor('#409eff')

    expect(read('--el-color-primary')).toBe('#409eff')
    for (const step of [3, 5, 7, 8, 9]) {
      expect(read(`--el-color-primary-light-${step}`), `light-${step} missing`).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(read('--el-color-primary-dark-2')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('lightens toward white, in proportion', () => {
    applyThemeColor('#000000')
    // light-N mixes N/10 of the ground in, so black at light-5 is mid grey.
    expect(read('--el-color-primary-light-5')).toBe('#808080')
    expect(read('--el-color-primary-light-9')).toBe('#e6e6e6')
  })

  it('pads every channel to two digits', () => {
    // The mechanism this replaced built hex with `value.toString(16)`, so a
    // channel below 16 produced one digit and the whole colour came out as a
    // five-character string the browser drops on the floor.
    applyThemeColor('#0a0a0a')
    for (const step of [3, 5, 7, 8, 9]) {
      expect(read(`--el-color-primary-light-${step}`)).toHaveLength(7)
    }
    expect(read('--el-color-primary-dark-2')).toBe('#080808')
  })

  it('mixes toward the dark ground when the dark theme is on', () => {
    // Element Plus's own dark theme tints toward #141414, not white. Computing
    // for light and rendering on dark is the difference between a tint and a
    // washed-out patch.
    document.documentElement.classList.add('dark')
    applyThemeColor('#000000')

    // Toward #141414 rather than #ffffff: half of 20 is 10 -> 0a.
    expect(read('--el-color-primary-light-5')).toBe('#0a0a0a')
  })

  it('ignores anything that is not a colour', () => {
    // el-color-picker hands back null when cleared.
    applyThemeColor('#123456')
    applyThemeColor('not a colour')
    expect(read('--el-color-primary')).toBe('#123456')
  })

  it('accepts the three-digit form', () => {
    applyThemeColor('#08f')
    expect(read('--el-color-primary')).toBe('#08f')
    // #08f expands to #0088ff; mixing half of white in gives 128 / 196 / 255.
    expect(read('--el-color-primary-light-5')).toBe('#80c4ff')
  })
})
