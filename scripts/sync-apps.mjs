#!/usr/bin/env node
/**
 * Copies each configured app's views into src/apps/<code>/ before dev or build
 * starts. Reads apps.config.mjs; writes nothing when that file is empty, which
 * is how it ships.
 *
 * Copies rather than symlinks. A symlink into node_modules or a sibling
 * checkout needs elevated privileges to create on Windows, and Vite's
 * server.fs.allow restricts reads to the project root, which a link pointing
 * outside it would violate. A real copy has neither problem and costs nothing
 * here: this runs once per dev-server start or build, not per file save.
 *
 * A missing source directory is a warning, not a failure. apps.config.mjs is
 * meant to be committed even when a listed app is not checked out on every
 * machine, and failing the whole `pnpm dev` for that would be worse than the
 * app's menus falling back to the AppNotInstalled placeholder -- the degraded
 * mode stores/permission.ts already handles.
 *
 * Run: node scripts/sync-apps.mjs
 */
import { existsSync, rmSync, cpSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPS_DIR = resolve(ROOT, 'src/apps')

/**
 * Committed rather than synced, so the sync must not manage it.
 *
 * src/apps/_test-fixture/probe/index.vue is the fixture the unit tests resolve
 * through the apps branch of loadView. It is the reason this script deletes
 * only the directories it is about to write, instead of clearing src/apps/
 * wholesale.
 */
const RESERVED = ['_test-fixture']

/**
 * The code names a directory that is deleted and rewritten, so it is validated
 * rather than trusted: a stray "../" or an absolute path in a hand-edited
 * config would aim rmSync at something that is not build output.
 */
const CODE = /^[A-Za-z0-9_-]+$/

// pathToFileURL, not the bare path: import() takes a URL, and an absolute
// Windows path ("C:\repo\apps.config.mjs") is not one.
const { default: apps } = await import(pathToFileURL(resolve(ROOT, 'apps.config.mjs')).href)

for (const app of apps) {
  if (app.enabled === false) continue

  if (!CODE.test(app.code ?? '')) {
    console.error(`[sync-apps] skip: "${app.code}" is not a usable app code (letters, digits, - and _ only)`)
    continue
  }

  if (RESERVED.includes(app.code)) {
    console.error(`[sync-apps] skip "${app.code}": that name is reserved for a checked-in fixture`)
    continue
  }

  const source = resolve(ROOT, app.source)
  const target = resolve(APPS_DIR, app.code)

  if (!existsSync(source)) {
    console.warn(`[sync-apps] skip "${app.code}": no such directory ${source}`)
    continue
  }

  // Replaced whole rather than merged, so a page deleted from the source app
  // does not linger here pretending to still be installed.
  rmSync(target, { recursive: true, force: true })
  mkdirSync(dirname(target), { recursive: true })
  cpSync(source, target, { recursive: true })
  console.log(`[sync-apps] synced "${app.code}" from ${source}`)
}
