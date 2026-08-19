import { Page, BrowserContext } from '@playwright/test'
import { mockCrud, json } from './support/crud'

/**
 * Fixtures for the mock-driven e2e suite.
 *
 * The pre-existing specs under tests/e2e require a live Go backend plus a
 * hand-obtained JWT, which means they cannot run unattended and never guarded
 * anything in CI. These fixtures stub the API at the network layer instead, so
 * the suite exercises the real router, the real dynamic-route generation and
 * the real keep-alive wiring while depending on nothing outside the repo.
 *
 * What is verified here is front-end behaviour under a known-good API contract
 * -- exactly what the Composition API / Pinia migration is at risk of breaking.
 */

export const ADMIN_TOKEN = 'e2e-fake-token'

/** Shape returned by GET /api/v1/getinfo */
export const userInfo = {
  code: 200,
  data: {
    roles: ['admin'],
    name: 'e2e-admin',
    avatar: 'http://localhost/avatar.png',
    introduction: 'end to end test user',
    permissions: [
      'demo:product:add',
      'demo:product:edit',
      // 'demo:product:delete' is intentionally absent: it proves that
      // v-permisaction actually hides the delete button.
      'admin:sysUser:add',
      'admin:sysUser:edit',
      'admin:sysUser:remove',
      'admin:sysUser:resetPassword',
      'admin:sysDept:add',
      'admin:sysDept:edit',
      'admin:sysDept:remove',
      'admin:sysPost:add',
      'admin:sysPost:edit',
      'admin:sysPost:remove',
      'admin:sysPost:export',
      'admin:sysRole:add',
      'admin:sysRole:edit',
      'admin:sysRole:update',
      'admin:sysRole:remove',
      'admin:sysConfig:add',
      'admin:sysConfig:edit',
      'admin:sysConfig:remove',
      'admin:sysMenu:add',
      'admin:sysMenu:edit',
      'admin:sysMenu:remove',
      'admin:sysLoginLog:remove',
      'admin:sysOperLog:query',
      'admin:sysOperLog:remove',
      'admin:sysDictType:add',
      'admin:sysDictType:edit',
      'admin:sysDictType:remove',
      'admin:sysDictData:add',
      'admin:sysDictData:edit',
      'admin:sysDictData:remove',
      'admin:sysApi:edit',
      'admin:sysConfigSet:list',
      'job:sysJob:add',
      'job:sysJob:edit',
      'job:sysJob:remove',
      'job:sysJob:start',
      'job:sysJob:log'
    ]
  }
}

/**
 * Shape returned by GET /api/v1/menurole.
 *
 * `visible: '0'` means shown -- the flag is inverted and compared loosely in
 * generaMenu, so anything else hides the entry.
 */
