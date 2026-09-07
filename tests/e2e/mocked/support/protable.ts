import type { Page } from '@playwright/test'

/**
 * The search panel's expand/collapse toggle.
 *
 * The label is Chinese because the suite runs against the Chinese interface
 * (playwright.config.ts pins the locale); keeping it in one place means a
 * re-wording is one edit rather than four.
 */
export const searchToggle = (page: Page, name: '展开' | '收起' = '展开') =>
  page.locator('.pro-table__search').getByRole('button', { name })
