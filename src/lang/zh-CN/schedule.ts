/**
 * Scheduled tasks -- views/schedule/index.vue and views/schedule/log.vue.
 *
 * One file for two pages, unlike admin/ and dev-tools/: the log page owns eight
 * strings and exists only as the destination of this one's 日志 button. It sits
 * under `jobLog` so the toolbar button can keep the plain `log` key.
 *
 * Every Chinese value is byte-for-byte what the interface renders today (PRD
 * R5). Two starts and two stops rather than one string with a {verb}: the page
 * built its confirmation as `确认${verb}任务「${name}」？`, which reads as one
 * sentence in Chinese and as a broken one in any language that does not put the
 * verb there.
 *
 * invokeTargetTip carries a literal `{..}` from a Go function body. Braces are
 * vue-i18n's interpolation syntax, so it is written with the
 * literal-interpolation form `{'{'}`.
 */
export default {
  // ── Search ──────────────────────────────────────────────────────
  name: '名称',
  namePlaceholder: '请输入名称',
  jobGroup: '任务分组',
  status: '状态',
  statusPlaceholder: '任务状态',
  log: '日志',

  // ── Columns ─────────────────────────────────────────────────────
  jobId: '编码',
  group: '分组',
  cronExpression: 'cron 表达式',
  invokeTarget: '调用目标',

  /** The invoke-target column's hover card. */
  peekArgs: '参数：{value}',
  peekJobType: '调用类型：{value}',
  peekMisfire: '执行策略：{value}',
  peekConcurrent: '并发：{value}',
  none: '无',

  jobTypeApi: '接口',
  jobTypeFunc: '函数',
  allow: '允许',
  forbid: '禁止',

  // ── Row actions ─────────────────────────────────────────────────
  start: '启动',
  stop: '停止',
  deleteTitle: '删除任务：{name}',

  // ── Create / edit ───────────────────────────────────────────────
  addTitle: '添加任务',
  editTitle: '修改任务',
  selectPlaceholder: '请选择',
  invokeTargetTip: "调用示例：func (t *EXEC) ExamplesNoParam(){'{'}..{'}'} 填写 ExamplesNoParam 即可；目前不支持带参调用",
  args: '目标参数',
  argsTip: '有参：请以 string 格式填写；无参：留空。目前仅支持函数调用',
  concurrent: '是否并发',
  jobType: '调用类型',
  misfirePolicy: '执行策略',
  misfire: {
    immediate: '立即执行',
    once: '执行一次',
    skip: '放弃执行'
  },

  // ── Confirmations ───────────────────────────────────────────────
  deleteConfirm: '确认删除选中的 {count} 个任务？',
  startConfirm: '确认启动任务「{name}」？',
  stopConfirm: '确认停止任务「{name}」？',
  startSuccess: '启动成功',
  stopSuccess: '停止成功',

  rules: {
    jobName: '名称不能为空',
    jobGroup: '任务分组不能为空',
    invokeTarget: '调用目标不能为空',
    cronExpression: 'cron 表达式不能为空'
  },

  // ── The live log page ───────────────────────────────────────────
  jobLog: {
    connecting: '连接中',
    open: '已连接',
    closed: '已断开',
    lines: '{count} 行',
    clear: '清空',
    reconnect: '重连',
    waiting: '已连接，等待任务输出…',
    disconnected: '未连接'
  }
}
