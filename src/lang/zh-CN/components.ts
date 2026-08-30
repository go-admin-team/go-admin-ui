/**
 * Text owned by the shared components in src/components.
 *
 * Grouped by component rather than by wording: a page reads its own strings out
 * of its own module, and these belong to whoever renders them wherever they are
 * mounted. Words that also appear on pages live in common.ts instead -- 搜索,
 * 重置, 刷新, 操作, 关闭, 暂无数据 and 加载中 are all read from there.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD R5).
 */
export default {
  proTable: {
    filters: '筛选',
    showResults: '查看结果',
    /** Label of the floating button that opens a page's toolbar on a phone. */
    pageActions: '页面操作'
  },
  cards: {
    collapse: '收起',
    more: '其余 {count} 项',
    // The arrow is part of the hint: it points at the gesture, so it travels
    // with the sentence rather than sitting in the template.
    swipeHint: '← 左滑操作',
    loadMore: '加载更多',
    noMore: '没有更多了'
  },
  iconSelect: {
    placeholder: '请输入图标名称'
  },
  rightPanel: {
    title: '系统布局配置'
  }
}
