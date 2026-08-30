/**
 * Dictionary text, keyed by what the backend already stores in English.
 *
 * `values` is keyed dict_type -> dict_value, `types` by dict_type. Both keys
 * are backend identifiers (sys_user_sex, DEFAULT, Y) rather than the Chinese
 * label, so a label edit in the admin UI cannot break a lookup.
 *
 * Generated against go-admin/config/db.sql: 33 values across 11 types. Verified
 * that no dict_value contains a dot -- lang/backend.ts looks these up by plain
 * object access rather than vue-i18n's dotted paths, so a dot would be
 * harmless, but it is worth knowing the seed data is clean.
 *
 * Note the three ways Chinese says "not normal" -- 停用 / 关闭 / 禁用 -- which
 * are translated faithfully rather than unified. Unifying the English while the
 * Chinese stays split would make the two sides stop corresponding.
 */
export default {
  values: {
    sys_normal_disable: {
      '2': 'Normal', // 正常
      '1': 'Disabled' // 停用
    },
    sys_user_sex: {
      '0': 'Male', // 男
      '1': 'Female', // 女
      '2': 'Unknown' // 未知
    },
    sys_show_hide: {
      '0': 'Show', // 显示
      '1': 'Hide' // 隐藏
    },
    sys_yes_no: {
      Y: 'Yes', // 是
      N: 'No' // 否
    },
    sys_job_status: {
      '2': 'Normal', // 正常
      '1': 'Disabled' // 停用
    },
    sys_job_group: {
      DEFAULT: 'Default', // 默认
      SYSTEM: 'System' // 系统
    },
    sys_notice_type: {
      '1': 'Notification', // 通知
      '2': 'Announcement' // 公告
    },
    sys_common_status: {
      '2': 'Normal', // 正常
      '1': 'Closed' // 关闭
    },
    sys_oper_type: {
      '1': 'Add', // 新增
      '2': 'Edit', // 修改
      '3': 'Delete', // 删除
      '4': 'Authorize', // 授权
      '5': 'Export', // 导出
      '6': 'Import', // 导入
      '7': 'Force Logout', // 强退
      '8': 'Generate Code', // 生成代码
      '9': 'Clear Data', // 清空数据
      '10': 'Login', // 登录
      '11': 'Logout', // 退出
      '12': 'Get Captcha' // 获取验证码
    },
    sys_notice_status: {
      '0': 'Success', // 成功
      '1': 'Failure' // 失败
    },
    sys_content_status: {
      '1': 'Normal', // 正常
      '2': 'Banned' // 禁用
    }
  },
  types: {
    sys_normal_disable: 'System Switch', // 系统开关
    sys_user_sex: 'User Gender', // 用户性别
    sys_show_hide: 'Menu Visibility', // 菜单状态
    sys_yes_no: 'Yes / No', // 系统是否
    sys_job_status: 'Task Status', // 任务状态
    sys_job_group: 'Task Group', // 任务分组
    sys_notice_type: 'Notice Type', // 通知类型
    sys_common_status: 'System Status', // 系统状态
    sys_oper_type: 'Operation Type', // 操作类型
    sys_notice_status: 'Notice Status', // 通知状态
    sys_content_status: 'Content Status' // 内容状态
  }
}
