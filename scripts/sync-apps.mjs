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
import { existsSync, readdirSync, rmSync, cpSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPS_DIR = resolve(ROOT, 'src/apps')

/**
 * Committed rather than synced, so the sync must not manage it.
 *
 * src/apps/_test-fixture/probe/index.vue is the fixture the unit tests resolve
 * through the apps branch of loadView. It is exempt from both the cleanup pass
 * and the sync loop below.
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

/**
 * Every code this run is allowed to leave under src/apps/: the reserved
 * fixture, plus each config entry that is both enabled and passes the same
 * validation the sync loop below applies before it will touch a directory.
 * A disabled or unusable entry is treated the same as an absent one here --
 * "enabled: false" means the app is not part of this build, not merely that
 * this run skips re-copying it.
 */
const wanted = new Set(RESERVED)
for (const app of apps) {
  if (app.enabled === false) continue
  if (CODE.test(app.code ?? '') && !RESERVED.includes(app.code)) wanted.add(app.code)
}

/**
 * Deletes whatever is left under src/apps/ that the loop below no longer owns.
 *
 * The loop only ever touches the directory it is about to rewrite for each
 * config entry, so on its own it never notices an app that used to be listed
 * (or enabled) and no longer is. Diffing the directory listing against
 * `wanted` catches that case: a removed or disabled app's page stops being
 * copied into fresh builds and stops being reachable through a stale menu row
 * or a hand-typed URL, instead of lingering in dist/ until someone remembers
 * to `rm -rf` it by hand.
 *
 * Not filtered to directories: .gitignore already treats every entry under
 * src/apps/ (besides the reserved fixture) as this sync's output, not
 * something to hand-maintain, so a stray file (macOS drops a .DS_Store the
 * moment Finder opens the folder) or a symlink is exactly as unowned as a
 * stale app directory and gets removed the same way. A symlink's Dirent
 * reports isDirectory() false even when it points at one, so a type filter
 * here would have let a symlinked app dodge cleanup entirely.
 */
if (existsSync(APPS_DIR)) {
  for (const entry of readdirSync(APPS_DIR, { withFileTypes: true })) {
    if (wanted.has(entry.name)) continue
    rmSync(resolve(APPS_DIR, entry.name), { recursive: true, force: true })
    console.log(`[sync-apps] removed "${entry.name}": not something this sync manages`)
  }
}

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
