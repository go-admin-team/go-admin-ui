import { test, expect } from '@playwright/test'
import { authenticate, installApiMocks } from './fixtures'

const PHONE = { width: 375, height: 667 } // iPhone SE, the narrow end of real traffic
const DESKTOP = { width: 1280, height: 800 }

/**
 * List pages on a phone.
 *
 * Reported as issue #261. Measured before anything was built: at 375px a list
 * page rendered 827px of table into a 315px window, so 62% of every row had to
 * be dragged into view. These tests pin the replacement -- cards below the
 * breakpoint, the table above it -- and, more importantly, pin the properties
 * that make the replacement worth having.
 */
test.describe('list pages on a narrow screen', () => {
  test.beforeEach(async({ context }) => {
    await authenticate(context)
  })

  test('the table is replaced, not merely squeezed', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')

    await expect(page.locator('.pro-card').first()).toBeVisible()
    // Both must hold: a card list rendered *beside* a surviving table would
    // still leave the horizontal drag in place.
    await expect(page.locator('.el-table')).toHaveCount(0)
  })

  test('nothing has to be dragged sideways', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.pro-card').first()).toBeVisible()

    // The point of the whole exercise. Checked on the document rather than on
    // a wrapper, because an inner element that overflows still forces the page
    // to scroll.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }))
    expect(scrollWidth, `document scrolls to ${scrollWidth} in a ${clientWidth} viewport`)
      .toBeLessThanOrEqual(clientWidth)
  })

  test('the card is titled by something worth reading', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')

    // sys-user declares 编号/userId first, as nine of the fifteen list pages
    // do. A card titled "1" would be worse than the table it replaces, so the
    // identifier steps aside for the first meaningful column.
    await expect(page.locator('.pro-card__title').first()).toHaveText('admin')
    // ...and is still reachable, just not in one of the two visible slots.
    await page.locator('.pro-card').first().locator('.pro-card__toggle').click()
    await expect(page.locator('.pro-card').first()).toContainText('编号')
  })

  test('expanding reveals the columns the card left out', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')

    const card = page.locator('.pro-card').first()
    const fields = card.locator('.pro-card__field')
    await expect(card.locator('.pro-card__toggle')).toContainText('其余')

    // Measured on the collapsing container, not on a row inside it: a
    // bounding box reports an element's own layout size regardless of an
    // ancestor clipping it, so the rows keep their height either way.
    const more = card.locator('.pro-card__more')
    expect((await more.boundingBox())?.height ?? -1).toBe(0)
    await expect(fields.first()).toHaveCount(1)

    await card.locator('.pro-card__toggle').click()
    await expect.poll(async() => (await more.boundingBox())?.height ?? 0)
      .toBeGreaterThan(0)
    await expect(card.locator('.pro-card__toggle')).toHaveText('收起')
  })

  test('row actions are reachable by swiping', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')

    const card = page.locator('.pro-card').first()
    const surface = card.locator('.pro-card__surface')
    await expect(surface).toBeVisible()

    // The actions are laid out against the card's right edge and covered by the
    // opaque surface, so their box is on screen from the start -- what changes
    // is how far the surface has slid off them.
    const shift = () => surface.evaluate(el =>
      new DOMMatrix(getComputedStyle(el).transform).m41)
    expect(await shift()).toBe(0)

    // The action strip is measured after mount; a drag started before that
    // reads a width of zero and snaps straight back.
    await expect.poll(async() =>
      (await card.locator('.pro-card__actions').boundingBox())?.width ?? 0
    ).toBeGreaterThan(50)

    const box = (await surface.boundingBox())!
    // Dispatched rather than driven through page.mouse: the handler locks its
    // axis on a run of moves, and the driver's moves get coalesced under the
    // load of a parallel run -- the same swipe passed alone and failed in a
    // full suite, three times out of three.
    await surface.evaluate((el, width) => {
      const at = (x: number) => new PointerEvent('pointermove', {
        bubbles: true, clientX: x, clientY: 30, pointerId: 1, pointerType: 'touch', isPrimary: true
      })
      const start = width - 20
      el.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true, clientX: start, clientY: 30, pointerId: 1, pointerType: 'touch', isPrimary: true
      }))
      for (let x = start; x >= start - 150; x -= 10) el.dispatchEvent(at(x))
      el.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true, clientX: start - 150, clientY: 30, pointerId: 1, pointerType: 'touch', isPrimary: true
      }))
    }, Math.round(box.width))

    // Read only once the transform stops moving. The surface animates for 220ms
    // on release, so a single read lands mid-flight -- and a card that snapped
    // shut passes through -50 on its way back to 0, which is exactly the state
    // this test exists to rule out.
    const settled = async() => {
      const before = await shift()
      await page.waitForTimeout(80)
      const after = await shift()
      return before === after ? after : null
    }
    await expect.poll(settled, { timeout: 5000 }).toBeLessThan(-50)

    // And the button underneath is now usable, which is the point.
    await expect(card.locator('.pro-card__actions .el-button').first()).toBeVisible()
  })

  test('a column renders on the card the way it renders in the table', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(PHONE)
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.pro-card').first()).toBeVisible()

    // sys-user draws its status column as an el-switch. Reusing the column's
    // own slot is what this whole approach buys -- a second renderer for
    // mobile is the thing that rots.
    await expect(page.locator('.pro-card__badge .el-switch').first()).toBeVisible()
  })

  test('the table comes back on a wide screen', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/#/admin/sys-user')

    await expect(page.locator('.el-table').first()).toBeVisible()
    await expect(page.locator('.pro-card')).toHaveCount(0)
  })

  test('resizing across the breakpoint switches the view', async({ page }) => {
    await installApiMocks(page)
    await page.setViewportSize(DESKTOP)
    await page.goto('/#/admin/sys-user')
    await expect(page.locator('.el-table').first()).toBeVisible()

    // matchMedia only fires when the answer changes; a listener that never
    // registered leaves the table in place at phone width.
    await page.setViewportSize(PHONE)
    await expect(page.locator('.pro-card').first()).toBeVisible()
    await expect(page.locator('.el-table')).toHaveCount(0)

    await page.setViewportSize(DESKTOP)
    await expect(page.locator('.el-table').first()).toBeVisible()
  })
})

