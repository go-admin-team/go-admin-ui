export default {
  name: 'Name',
  namePlaceholder: 'Please enter name',
  jobGroup: 'Task Group',
  status: 'Status',
  statusPlaceholder: 'Task status',
  log: 'Log',

  jobId: 'ID',
  group: 'Group',
  cronExpression: 'Cron Expression',
  invokeTarget: 'Invoke Target',

  // 参数 is the glossary's 'Parameter', but that entry covers the system
  // parameter store. These are a Go function's arguments, so 'Args' -- the same
  // word the field itself uses.
  peekArgs: 'Args: {value}',
  peekJobType: 'Invoke type: {value}',
  peekMisfire: 'Misfire policy: {value}',
  peekConcurrent: 'Concurrent: {value}',
  none: 'None',

  jobTypeApi: 'API',
  jobTypeFunc: 'Function',
  allow: 'Allow',
  forbid: 'Forbid',

  start: 'Start',
  stop: 'Stop',
  deleteTitle: 'Delete task: {name}',

  addTitle: 'Add Task',
  editTitle: 'Edit Task',
  selectPlaceholder: 'Please select',
  invokeTargetTip: "For example: func (t *EXEC) ExamplesNoParam(){'{'}..{'}'} -- enter ExamplesNoParam. Calling with arguments is not supported yet.",
  args: 'Target Args',
  argsTip: 'With arguments: enter them as a string. Without: leave it empty. Only function calls are supported for now.',
  concurrent: 'Concurrent',
  jobType: 'Invoke Type',
  // 执行策略 literally reads 'execution policy', but the three options only
  // describe what happens to a run the scheduler missed, which is what every
  // cron library calls a misfire
  misfirePolicy: 'Misfire Policy',
  misfire: {
    immediate: 'Run Immediately',
    once: 'Run Once',
    skip: 'Skip'
  },

  deleteConfirm: 'Delete the selected task? | Delete the {count} selected tasks?',
  startConfirm: 'Start the task "{name}"?',
  stopConfirm: 'Stop the task "{name}"?',
  startSuccess: 'Started successfully',
  stopSuccess: 'Stopped successfully',

  rules: {
    jobName: 'Name is required',
    jobGroup: 'Task group is required',
    invokeTarget: 'Invoke target is required',
    cronExpression: 'Cron expression is required'
  },

  jobLog: {
    connecting: 'Connecting',
    open: 'Connected',
    closed: 'Disconnected',
    lines: '{count} line | {count} lines',
    clear: 'Clear',
    reconnect: 'Reconnect',
    waiting: 'Connected, waiting for task output…',
    disconnected: 'Not connected'
  }
}