export const menuTree = {
  code: 200,
  data: [
    {
      path: '/demo',
      component: 'Layout',
      visible: '0',
      menuName: 'DemoRoot',
      title: 'Demo',
      icon: 'star',
      noCache: false,
      children: [
        {
          path: 'product',
          component: '/demo/product/index',
          visible: '0',
          // Must match the component name for keep-alive to cache the page
          menuName: 'DemoProduct',
          title: 'Product',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'second',
          component: '/demo/product/index',
          visible: '0',
          menuName: 'DemoSecond',
          title: 'Second',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'renamed',
          component: '/demo/product/index',
          visible: '0',
          // Deliberately NOT the component's own name ('DemoProduct'). This is
          // what happens when someone renames a menu entry in the admin UI:
          // cachedViews then holds a name no component answers to, and
          // loadView()'s runtime override is the only thing keeping the page
          // cacheable. With that override removed this menu stops caching.
          menuName: 'DemoRenamedInAdminUi',
          title: 'Renamed',
          icon: 'star',
          noCache: false,
          children: null
        }
      ]
    },
    {
      path: '/dev-tools',
      component: 'Layout',
      visible: '0',
      menuName: 'Tools',
      title: 'Tools',
      icon: 'star',
      noCache: false,
      children: [
        {
          path: 'gen',
          component: '/dev-tools/gen/index',
          visible: '0',
          menuName: 'Gen',
          title: 'Gen',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'editTable',
          component: '/dev-tools/gen/editTable',
          visible: '1',
          menuName: 'EditTable',
          title: 'EditTable',
          icon: 'star',
          noCache: false,
          children: null
        }
      ]
    },
    {
      path: '/schedule',
      component: 'Layout',
      visible: '0',
      menuName: 'Schedule',
      title: 'Schedule',
      icon: 'star',
      noCache: false,
      children: [
        {
          path: 'manage',
          component: '/schedule/index',
          visible: '0',
          menuName: 'ScheduleManage',
          title: 'Jobs',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          // Reached from the 日志 button rather than the sidebar, which is why
          // the seed hides it -- and why its route name has to be right
          path: 'log',
          component: '/schedule/log',
          visible: '1',
          menuName: 'JobLog',
          title: 'JobLog',
          icon: 'star',
          noCache: false,
          children: null
        }
      ]
    },
    {
      path: '/admin',
      component: 'Layout',
      visible: '0',
      menuName: 'AdminRoot',
      title: 'Admin',
      icon: 'star',
      noCache: false,
      children: [
        {
          path: 'sys-user',
          component: '/admin/sys-user/index',
          visible: '0',
          menuName: 'SysUserManage',
          title: 'User',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-dept',
          component: '/admin/sys-dept/index',
          visible: '0',
          menuName: 'SysDeptManage',
          title: 'Dept',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-post',
          component: '/admin/sys-post/index',
          visible: '0',
          menuName: 'SysPostManage',
          title: 'Post',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-role',
          component: '/admin/sys-role/index',
          visible: '0',
          menuName: 'SysRoleManage',
          title: 'Role',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-config',
          component: '/admin/sys-config/index',
          visible: '0',
          menuName: 'SysConfigManage',
          title: 'Config',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-menu',
          component: '/admin/sys-menu/index',
          visible: '0',
          menuName: 'SysMenuManage',
          title: 'Menu',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-config/set',
          component: '/admin/sys-config/set',
          visible: '0',
          menuName: 'SysConfigSet',
          title: 'ConfigSet',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-api',
          component: '/admin/sys-api/index',
          visible: '0',
          menuName: 'SysApiManage',
          title: 'Api',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'dict',
          component: '/admin/dict/index',
          visible: '0',
          menuName: 'Dict',
          title: 'Dict',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'dict/data/:dictId',
          component: '/admin/dict/data',
          visible: '1',
          menuName: 'SysDictDataManage',
          title: 'DictData',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-login-log',
          component: '/admin/sys-login-log/index',
          visible: '0',
          menuName: 'SysLoginLogManage',
          title: 'LoginLog',
          icon: 'star',
          noCache: false,
          children: null
        },
        {
          path: 'sys-oper-log',
          component: '/admin/sys-oper-log/index',
          visible: '0',
          menuName: 'OperLog',
          title: 'OperLog',
          icon: 'star',
          noCache: false,
          children: null
        }
      ]
    }
  ]
}

