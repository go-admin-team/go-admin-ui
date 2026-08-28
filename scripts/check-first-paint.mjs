import { readFileSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

/**
 * Fails the build when the first paint grows past its budget.
 *
 * This exists because the regression it guards against is invisible. A single
 * line in vite.config's manualChunks -- `return 'chunk-libs'` -- assigned every
 * dependency to a chunk the entry loads, so a library used by one lazy page was
 * downloaded by every visitor before the login form appeared. Nothing failed.
 * The build was green, the pages worked, and the first paint was 1,007 kB
 * gzipped, of which 370 kB was echarts, drawn only on the dashboard.
 *
 * Measured on what index.html actually tells the browser to fetch up front,
 * not on the sum of everything in dist -- lazily loaded chunks are the point,
 * not the problem.
 *
 * Raising the budget is a decision, not a fix. If this fails, first ask whether
 * something that belongs in an async chunk has been named in manualChunks.
 */
const BUDGET_KB = 500

const dist = join(process.cwd(), 'dist')
const indexHtml = join(dist, 'index.html')

if (!existsSync(indexHtml)) {
  console.error('dist/index.html not found -- run `pnpm build:prod` first.')
  process.exit(1)
}

const html = readFileSync(indexHtml, 'utf8')

// Both the entry (`src`) and everything it preloads (`href`), since the browser
// fetches all of them before the app renders.
const scripts = [...new Set(
  [...html.matchAll(/(?:src|href)="(\/js\/[^"]+\.js)"/g)].map(match => match[1])
)]

if (scripts.length === 0) {
  console.error('No scripts found in dist/index.html -- the check would pass vacuously.')
  process.exit(1)
}

const sizes = scripts.map(path => {
  const file = join(dist, path.replace(/^\//, ''))
  const kb = gzipSync(readFileSync(file)).length / 1024
  return { path, kb }
}).sort((a, b) => b.kb - a.kb)

const total = sizes.reduce((sum, entry) => sum + entry.kb, 0)

for (const { path, kb } of sizes) {
  console.log(`  ${kb.toFixed(2).padStart(8)} kB  ${path}`)
}
console.log(`  ${'-'.repeat(8)}`)
console.log(`  ${total.toFixed(2).padStart(8)} kB  first paint, gzipped (budget ${BUDGET_KB} kB)`)

if (total > BUDGET_KB) {
  console.error(`\nFirst paint is ${(total - BUDGET_KB).toFixed(2)} kB over budget.`)
  console.error('Check whether a dependency only some pages need has been named in manualChunks.')
  process.exit(1)
}
