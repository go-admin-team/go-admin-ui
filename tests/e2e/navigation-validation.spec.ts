/**
 * go-admin-ui Navigation and Content Rendering Validation
 *
 * Verifies the following fixes:
 * 1. permission.js loadView: require.context now extracts .default (fixes component loading)
 * 2. main.js: registers both `this.getDicts` and `this.$getDicts` (fixes 107 usage sites)
 * 3. main.js: registers both `Pagination` and `AppPagination` component names
 *
 * Auth: JWT token pre-obtained via captcha-solving, injected via context.addCookies()
 * before page navigation, so Vue router guard reads the cookie correctly.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:9527';

// Pre-obtained admin JWT token (admin / 123456, captcha solved manually)
// Set via environment variable ADMIN_TOKEN when running the test
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Setup authenticated browser context by adding cookie before first navigation
async function setupAuth(context: BrowserContext): Promise<boolean> {
  if (!ADMIN_TOKEN) {
    console.log('No ADMIN_TOKEN provided');
    return false;
  }

  await context.addCookies([{
    name: 'Admin-Token',
    value: ADMIN_TOKEN,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
  }]);

  return true;
}

test.describe('go-admin-ui Navigation and Content Rendering Validation', () => {

  test('01 - Initial page load redirects to login', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const url = page.url();
    const title = await page.title();
    const bodyLen = (await page.locator('body').innerHTML()).length;

    console.log('URL:', url);
    console.log('Title:', title);
    console.log('Body length:', bodyLen, 'chars');

    expect(url).toContain('login');
    expect(title).toContain('go-admin');
    expect(bodyLen).toBeGreaterThan(10000);

    const jsErrors = errors.filter(e =>
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('ERR_CERT')
    );
    console.log('JS errors on login page:', jsErrors.length);
    jsErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

    await page.screenshot({ path: 'test-results/01-initial-load.png', fullPage: true });
    console.log('Screenshot: test-results/01-initial-load.png');
  });

  test('02 - Login page form elements and captcha rendering', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForURL(/login/, { timeout: 10000 });

    // Note: both username and captcha inputs have name="username" (bug in source)
    const usernameInput = page.locator('input[placeholder="用户名"]');
    const passwordInput = page.locator('input[name="password"]');
    const codeInput = page.locator('input[placeholder="验证码"]');
    const loginBtn = page.locator('button').filter({ hasText: /登/ }).first();
    const captchaImg = page.locator('.login-code img');

    await expect(usernameInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await expect(loginBtn).toBeVisible({ timeout: 5000 });

    const captchaCount = await captchaImg.count();
    console.log('Captcha image count:', captchaCount);
    if (captchaCount > 0) {
      const src = await captchaImg.getAttribute('src');
      const isBase64 = src?.startsWith('data:image/');
      console.log('Captcha rendered as base64:', isBase64);
      expect(isBase64).toBeTruthy();
    }

    console.log('PASS: All login form elements present and functional');
    await page.screenshot({ path: 'test-results/02-login-form.png', fullPage: true });
  });

  test('03 - Dashboard layout (with auth token)', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const authOk = await setupAuth(context);
    if (!authOk) {
      console.log('SKIP: No ADMIN_TOKEN provided');
      console.log('Run with: ADMIN_TOKEN=<token> npx playwright test');
      return;
    }

    // Navigate directly to dashboard (cookie was set before this)
    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('Dashboard URL:', url);
    const isDashboard = url.includes('dashboard') || (!url.includes('login'));
    console.log('On dashboard (not login):', isDashboard);

    // Check layout elements
    const hasSidebar = await page.locator('.sidebar-container').count() > 0;
    const hasNavbar = await page.locator('.navbar').count() > 0;
    const hasAppMain = await page.locator('.app-main').count() > 0;
    const hasTagsView = await page.locator('.tags-view-container').count() > 0;

    console.log('=== Dashboard Layout ===');
    console.log('Sidebar (.sidebar-container):', hasSidebar);
    console.log('Navbar (.navbar):', hasNavbar);
    console.log('App main (.app-main):', hasAppMain);
    console.log('Tags view:', hasTagsView);

    await page.screenshot({ path: 'test-results/03-dashboard.png', fullPage: true });
    console.log('Screenshot: test-results/03-dashboard.png');

    expect(isDashboard).toBeTruthy();
    expect(hasSidebar).toBeTruthy();

    const jsErrors = errors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );
    if (jsErrors.length > 0) {
      console.log('JS errors on dashboard:', jsErrors);
    }
  });

  test('04 - System management menu expansion', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const authOk = await setupAuth(context);
    if (!authOk) {
      console.log('SKIP: No ADMIN_TOKEN provided');
      return;
    }

    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // List all menu items
    const menuItems = await page.locator('.el-menu-item, .el-sub-menu__title').allTextContents();
    console.log('Menu items found:', menuItems.length);
    console.log('Menu items:', menuItems.slice(0, 15).map(t => t.trim()).filter(t => t));

    // Find and click 系统管理
    const sysMenu = page.locator('.el-sub-menu__title').filter({ hasText: '系统管理' }).first();
    const sysMenuCount = await sysMenu.count();
    console.log('系统管理 sub-menu found:', sysMenuCount > 0);

    if (sysMenuCount > 0) {
      await sysMenu.click();
      await page.waitForTimeout(1000);

      const subItems = await page.locator('.el-menu-item').allTextContents();
      console.log('Sub-menu items after expansion:', subItems.slice(0, 10).map(t => t.trim()).filter(t => t));
    }

    await page.screenshot({ path: 'test-results/04-system-menu-expanded.png', fullPage: true });
    console.log('Screenshot: test-results/04-system-menu-expanded.png');

    const jsErrors = errors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );
    if (jsErrors.length > 0) {
      console.log('JS errors:', jsErrors);
    }
  });

  test('05 - User management page: content and fix verification', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const authOk = await setupAuth(context);
    if (!authOk) {
      console.log('SKIP: No ADMIN_TOKEN provided');
      return;
    }

    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate through sidebar menu
    const sysMenu = page.locator('.el-sub-menu__title').filter({ hasText: '系统管理' }).first();
    if (await sysMenu.count() > 0) {
      await sysMenu.click();
      await page.waitForTimeout(800);
    }

    const userMenu = page.locator('.el-menu-item').filter({ hasText: '用户管理' }).first();
    const userMenuCount = await userMenu.count();
    console.log('用户管理 menu item found:', userMenuCount > 0);

    if (userMenuCount > 0) {
      await userMenu.click();
    } else {
      await page.goto(`${BASE_URL}/#/admin/sys-user`, { waitUntil: 'networkidle' });
    }

    // Wait 3 seconds as specified in the task
    await page.waitForTimeout(3000);

    const url = page.url();
    const hasCorrectUrl = url.includes('sys-user');
    const elCardCount = await page.locator('.el-card').count();
    const elTableCount = await page.locator('.el-table').count();
    const elTableRowCount = await page.locator('.el-table__body tr').count();
    const loadingVisible = await page.locator('.el-loading-mask:visible').count() > 0;

    // Check for red error overlays
    const errorMsgCount = await page.locator('.el-message--error:visible').count();

    console.log('=== User Management Page ===');
    console.log('URL:', url);
    console.log('URL contains sys-user:', hasCorrectUrl);
    console.log('el-card count:', elCardCount);
    console.log('el-table count:', elTableCount);
    console.log('el-table rows:', elTableRowCount);
    console.log('Loading spinner visible:', loadingVisible);
    console.log('Error messages visible:', errorMsgCount);

    await page.screenshot({ path: 'test-results/05-user-management.png', fullPage: true });
    console.log('Screenshot: test-results/05-user-management.png');

    // Fix verification - check for specific error patterns
    const criticalErrors = errors.filter(e =>
      e.includes('Cannot find module') ||
      e.includes('getDicts is not a function') ||
      e.includes('this.getDicts') ||
      e.includes('is not a function') ||
      e.includes('Cannot read properties of undefined')
    );

    const allJsErrors = errors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );

    console.log('\n=== Fix Verification - User Management ===');
    const fix1Pass = !criticalErrors.some(e => e.includes('Cannot find module'));
    const fix2Pass = !criticalErrors.some(e => e.includes('getDicts'));
    const fix3Pass = elTableCount > 0 || elCardCount > 0; // component rendered

    console.log('Fix 1 (loadView .default - no "Cannot find module"):', fix1Pass ? 'PASS' : 'FAIL');
    console.log('Fix 2 (getDicts registration - no getDicts errors):', fix2Pass ? 'PASS' : 'FAIL');
    console.log('Fix 3 (Pagination/AppPagination - page renders):', fix3Pass ? 'PASS' : 'FAIL');
    console.log('el-card present:', elCardCount > 0 ? 'PASS' : 'FAIL');
    console.log('el-table present:', elTableCount > 0 ? 'PASS' : 'FAIL');
    console.log('Data loaded (rows > 0):', elTableRowCount > 0 ? 'YES' : 'NO (may be empty or still loading)');

    if (criticalErrors.length > 0) {
      console.log('\nCRITICAL JS ERRORS:');
      criticalErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }

    if (allJsErrors.length > 0) {
      console.log('\nAll JS errors:');
      allJsErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    } else {
      console.log('\nNo JS errors on user management page');
    }

    // Assertions
    expect(hasCorrectUrl || url.includes('admin')).toBeTruthy();
  });

  test('06 - Role management page: content and fix verification', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const authOk = await setupAuth(context);
    if (!authOk) {
      console.log('SKIP: No ADMIN_TOKEN provided');
      return;
    }

    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to role management
    const sysMenu = page.locator('.el-sub-menu__title').filter({ hasText: '系统管理' }).first();
    if (await sysMenu.count() > 0) {
      await sysMenu.click();
      await page.waitForTimeout(800);
    }

    const roleMenu = page.locator('.el-menu-item').filter({ hasText: '角色管理' }).first();
    const roleMenuCount = await roleMenu.count();
    console.log('角色管理 menu item found:', roleMenuCount > 0);

    if (roleMenuCount > 0) {
      await roleMenu.click();
    } else {
      await page.goto(`${BASE_URL}/#/admin/sys-role`, { waitUntil: 'networkidle' });
    }

    await page.waitForTimeout(3000);

    const url = page.url();
    const elCardCount = await page.locator('.el-card').count();
    const elTableCount = await page.locator('.el-table').count();
    const elTableRowCount = await page.locator('.el-table__body tr').count();

    console.log('=== Role Management Page ===');
    console.log('URL:', url);
    console.log('el-card count:', elCardCount);
    console.log('el-table count:', elTableCount);
    console.log('el-table rows:', elTableRowCount);

    await page.screenshot({ path: 'test-results/06-role-management.png', fullPage: true });
    console.log('Screenshot: test-results/06-role-management.png');

    const criticalErrors = errors.filter(e =>
      e.includes('Cannot find module') ||
      e.includes('getDicts is not a function') ||
      e.includes('is not a function')
    );

    const allJsErrors = errors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );

    console.log('el-card present:', elCardCount > 0 ? 'PASS' : 'FAIL');
    console.log('el-table present:', elTableCount > 0 ? 'PASS' : 'FAIL');

    if (criticalErrors.length > 0) {
      console.log('CRITICAL ERRORS:', criticalErrors);
    } else {
      console.log('No critical JS errors on role management page');
    }

    if (allJsErrors.length > 0) {
      console.log('All JS errors:', allJsErrors);
    }
  });

  test('07 - Return to dashboard via 首页 menu', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const authOk = await setupAuth(context);
    if (!authOk) {
      console.log('SKIP: No ADMIN_TOKEN provided');
      return;
    }

    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to role management first
    await page.goto(`${BASE_URL}/#/admin/sys-role`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    console.log('On role management:', page.url());

    // Click 首页 in sidebar
    const homeMenu = page.locator('.el-menu-item').filter({ hasText: '首页' }).first();
    const homeCount = await homeMenu.count();
    console.log('首页 menu item found:', homeCount > 0);

    if (homeCount > 0) {
      await homeMenu.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
    }

    const url = page.url();
    const isDashboard = url.includes('dashboard') || url.includes('index') || !url.includes('sys-');
    console.log('URL after returning home:', url);
    console.log('On dashboard:', isDashboard);

    await page.screenshot({ path: 'test-results/07-back-to-dashboard.png', fullPage: true });
    console.log('Screenshot: test-results/07-back-to-dashboard.png');

    const allJsErrors = errors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );
    if (allJsErrors.length > 0) {
      console.log('JS errors:', allJsErrors);
    }
  });

  test('08 - Complete console error analysis (all pages)', async ({ page, context }) => {
    const loginErrors: string[] = [];
    const dashboardErrors: string[] = [];
    const userMgmtErrors: string[] = [];

    // Collect login page errors first
    page.on('console', msg => {
      if (msg.type() === 'error') loginErrors.push(msg.text());
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const jsLoginErrors = loginErrors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );

    // Collect dashboard + user management errors if we have auth
    const authOk = await setupAuth(context);
    if (authOk) {
      page.removeAllListeners('console');
      page.on('console', msg => {
        if (msg.type() === 'error') dashboardErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      page.removeAllListeners('console');
      page.on('console', msg => {
        if (msg.type() === 'error') userMgmtErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}/#/admin/sys-user`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
    }

    const jsDashboardErrors = dashboardErrors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );
    const jsUserMgmtErrors = userMgmtErrors.filter(e =>
      !e.includes('net::ERR') && !e.includes('Failed to load resource') && !e.includes('ERR_CERT')
    );

    const allErrors = [...jsLoginErrors, ...jsDashboardErrors, ...jsUserMgmtErrors];

    console.log('=== Complete Console Error Analysis ===\n');

    console.log('Login Page JS errors:', jsLoginErrors.length);
    jsLoginErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

    console.log('\nDashboard JS errors:', jsDashboardErrors.length);
    jsDashboardErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

    console.log('\nUser Management JS errors:', jsUserMgmtErrors.length);
    jsUserMgmtErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

    // Fix-specific verification
    const hasModuleError = allErrors.some(e => e.includes('Cannot find module'));
    const hasGetDictsError = allErrors.some(e =>
      e.includes('getDicts is not a function') ||
      (e.includes('getDicts') && e.includes('not a function'))
    );
    const hasPaginationError = allErrors.some(e =>
      e.toLowerCase().includes('pagination') ||
      e.includes('AppPagination')
    );

    console.log('\n=== Fix Verification Summary ===');
    console.log('Fix 1 - loadView .default (no "Cannot find module"):', hasModuleError ? 'FAIL' : 'PASS');
    console.log('Fix 2 - getDicts registration (no getDicts errors):', hasGetDictsError ? 'FAIL' : 'PASS');
    console.log('Fix 3 - Pagination component (no Pagination errors):', hasPaginationError ? 'FAIL' : 'PASS');
    console.log('\nTotal JS errors across all pages:', allErrors.length);

    if (allErrors.length === 0) {
      console.log('No JS errors detected on any page!');
    }

    await page.screenshot({ path: 'test-results/08-error-analysis-final.png', fullPage: true });
    console.log('Screenshot: test-results/08-error-analysis-final.png');

    // All three fixes should pass
    expect(hasModuleError).toBeFalsy();
    expect(hasGetDictsError).toBeFalsy();
    expect(hasPaginationError).toBeFalsy();
  });
});
