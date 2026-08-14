import { parseTime } from '@/utils/costum.js'

// costum.js 的 parseTime 才是全局 $parseTime 的实现，此前无任何测试覆盖。
// 它比 utils/index.js 的同名函数多一段哨兵判断：后端对零值时间返回
// "0001-01-01 00:00:00"，需显示为 "-"。该判断曾无条件调用 time.indexOf，
// 导致数字时间戳与 Date 对象入参直接抛 TypeError。
describe('Utils:costum parseTime', () => {
  it('格式化字符串日期', () => {
    expect(parseTime('2026-01-01 10:00:00')).toBe('2026-01-01 10:00:00')
  })

  it('格式化 Date 对象', () => {
    expect(parseTime(new Date('2026-01-01 10:00:00'))).toBe('2026-01-01 10:00:00')
  })

  it('格式化秒级时间戳', () => {
    const sec = Math.floor(new Date('2026-01-01 10:00:00').getTime() / 1000)
    expect(parseTime(sec)).toBe('2026-01-01 10:00:00')
  })

  it('格式化毫秒级时间戳', () => {
    const ms = new Date('2026-01-01 10:00:00').getTime()
    expect(parseTime(ms)).toBe('2026-01-01 10:00:00')
  })

  it('后端零值时间显示为短横线', () => {
    expect(parseTime('0001-01-01 00:00:00')).toBe('-')
  })

  it('自定义格式（个位数补零）', () => {
    expect(parseTime('2026-01-01 10:00:00', '{y}/{m}/{d}')).toBe('2026/01/01')
  })

  it('空值返回 null', () => {
    expect(parseTime(null)).toBeNull()
    expect(parseTime('')).toBeNull()
    expect(parseTime()).toBeNull()
  })

  // 回归用例：把哨兵判断改回无条件的 time.indexOf 会让下面三条全部抛错
  it('非字符串入参不抛异常', () => {
    expect(() => parseTime(1735689600)).not.toThrow()
    expect(() => parseTime(1735689600000)).not.toThrow()
    expect(() => parseTime(new Date())).not.toThrow()
  })
})
