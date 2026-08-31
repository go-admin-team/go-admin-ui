/**
 * The API page: the routes the Go side registers, which this page can only
 * retitle.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). Handle and Method stay English in both packs -- they are English on the
 * Chinese screen too, and are the names of the fields themselves.
 *
 * 修改 / 创建时间 / 确 定 / 取 消 come from common.ts.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  title: '标题',
  titlePlaceholder: '请输入标题',
  path: '地址',
  pathPlaceholder: '请输入地址',
  type: '类型',

  // ── Columns ─────────────────────────────────────────────────────
  api: '接口',
  /** Tag shown in place of a title the backend never gave this route. */
  none: '暂无',
  /** The path column's hover card, where the rest of the record is readable. */
  peekHandle: 'Handle：{value}',
  peekType: '类型：{value}',
  peekTitle: '标题：{value}',

  // ── Edit ────────────────────────────────────────────────────────
  editTitle: '修改接口',
  typePlaceholder: '请选择类型',
  actionPlaceholder: '请选择方式',

  rules: {
    handle: 'handle 不能为空',
    title: '标题不能为空',
    type: '类型不能为空'
  }
}