/**
 * Every list page, not just the one the feature was built against.
 *
 * The card layout is derived from whatever columns a page happens to declare,
 * so each page is a different input: some lead with an identifier, some with a
 * name, some build columns in a v-for, one has no actions at all. A rule that
 * works on sys-user and throws on sys-menu is worse than no rule.
 */
const LIST_PAGES = [
  '/#/admin/sys-user',
  '/#/admin/sys-role',
  '/#/admin/sys-post',
  '/#/admin/sys-dept',
  '/#/admin/sys-menu',
  '/#/admin/sys-api',
  '/#/admin/sys-config',
  '/#/admin/dict',
  '/#/admin/sys-login-log',
  '/#/admin/sys-oper-log',
  '/#/schedule/manage',
  '/#/dev-tools/gen',
  '/#/demo/product'
]

test.describe('every list page as cards', () => {
  for (const route of LIST_PAGES) {
    test(`${route} renders cards without breaking`, async({ page, context }) => {
      // Uncaught exceptions only. Console errors are dominated by resources the
      // mocks do not serve -- avatars and the like -- which say nothing about
      // whether the cards rendered.
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => {
        const text = message.text()
        if (message.type() !== 'error') return
        if (text.includes('Failed to load resource')) return
        errors.push(text.slice(0, 200))
      })

      await authenticate(context)
      await installApiMocks(page)
      await page.setViewportSize(PHONE)
      await page.goto(route)

      await expect(page.locator('.pro-card').first()).toBeVisible({ timeout: 15000 })

      // A card whose heading is blank means the column split produced nothing
      // to lead with -- it renders, but it is useless.
      const title = await page.locator('.pro-card__title').first().textContent()
      expect(title?.trim(), 'the first card has no heading').toBeTruthy()

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))
      expect(scrollWidth, `${route} scrolls sideways`).toBeLessThanOrEqual(clientWidth)

      expect(errors, `${route} logged: ${errors[0] ?? ''}`).toEqual([])
    })
  }
})