/** Rows served by GET /api/v1/sys-user */
export const userRows = [
  {
    userId: 1,
    username: 'admin',
    nickName: '超级管理员',
    phone: '13800000001',
    email: 'admin@example.com',
    sex: '0',
    status: '2',
    deptId: 1,
    dept: { deptId: 1, deptName: '研发部' },
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    userId: 2,
    username: 'tester',
    nickName: '测试员',
    phone: '13800000002',
    email: 'tester@example.com',
    sex: '1',
    status: '1',
    deptId: 2,
    dept: { deptId: 2, deptName: '测试部' },
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/**
 * Tree served by GET /api/v1/dept -- the whole collection in one body, with no
 * `list`/`count` envelope and no paging. This is the shape `paginated: false`
 * exists for.
 */
export const deptRows = [
  {
    deptId: 1,
    parentId: 0,
    deptName: '研发部',
    sort: 1,
    leader: '张三',
    phone: '13800000001',
    email: 'rd@example.com',
    status: 2,
    createdAt: '2026-08-01T10:00:00Z',
    children: [
      {
        deptId: 3,
        parentId: 1,
        deptName: '前端组',
        sort: 1,
        leader: '李四',
        phone: '13800000003',
        email: 'fe@example.com',
        status: 2,
        createdAt: '2026-08-03T10:00:00Z',
        children: []
      }
    ]
  },
  {
    deptId: 2,
    parentId: 0,
    deptName: '测试部',
    sort: 2,
    leader: '王五',
    phone: '13800000002',
    email: 'qa@example.com',
    status: 1,
    createdAt: '2026-08-02T10:00:00Z',
    children: []
  }
]

/** Rows served by GET /api/v1/sys/tables/page -- the generator's own configs. */
export const genTableRows = [
  {
    tableId: 1,
    tableName: 'sys_demo',
    tableComment: '演示表',
    className: 'SysDemo',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    tableId: 2,
    tableName: 'sys_widget',
    tableComment: '组件表',
    className: 'SysWidget',
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/** The columns of a generated table, as the detail endpoint nests them. */
export const genColumnRows = [
  {
    columnId: 1,
    columnName: 'name',
    columnComment: '名称',
    columnType: 'varchar(128)',
    goType: 'string',
    goField: 'Name',
    jsonField: 'name',
    isInsert: '1',
    isEdit: '1',
    isList: '1',
    isQuery: '1',
    isRequired: '1',
    queryType: 'LIKE',
    htmlType: 'input',
    dictType: '',
    fkTableName: '',
    fkLabelId: '',
    fkLabelName: ''
  },
  {
    columnId: 2,
    columnName: 'status',
    columnComment: '状态',
    columnType: 'tinyint',
    goType: 'int',
    goField: 'Status',
    jsonField: 'status',
    isInsert: '1',
    isEdit: '1',
    isList: '0',
    isQuery: '0',
    isRequired: '0',
    queryType: 'EQ',
    htmlType: 'select',
    dictType: 'sys_common_status',
    fkTableName: '',
    fkLabelId: '',
    fkLabelName: ''
  }
]

/** Rows served by GET /api/v1/db/tables/page -- what the database actually has. */
export const dbTableRows = [
  {
    tableName: 'sys_order',
    tableComment: '订单',
    createTime: '2026-07-01 10:00:00',
    updateTime: '2026-07-20 10:00:00'
  },
  {
    tableName: 'sys_invoice',
    tableComment: '发票',
    createTime: '2026-07-02 10:00:00',
    updateTime: '2026-07-21 10:00:00'
  }
]

/**
 * Rows served by GET /api/v1/sysjob. One job running (entry_id non-zero), one
 * scheduled but stopped (entry_id 0), one disabled -- the three states the
 * action column branches on.
 */
export const jobRows = [
  {
    jobId: 1,
    jobName: '清理过期日志',
    jobGroup: 'DEFAULT',
    jobType: 2,
    cronExpression: '0 0 2 * * ?',
    invokeTarget: 'ExamplesNoParam',
    args: '',
    misfirePolicy: 1,
    concurrent: 0,
    status: 2,
    entry_id: 7
  },
  {
    jobId: 2,
    jobName: '同步用户',
    jobGroup: 'SYSTEM',
    jobType: 2,
    cronExpression: '0 */5 * * * ?',
    invokeTarget: 'SyncUsers',
    args: 'full',
    misfirePolicy: 2,
    concurrent: 1,
    status: 2,
    entry_id: 0
  },
  {
    jobId: 3,
    jobName: '已停用的任务',
    jobGroup: 'DEFAULT',
    jobType: 1,
    cronExpression: '0 0 1 * * ?',
    invokeTarget: 'Disabled',
    args: '',
    misfirePolicy: 3,
    concurrent: 0,
    status: 1,
    entry_id: 0
  }
]

/**
 * Rows served by GET /api/v1/sys-api. One SYS route (infrastructure, not
 * grantable), one BUS route, and one with no title -- the page draws all three
 * differently.
 */
export const sysApiRows = [
  {
    id: 10,
    handle: 'go-admin/app/admin/apis.SysUser.GetPage-fm',
    title: '用户列表',
    path: '/api/v1/sys-user',
    action: 'GET',
    type: 'BUS',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 11,
    handle: 'go-admin/app/admin/apis.SysMenu.Delete-fm',
    title: '菜单删除',
    path: '/api/v1/menu',
    action: 'DELETE',
    type: 'SYS',
    createdAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 12,
    handle: 'go-admin/app/admin/apis.Unnamed-fm',
    title: '',
    path: '/api/v1/unnamed',
    action: 'POST',
    type: 'BUS',
    createdAt: '2026-08-03T10:00:00Z'
  }
]

/** Rows served by GET /api/v1/dict/type */
export const dictTypeRows = [
  {
    id: 1,
    dictName: '系统状态',
    dictType: 'sys_common_status',
    status: 2,
    remark: '正常/关闭',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 2,
    dictName: '用户性别',
    dictType: 'sys_user_sex',
    status: 2,
    remark: '男/女',
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/** Rows served by GET /api/v1/dict/data */
export const dictDataRows = [
  {
    dictCode: 11,
    dictSort: 1,
    dictLabel: '正常',
    dictValue: '2',
    dictType: 'sys_common_status',
    status: 2,
    remark: '正常状态',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    dictCode: 12,
    dictSort: 2,
    dictLabel: '关闭',
    dictValue: '1',
    dictType: 'sys_common_status',
    status: 1,
    remark: '关闭状态',
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/** Rows served by GET /api/v1/sys-login-log */
export const loginLogRows = [
  {
    id: 1,
    username: 'admin',
    ipaddr: '192.168.1.10',
    loginLocation: '内网',
    browser: 'Chrome',
    os: 'macOS',
    platform: 'Mac',
    status: '2',
    msg: '登录成功',
    loginTime: '2026-08-03T09:00:00Z',
    createdAt: '2026-08-03T09:00:00Z'
  },
  {
    id: 2,
    username: 'tester',
    ipaddr: '192.168.1.11',
    loginLocation: '内网',
    browser: 'Firefox',
    os: 'Windows',
    status: '1',
    msg: '密码错误',
    loginTime: '2026-08-02T09:00:00Z'
  }
]

/** Rows served by GET /api/v1/sys-opera-log */
export const operLogRows = [
  {
    id: 1,
    operName: 'admin',
    requestMethod: 'POST',
    operUrl: '/api/v1/sys-user',
    operIp: '192.168.1.10',
    operLocation: '内网',
    latencyTime: '12ms',
    operParam: '{"username":"newbie"}',
    jsonResult: '{"code":200}',
    status: '2',
    operTime: '2026-08-03T10:00:00Z'
  },
  {
    id: 2,
    operName: 'tester',
    requestMethod: 'DELETE',
    operUrl: '/api/v1/post',
    operIp: '192.168.1.11',
    operLocation: '内网',
    latencyTime: '8ms',
    operParam: '{"ids":[3]}',
    jsonResult: '{"code":500}',
    status: '1',
    operTime: '2026-08-02T10:00:00Z'
  }
]

/**
 * Rows served by GET /api/v1/menu -- the whole tree, like the department one.
 *
 * `sysApi` is the expanded form of `apis`: the backend routes this menu grants.
 * The 权限标识 column shows it in a popover.
 */
export const menuRows = [
  {
    menuId: 1,
    parentId: 0,
    title: '系统管理',
    menuName: 'SystemRoot',
    menuType: 'M',
    path: '/admin',
    component: 'Layout',
    icon: 'setting',
    sort: 1,
    visible: '0',
    permission: '',
    apis: [] as number[],
    sysApi: [] as Array<Record<string, unknown>>,
    createdAt: '2026-08-01T10:00:00Z',
    children: [
      {
        menuId: 2,
        parentId: 1,
        title: '用户管理',
        menuName: 'SysUserManage',
        menuType: 'C',
        path: 'sys-user',
        component: '/admin/sys-user/index',
        icon: 'user',
        sort: 1,
        visible: '0',
        permission: 'admin:sysUser:list',
        apis: [10],
        sysApi: [{ id: 10, title: '用户列表', path: '/api/v1/sys-user', action: 'GET', type: 'BUS' }],
        createdAt: '2026-08-02T10:00:00Z',
        children: []
      },
      {
        menuId: 3,
        parentId: 2,
        title: '用户新增',
        menuName: '',
        menuType: 'F',
        path: '',
        component: '',
        icon: '',
        sort: 2,
        visible: '0',
        permission: 'admin:sysUser:add',
        apis: [] as number[],
        sysApi: [] as Array<Record<string, unknown>>,
        createdAt: '2026-08-03T10:00:00Z',
        children: []
      }
    ]
  }
]

/**
 * Rows served by GET /api/v1/config.
 *
 * The primary key is `id`, not `configId` -- worth stating, because the page's
 * export used to project the latter and wrote an empty column for it.
 */
export const configRows = [
  {
    id: 1,
    configName: '初始密码',
    configKey: 'sys_user_initPassword',
    configValue: 'Init@123',
    configType: 'Y',
    isFrontend: '2',
    remark: '新建用户的默认密码',
    createdAt: '2026-08-02T10:00:00Z'
  },
  {
    id: 2,
    configName: '应用名称',
    configKey: 'sys_app_name',
    configValue: 'go-admin',
    configType: 'N',
    isFrontend: '1',
    remark: '',
    createdAt: '2026-08-01T10:00:00Z'
  }
]

/** Rows served by GET /api/v1/role */
export const roleRows = [
  {
    roleId: 1,
    roleName: '系统管理员',
    roleKey: 'admin',
    roleSort: 1,
    dataScope: '1',
    status: '2',
    remark: '',
    menuIds: [1, 2],
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    roleId: 2,
    roleName: '普通角色',
    roleKey: 'common',
    roleSort: 2,
    dataScope: '2',
    status: '1',
    remark: '',
    menuIds: [1],
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/** Rows served by GET /api/v1/post */
export const postRows = [
  {
    postId: 1,
    postCode: 'ceo',
    postName: '董事长',
    sort: 1,
    status: 2,
    remark: '',
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    postId: 2,
    postCode: 'dev',
    postName: '开发工程师',
    sort: 2,
    status: 1,
    remark: '',
    createdAt: '2026-08-02T10:00:00Z'
  }
]

/** Tree served by GET /api/v1/deptTree */
export const deptTree = [
  {
    id: 1,
    label: '研发部',
    children: [{ id: 3, label: '前端组', children: [] }]
  },
  { id: 2, label: '测试部', children: [] }
]

/** Rows served by GET /api/v1/demo-product */
export const productRows = [
  { id: 1, name: 'Alpha', code: 'A-001', price: 10.5, status: '1', createdAt: '2026-08-01T10:00:00Z' },
  { id: 2, name: 'Beta', code: 'B-002', price: 20, status: '2', createdAt: '2026-08-02T10:00:00Z' }
]

/** Injects the auth cookie so the router guard treats the session as signed in. */
export async function authenticate(context: BrowserContext) {
  await context.addCookies([{
    name: 'Admin-Token',
    value: ADMIN_TOKEN,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax'
  }])
}

/**
 * Stubs every backend call the app shell makes, plus one mock per resource.
 *
 * Resources are composed from mockCrud rather than written out here, so adding a
 * page means adding a line and its rows, not another block of routes whose glob
 * has to be checked against every earlier one.
 *
 * The counters are grouped by resource -- `calls.post.list`, not
 * `calls.postList`. Endpoints that are not CRUD (the password reset, the role's
 * data scope) keep their own entries under `calls.extra`.
 */
export async function installApiMocks(page: Page) {
  const extra = { getinfo: 0, menurole: 0, passwordReset: 0, roleDataScope: 0, operLogClean: 0, jobStarts: 0, jobStops: 0, tableImports: 0, tableImportBody: '', tableDeletes: 0, tableDeleteUrl: '', genTableList: 0, generated: [] as string[], setConfigSaves: 0, setConfigBody: '' }

  /** Milliseconds to hold a write open, so a test can submit again mid-flight. */
  const delays = { userWrite: 0, passwordReset: 0 }

  // Registered FIRST on purpose: Playwright matches routes in reverse
  // registration order, so this catch-all must go in before anything else or it
  // would swallow every request. Settings and other incidental lookups are
  // answered with an empty payload so nothing waits on the network.
  await page.route('**/api/v1/**', async route => {
    await route.fulfill(json({ code: 200, data: {}}))
  })

  await page.route('**/api/v1/getinfo*', async route => {
    extra.getinfo++
    await route.fulfill(json(userInfo))
  })

  await page.route('**/api/v1/menurole*', async route => {
    extra.menurole++
    await route.fulfill(json(menuTree))
  })

  await page.route('**/api/v1/dict-data/option-select*', async route => {
    const dictType = new URL(route.request().url()).searchParams.get('dictType')
    // Labels follow the seed data in go-admin/config/db.sql -- sys_common_status
    // is 2=正常 / 1=关闭, which is not the same as sys_normal_disable's 停用.
    const DICTS: Record<string, Array<{ label: string, value: string }>> = {
      sys_user_sex: [{ label: '男', value: '0' }, { label: '女', value: '1' }],
      sys_yes_no: [{ label: '是', value: 'Y' }, { label: '否', value: 'N' }],
      sys_show_hide: [{ label: '显示', value: '0' }, { label: '隐藏', value: '1' }],
      sys_common_status: [{ label: '正常', value: '2' }, { label: '关闭', value: '1' }],
      sys_job_status: [{ label: '正常', value: '2' }, { label: '停用', value: '1' }],
      sys_job_group: [{ label: '默认', value: 'DEFAULT' }, { label: '系统', value: 'SYSTEM' }]
    }
    const data = DICTS[dictType ?? ''] ?? [{ label: '停用', value: '1' }, { label: '正常', value: '2' }]
    await route.fulfill(json({ code: 200, data }))
  })

  // The generator does not sit on one REST base -- its list is /sys/tables/page
  // while its record is /sys/tables/info/:id -- so these are spelled out rather
  // than going through mockCrud.
  await page.route('**/api/v1/sys/tables/page*', async route => {
    extra.genTableList++
    await route.fulfill(json({
      code: 200,
      data: { list: genTableRows, count: genTableRows.length }
    }))
  })

  await page.route('**/api/v1/db/tables/page*', async route => {
    await route.fulfill(json({
      code: 200,
      data: { list: dbTableRows, count: dbTableRows.length }
    }))
  })

  await page.route('**/api/v1/sys/tables/info', async route => {
    if (route.request().method() === 'POST') {
      extra.tableImports++
      extra.tableImportBody = route.request().postData() ?? ''
      await route.fulfill(json({ code: 200, msg: '导入成功', data: null }))
      return
    }
    await route.fulfill(json({ code: 200, data: null }))
  })

  await page.route('**/api/v1/sys/tables/info/*', async route => {
    if (route.request().method() === 'DELETE') {
      extra.tableDeletes++
      extra.tableDeleteUrl = route.request().url()
      await route.fulfill(json({ code: 200, msg: '删除成功', data: null }))
      return
    }
    // The detail response nests: the record under `info`, its columns under
    // `list` -- not the flat shape the list endpoint returns.
    await route.fulfill(json({
      code: 200,
      data: {
        info: {
          ...genTableRows[0],
          functionAuthor: 'wenjian',
          packageName: 'admin',
          moduleName: 'sys-demo',
          businessName: 'sysDemo',
          functionName: '演示',
          tplCategory: 'crud',
          isDataScope: false,
          isActions: true,
          isAuth: true
        },
        list: genColumnRows
      }
    }))
  })

  await page.route('**/api/v1/gen/tabletree*', async route => {
    await route.fulfill(json({ code: 200, data: [] }))
  })

  await page.route('**/api/v1/dict/type-option-select*', async route => {
    await route.fulfill(json({ code: 200, data: dictTypeRows }))
  })

  for (const action of ['toproject', 'todb', 'apitofile']) {
    await page.route(`**/api/v1/gen/${action}/*`, async route => {
      extra.generated.push(action)
      await route.fulfill(json({ code: 200, msg: '已生成', data: null }))
    })
  }

  await page.route('**/api/v1/gen/preview/*', async route => {
    await route.fulfill(json({
      code: 200,
      data: {
        'template/api.go.template': 'package apis\n\nfunc (e SysDemo) GetPage() {}',
        'template/model.go.template': 'package models\n\ntype SysDemo struct{}'
      }
    }))
  })

  await page.route('**/api/v1/job/start/*', async route => {
    extra.jobStarts++
    await route.fulfill(json({ code: 200, msg: '启动成功', data: null }))
  })

  await page.route('**/api/v1/job/remove/*', async route => {
    extra.jobStops++
    await route.fulfill(json({ code: 200, msg: '停止成功', data: null }))
  })

  await page.route('**/api/v1/set-config*', async route => {
    if (route.request().method() === 'PUT') {
      extra.setConfigSaves++
      extra.setConfigBody = route.request().postData() ?? ''
      await route.fulfill(json({ code: 200, msg: '保存成功', data: null }))
      return
    }
    await route.fulfill(json({
      code: 200,
      data: {
        sys_app_name: 'go-admin',
        sys_app_logo: '',
        sys_user_initPassword: 'Init@123',
        sys_index_skinName: 'skin-blue'
        // sys_index_sideTheme deliberately absent
      }
    }))
  })

  await page.route('**/api/v1/configKey/**', async route => {
    await route.fulfill(json({ code: 200, data: { configValue: 'Init@123' }}))
  })

  await page.route('**/api/v1/deptTree*', async route => {
    await route.fulfill(json({ code: 200, data: deptTree }))
  })

  await page.route('**/api/v1/roleMenuTreeselect/*', async route => {
    await route.fulfill(json({
      code: 200,
      data: {
        menus: [{ id: 1, label: '系统管理', children: [{ id: 2, label: '用户管理', children: [] }] }],
        checkedKeys: [2]
      }
    }))
  })

  await page.route('**/api/v1/roleDeptTreeselect/*', async route => {
    await route.fulfill(json({ code: 200, data: { depts: deptTree, checkedKeys: [1] }}))
  })

  await page.route('**/api/v1/operlog/clean*', async route => {
    extra.operLogClean++
    await route.fulfill(json({ code: 200, msg: 'ok' }))
  })

  await page.route('**/api/v1/roledatascope*', async route => {
    extra.roleDataScope++
    await route.fulfill(json({ code: 200, msg: 'ok' }))
  })

  await page.route('**/api/v1/role-status*', async route => {
    await route.fulfill(json({ code: 200, msg: 'ok' }))
  })

  await page.route('**/api/v1/user/pwd/reset*', async route => {
    extra.passwordReset++
    if (delays.passwordReset) {
      await new Promise(resolve => setTimeout(resolve, delays.passwordReset))
    }
    await route.fulfill(json({ code: 200, msg: 'ok' }))
  })

  const calls = {
    extra,
    product: await mockCrud(page, { base: 'demo-product', rows: productRows, idKey: 'id' }),
    user: await mockCrud(page, {
      base: 'sys-user',
      rows: userRows,
      idKey: 'userId',
      // The detail endpoint returns fields the list omits
      detail: row => ({ ...row, remark: '来自详情接口' }),
      delays: { write: delays.userWrite }
    }),
    dept: await mockCrud(page, {
      base: 'dept',
      rows: deptRows,
      idKey: 'deptId',
      // /api/v1/dept answers with the whole tree, not a page
      paginated: false,
      childrenKey: 'children'
    }),
    post: await mockCrud(page, { base: 'post', rows: postRows, idKey: 'postId' }),
    role: await mockCrud(page, { base: 'role', rows: roleRows, idKey: 'roleId' }),
    config: await mockCrud(page, { base: 'config', rows: configRows, idKey: 'id' }),
    job: await mockCrud(page, {
      base: 'sysjob', rows: jobRows, idKey: 'jobId'
    }),
    sysApi: await mockCrud(page, {
      base: 'sys-api', rows: sysApiRows, idKey: 'id'
    }),
    dictType: await mockCrud(page, {
      base: 'dict/type', rows: dictTypeRows, idKey: 'id'
    }),
    dictData: await mockCrud(page, {
      base: 'dict/data', rows: dictDataRows, idKey: 'dictCode'
    }),
    loginLog: await mockCrud(page, {
      base: 'sys-login-log', rows: loginLogRows, idKey: 'id'
    }),
    operLog: await mockCrud(page, {
      base: 'sys-opera-log', rows: operLogRows, idKey: 'id'
    }),
    menu: await mockCrud(page, {
      base: 'menu',
      rows: menuRows,
      idKey: 'menuId',
      paginated: false,
      childrenKey: 'children'
    })
  }

  return { calls, delays }
}
