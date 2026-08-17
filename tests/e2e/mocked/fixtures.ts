import { Page, BrowserContext } from '@playwright/test';

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

export const ADMIN_TOKEN = 'e2e-fake-token';

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
      'admin:sysUser:resetPassword'
    ]
  }
};

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
        }
      ]
    }
  ]
};

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
];

/** Tree served by GET /api/v1/deptTree */
export const deptTree = [
  {
    id: 1,
    label: '研发部',
    children: [{ id: 3, label: '前端组', children: [] }]
  },
  { id: 2, label: '测试部', children: [] }
];

/** Rows served by GET /api/v1/demo-product */
export const productRows = [
  { id: 1, name: 'Alpha', code: 'A-001', price: 10.5, status: '1', createdAt: '2026-08-01T10:00:00Z' },
  { id: 2, name: 'Beta', code: 'B-002', price: 20, status: '2', createdAt: '2026-08-02T10:00:00Z' }
];

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
  }]);
}

/**
 * Stubs every backend call the app shell makes. Counters are returned so tests
 * can assert on request volume, which is how keep-alive caching is detected:
 * a cached page does not re-run its created() hook and therefore issues no
 * second list request.
 */
export async function installApiMocks(page: Page) {
  const calls = {
    getinfo: 0,
    menurole: 0,
    productList: 0,
    userList: 0,
    userCreate: 0,
    userUpdate: 0,
    userDelete: 0,
    passwordReset: 0,
    /** Query string of each GET /api/v1/sys-user, in order. */
    userListQueries: [] as string[]
  };

  /** Milliseconds to hold a write open, so a test can submit again mid-flight. */
  const delays = { userWrite: 0, passwordReset: 0 };

  const json = (body: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });

  // Registered FIRST on purpose: Playwright matches routes in reverse
  // registration order, so this catch-all must go in before the specific
  // handlers below or it would swallow every request.
  // Settings and dictionary lookups are incidental to these tests; answering
  // them with an empty payload keeps nothing waiting on the network.
  await page.route('**/api/v1/**', async route => {
    await route.fulfill(json({ code: 200, data: {} }));
  });

  await page.route('**/api/v1/getinfo*', async route => {
    calls.getinfo++;
    await route.fulfill(json(userInfo));
  });

  await page.route('**/api/v1/menurole*', async route => {
    calls.menurole++;
    await route.fulfill(json(menuTree));
  });

  await page.route('**/api/v1/demo-product*', async route => {
    if (route.request().method() === 'GET') {
      calls.productList++;
      await route.fulfill(json({ code: 200, data: { list: productRows, count: productRows.length } }));
      return;
    }
    await route.fulfill(json({ code: 200, msg: 'ok' }));
  });

  // ── sys-user ────────────────────────────────────────────────────
  await page.route('**/api/v1/dict-data/option-select*', async route => {
    const dictType = new URL(route.request().url()).searchParams.get('dictType');
    const data = dictType === 'sys_user_sex'
      ? [{ label: '男', value: '0' }, { label: '女', value: '1' }]
      : [{ label: '停用', value: '1' }, { label: '正常', value: '2' }];
    await route.fulfill(json({ code: 200, data }));
  });

  await page.route('**/api/v1/deptTree*', async route => {
    await route.fulfill(json({ code: 200, data: deptTree }));
  });

  await page.route('**/api/v1/post*', async route => {
    await route.fulfill(json({
      code: 200,
      data: { list: [{ postId: 1, postName: '工程师', status: '2' }], count: 1 }
    }));
  });

  await page.route('**/api/v1/role*', async route => {
    await route.fulfill(json({
      code: 200,
      data: { list: [{ roleId: 1, roleName: '管理员', status: '2' }], count: 1 }
    }));
  });

  await page.route('**/api/v1/configKey/**', async route => {
    await route.fulfill(json({ code: 200, data: { configValue: 'Init@123' } }));
  });

  await page.route('**/api/v1/sys-user*', async route => {
    const request = route.request();
    const method = request.method();

    if (method === 'GET') {
      calls.userList++;
      calls.userListQueries.push(new URL(request.url()).search);
      await route.fulfill(json({ code: 200, data: { list: userRows, count: userRows.length } }));
      return;
    }

    if (method === 'POST') calls.userCreate++;
    if (method === 'PUT') calls.userUpdate++;
    if (method === 'DELETE') calls.userDelete++;

    // Held open so a test can click the confirm button again while the first
    // submit is still in flight -- the situation the submit guard exists for.
    if (delays.userWrite) {
      await new Promise(resolve => setTimeout(resolve, delays.userWrite));
    }
    await route.fulfill(json({ code: 200, msg: 'ok' }));
  });

  await page.route('**/api/v1/user/pwd/reset*', async route => {
    calls.passwordReset++;
    if (delays.passwordReset) {
      await new Promise(resolve => setTimeout(resolve, delays.passwordReset));
    }
    await route.fulfill(json({ code: 200, msg: 'ok' }));
  });

  // Registered after the list route because the two need separate globs: `*`
  // does not cross a `/`, so `sys-user*` never matches `sys-user/2`.
  await page.route('**/api/v1/sys-user/*', async route => {
    const userId = Number(route.request().url().split('/').pop());
    const row = userRows.find(user => user.userId === userId) ?? userRows[0];
    // The detail endpoint returns fields the list omits
    await route.fulfill(json({ code: 200, data: { ...row, remark: '来自详情接口' } }));
  });

  return { calls, delays };
}
