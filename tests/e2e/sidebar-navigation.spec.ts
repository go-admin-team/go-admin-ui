import { test, expect, Page, BrowserContext, ConsoleMessage } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'

const SCREENSHOT_DIR = '/tmp/go-admin-screenshots'
const BASE_URL = 'http://localhost:9527'
const API_URL = 'http://localhost:8001'

function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

async function saveScreenshot(page: Page, name: string) {
  ensureScreenshotDir()
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`[SCREENSHOT] ${filePath}`)
}

function httpGet<T = unknown>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const req = http.request({
      hostname: urlObj.hostname,
      port: parseInt(urlObj.port),
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    }, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk })
      res.on('end', () => {
        // Reject rather than resolving with { raw }: callers read named fields
        // off the result, so a non-JSON body used to surface as undefined
        // properties instead of a failure.
        try { resolve(JSON.parse(data)) } catch { reject(new Error(`Non-JSON response from ${url}: ${data.slice(0, 120)}`)) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function getCaptcha(): Promise<{ id: string; imageBase64: string }> {
  const resp = await httpGet<{ id: string, data: string }>(`${API_URL}/api/v1/captcha`)
  return { id: resp.id, imageBase64: resp.data }
}

// 将验证码 base64 保存为图片文件并返回路径（供人工/Vision 识别）
async function saveCaptchaImage(base64: string, filePath: string) {
  const data = base64.replace(/^data:image\/\w+;base64,/, '')
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
}

async function injectToken(context: BrowserContext, token: string) {
  await context.addCookies([{
    name: 'Admin-Token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax'
  }])
  console.log('[AUTH] Token 已注入到浏览器 Cookie')
}

test.describe('侧边栏菜单导航功能验证', () => {
  const jsErrors: string[] = []
  const jsWarnings: string[] = []

  test('完整导航流程验证', async({ page, context }) => {
    ensureScreenshotDir()

    // 收集控制台消息
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type()
      const text = msg.text()

      if (type === 'error') {
        // 忽略已知的网络相关错误（图片加载、WebSocket 等）
        if (!text.includes('Failed to load resource') && !text.includes('WebSocket')) {
          jsErrors.push(text)
        }
        console.log(`[CONSOLE ERROR] ${text}`)
      }
      // Playwright's ConsoleMessage.type() returns 'warning', not 'warn'.
      // While this read 'warn' the branch was never taken, so warning
      // collection silently did nothing.
      if (type === 'warning') {
        if (text.includes('handleMouseleave') ||
          text.includes('Failed to resolve component') ||
          text.includes('is not a function')) {
          jsWarnings.push(text)
          console.log(`[CONSOLE WARN] ${text}`)
        }
      }
    })

    page.on('pageerror', (error: Error) => {
      jsErrors.push(`[PAGE ERROR] ${error.message}`)
      console.log('[PAGE ERROR]', error.message)
    })

    // ==================== 阶段 1：获取 Token 并注入 ====================
    console.log('\n=== 阶段 1：API 登录获取 Token ===')

    // 获取验证码
    const captcha = await getCaptcha()
    const captchaImagePath = path.join(SCREENSHOT_DIR, 'captcha_for_login.png')
    await saveCaptchaImage(captcha.imageBase64, captchaImagePath)
    console.log(`验证码 ID: ${captcha.id}`)
    console.log(`验证码图片: ${captchaImagePath}`)

    // 读取验证码图片进行识别（通过文件内容方式）
    // 使用已知密码组合和当前验证码
    // 注意：验证码有效期 600 秒，我们用 Node.js 直接在同进程中识别
    // 这里需要人工传入验证码，或者通过其他手段

    // 方案：先用之前已保存的 Token（如果存在且有效）
    let token: string | null = null

    const savedTokenPath = '/tmp/auth_token.txt'
    if (fs.existsSync(savedTokenPath)) {
      const savedToken = fs.readFileSync(savedTokenPath, 'utf-8').trim()
      if (savedToken && savedToken.length > 20) {
        token = savedToken
        console.log('[AUTH] 使用已保存的 Token')
      }
    }

    if (!token) {
      throw new Error('没有可用的 Token，请先通过 API 登录获取 token')
    }

    // 注入 token 到浏览器 context
    await injectToken(context, token)

    // ==================== 步骤 1：打开应用首页 ====================
    console.log('\n=== 步骤 1：打开应用首页 ===')
    await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    await saveScreenshot(page, '01-initial-state')
    console.log('当前 URL:', page.url())

    // 检查是否还在登录页（token 可能无效）
    if (page.url().includes('/login')) {
      console.log('[WARN] 仍在登录页，Token 可能已过期')
      // 这里不抛异常，继续记录状态
    }

    // ==================== 步骤 2：验证左侧菜单 ====================
    console.log('\n=== 步骤 2：检查左侧菜单 ===')
    await page.waitForTimeout(1000)

    // 等待侧边栏加载
    try {
      await page.waitForSelector('.el-menu', { timeout: 5000 })
      console.log('[OK] el-menu 已加载')
    } catch {
      console.log('[WARN] 等待 .el-menu 超时')
    }

    // 收集菜单信息
    const menuInfo = await page.evaluate(() => {
      const sidebarEl = document.querySelector('.sidebar-container, .el-aside, aside, .scrollbar-wrapper')
      const menuEl = document.querySelector('.el-menu')
      const menuItems = document.querySelectorAll('.el-menu-item')
      const subMenus = document.querySelectorAll('.el-sub-menu')
      const subMenuTitles = document.querySelectorAll('.el-sub-menu__title')

      const texts: string[] = []
      menuItems.forEach((el) => {
        const text = el.textContent?.trim()
        if (text) texts.push(text)
      })
      const subTexts: string[] = []
      subMenuTitles.forEach((el) => {
        const text = el.textContent?.trim()
        if (text) subTexts.push(text)
      })

      return {
        hasSidebar: !!sidebarEl,
        hasMenu: !!menuEl,
        menuItemCount: menuItems.length,
        subMenuCount: subMenus.length,
        menuItemTexts: texts,
        subMenuTexts: subTexts
      }
    })

    console.log('侧边栏存在:', menuInfo.hasSidebar)
    console.log('el-menu 存在:', menuInfo.hasMenu)
    console.log('菜单项数量:', menuInfo.menuItemCount)
    console.log('子菜单数量:', menuInfo.subMenuCount)
    console.log('菜单项文字:', JSON.stringify(menuInfo.menuItemTexts))
    console.log('子菜单标题:', JSON.stringify(menuInfo.subMenuTexts))

    await saveScreenshot(page, '02-sidebar-loaded')

    // ==================== 步骤 3：展开系统管理子菜单 ====================
    console.log('\n=== 步骤 3：展开"系统管理"子菜单 ===')

    let sysMenuFound = false
    // 先找精确匹配
    const sysMenuSelectors = [
      '.el-sub-menu__title:has-text("系统管理")',
      '.el-sub-menu__title:has-text("系统")'
    ]

    for (const sel of sysMenuSelectors) {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await el.textContent()
        await el.click()
        console.log(`[OK] 点击展开子菜单: "${text?.trim()}" (${sel})`)
        sysMenuFound = true
        break
      }
    }

    if (!sysMenuFound) {
      // 点击第一个子菜单
      const firstSubMenu = page.locator('.el-sub-menu__title').first()
      if (await firstSubMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await firstSubMenu.textContent()
        await firstSubMenu.click()
        console.log(`[OK] 点击第一个子菜单: "${text?.trim()}"`)
        sysMenuFound = true
      } else {
        console.log('[WARN] 未找到任何子菜单标题')
      }
    }

    await page.waitForTimeout(800)
    await saveScreenshot(page, '03-submenu-expanded')

    // 检查子菜单项是否展开
    const expandedItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.el-sub-menu.is-opened .el-menu-item')
      return Array.from(items).map((el) => el.textContent?.trim()).filter(Boolean)
    })
    console.log('展开的子菜单项:', JSON.stringify(expandedItems))

    // ==================== 步骤 4：点击用户管理 ====================
    console.log('\n=== 步骤 4：点击"用户管理" ===')
    const urlBefore4 = page.url()
    console.log('点击前 URL:', urlBefore4)

    let userMenuClicked = false
    const userMenuSelectors = [
      '.el-menu-item:has-text("用户管理")',
      '.el-menu-item:has-text("用户")',
      'li.el-menu-item:has-text("用户")'
    ]

    for (const sel of userMenuSelectors) {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click()
        console.log(`[OK] 点击用户管理 (${sel})`)
        userMenuClicked = true
        break
      }
    }

    if (!userMenuClicked && expandedItems.length > 0) {
      // 点击第一个展开的子菜单项
      const firstItem = page.locator('.el-sub-menu.is-opened .el-menu-item').first()
      if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await firstItem.textContent()
        await firstItem.click()
        console.log(`[OK] 点击第一个展开的子菜单项: "${text?.trim()}"`)
        userMenuClicked = true
      }
    }

    await page.waitForTimeout(2000)
    const urlAfter4 = page.url()
    const urlChanged4 = urlAfter4 !== urlBefore4
    console.log('点击后 URL:', urlAfter4)
    console.log(`URL 变化: ${urlChanged4 ? 'YES' : 'NO'}`)
    await saveScreenshot(page, '04-user-management')

    // ==================== 步骤 5：点击角色管理 ====================
    console.log('\n=== 步骤 5：点击"角色管理" ===')
    const urlBefore5 = page.url()

    let roleMenuClicked = false
    const roleMenuSelectors = [
      '.el-menu-item:has-text("角色管理")',
      '.el-menu-item:has-text("角色")'
    ]

    for (const sel of roleMenuSelectors) {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click()
        console.log(`[OK] 点击角色管理 (${sel})`)
        roleMenuClicked = true
        break
      }
    }

    if (!roleMenuClicked) {
      console.log('[WARN] 未找到角色管理菜单项')
    }

    await page.waitForTimeout(2000)
    const urlAfter5 = page.url()
    console.log('角色管理 URL:', urlAfter5)
    console.log(`URL 变化: ${urlAfter5 !== urlBefore5 ? 'YES' : 'NO'}`)
    await saveScreenshot(page, '05-role-management')

    // ==================== 步骤 6：点击首页 ====================
    console.log('\n=== 步骤 6：点击"首页" ===')
    let homeClicked = false
    const homeSelectors = [
      '.el-menu-item:has-text("首页")',
      '.el-menu-item:has-text("Dashboard")',
      '.el-menu-item:has-text("仪表盘")',
      '.el-menu > .el-menu-item:first-child'
    ]

    for (const sel of homeSelectors) {
      const el = page.locator(sel).first()
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await el.textContent()
        await el.click()
        console.log(`[OK] 点击首页 (${sel}): "${text?.trim()}"`)
        homeClicked = true
        break
      }
    }

    if (!homeClicked) {
      console.log('[WARN] 未找到首页菜单项')
    }

    await page.waitForTimeout(2000)
    const urlAfterHome = page.url()
    console.log('首页 URL:', urlAfterHome)
    await saveScreenshot(page, '06-home-after-navigate')

    // ==================== 步骤 7：检查菜单文字样式 ====================
    console.log('\n=== 步骤 7：检查菜单文字样式可见性 ===')
    const styleCheck = await page.evaluate(() => {
      const results: Array<{ selector: string; color: string; bg: string; visible: boolean }> = []

      const targets = [
        '.el-menu-item',
        '.el-sub-menu__title',
        '.el-menu--dark .el-menu-item'
      ]

      for (const sel of targets) {
        const el = document.querySelector(sel)
        if (el) {
          const style = window.getComputedStyle(el)
          const color = style.color
          const bg = style.backgroundColor
          // 检查文字是否可见（不是透明/黑色 on 黑色背景）
          const visible = color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'
          results.push({ selector: sel, color, bg, visible })
        }
      }

      return results
    })

    styleCheck.forEach((item) => {
      const status = item.visible ? '[OK]' : '[WARN]'
      console.log(`${status} ${item.selector}: color=${item.color}, bg=${item.bg}`)
    })

    // ==================== 步骤 8：JS 错误汇总 ====================
    console.log('\n=== 步骤 8：JavaScript 错误汇总 ===')

    const handleMouseleaveErrors = jsErrors.filter((e) => e.includes('handleMouseleave'))
    const componentErrors = (jsErrors.concat(jsWarnings)).filter((e) => e.includes('Failed to resolve component'))
    const functionErrors = jsErrors.filter((e) => e.includes('is not a function'))

    console.log(`总错误数: ${jsErrors.length}`)
    console.log(`handleMouseleave 错误: ${handleMouseleaveErrors.length}`)
    console.log(`Failed to resolve component 错误: ${componentErrors.length}`)
    console.log(`is not a function 错误: ${functionErrors.length}`)

    if (jsErrors.length > 0) {
      console.log('\n错误列表:')
      jsErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
    }
    if (jsWarnings.length > 0) {
      console.log('\n警告列表:')
      jsWarnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`))
    }

    // ==================== 断言 ====================
    console.log('\n=== 断言验证 ===')

    // 1. 关键错误不应存在
    expect(handleMouseleaveErrors.length, 'handleMouseleave is not a function 错误已修复').toBe(0)
    expect(functionErrors.length, 'is not a function 错误应为 0').toBe(0)

    // 2. 菜单应该有内容
    expect(menuInfo.menuItemCount + menuInfo.subMenuCount, '侧边栏应有菜单项').toBeGreaterThan(0)

    // 3. 至少有一次 URL 变化（点击菜单后导航有效）
    const anyNavigation = urlChanged4 || (urlAfter5 !== urlBefore5)
    expect(anyNavigation, '点击菜单后应发生页面导航').toBeTruthy()

    // 4. 最终页面不应停留在登录页
    expect(urlAfterHome, '最终 URL 不应包含 /login').not.toContain('/login')

    console.log('\n=== 测试完成 ===')
    console.log(`截图目录: ${SCREENSHOT_DIR}`)
  })
})
