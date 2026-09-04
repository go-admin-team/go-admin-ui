import { mkdtempSync, mkdirSync, writeFileSync, existsSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * Exercises the real script with real filesystem I/O and a real `node`
 * subprocess rather than mocking fs. The bug this guards against -- a
 * directory sync-apps.mjs should have deleted but did not -- is exactly the
 * kind of thing an fs mock would hide by construction: the mock only does what
 * the test author already believes the script does.
 *
 * scripts/sync-apps.mjs resolves its own root from import.meta.url
 * (`dirname(fileURLToPath(import.meta.url)), '..'`), so each test copies the
 * real file into an isolated `<tmp>/scripts/sync-apps.mjs` instead of running
 * it in place. That is still the exact file under test, just rooted somewhere
 * disposable -- pointing it at src/apps or apps.config.mjs of the real repo
 * checkout would risk deleting the committed _test-fixture the store tests
 * depend on.
 */

// import.meta.dirname, not import.meta.url + fileURLToPath: vitest.config.mjs
// resolves its own aliases the same way, and vitest does not guarantee this
// module's import.meta.url is a real file:// URL.
const SCRIPT = resolve(import.meta.dirname, '../../../scripts/sync-apps.mjs')

function makeSandbox() {
  const root = mkdtempSync(join(tmpdir(), 'sync-apps-'))
  mkdirSync(join(root, 'scripts'), { recursive: true })
  cpSync(SCRIPT, join(root, 'scripts/sync-apps.mjs'))
  return root
}

function writeConfig(root, entries) {
  writeFileSync(join(root, 'apps.config.mjs'), `export default ${JSON.stringify(entries, null, 2)}\n`)
}

function writeSourceApp(root, dir) {
  const appDir = join(root, dir)
  mkdirSync(appDir, { recursive: true })
  writeFileSync(join(appDir, 'index.vue'), '<template>order</template>')
}

// process.execPath, not the bare "node" command: guarantees the subprocess is
// the same Node binary running the test, regardless of what a shell's PATH
// resolves "node" to in CI.
function run(root) {
  return execFileSync(process.execPath, ['scripts/sync-apps.mjs'], { cwd: root, encoding: 'utf8' })
}

describe('scripts/sync-apps.mjs', () => {
  it('copies an enabled app into src/apps/<code>', () => {
    const root = makeSandbox()
    writeSourceApp(root, 'vendor/order-app')
    writeConfig(root, [{ code: 'order', source: './vendor/order-app' }])

    run(root)

    expect(existsSync(join(root, 'src/apps/order/index.vue'))).toBe(true)
  })

  /**
   * THE REGRESSION THIS FILE EXISTS FOR.
   *
   * Removing an app from apps.config.mjs must make its copy under src/apps/
   * disappear on the next sync -- otherwise it keeps shipping in dist/, still
   * reachable through a stale menu row or a hand-typed URL, with nothing left
   * in the config to explain why it is there. Before the cleanup pass in
   * sync-apps.mjs, the loop only ever rewrote the directory belonging to a
   * *current* config entry, so a removed entry's old copy was invisible to it
   * and never got deleted.
   *
   * Confirmed as a real regression, not a tautological test: with the cleanup
   * pass commented back out, this case fails (src/apps/order survives),
   * exactly like the manual repro in the fe-dist findings. Restoring the pass
   * makes it pass again.
   */
  it('deletes a previously-synced app once it is removed from the config', () => {
    const root = makeSandbox()
    writeSourceApp(root, 'vendor/order-app')
    writeConfig(root, [{ code: 'order', source: './vendor/order-app' }])
    run(root)
    expect(existsSync(join(root, 'src/apps/order'))).toBe(true) // sanity check before the regression case

    writeConfig(root, [])
    run(root)

    expect(existsSync(join(root, 'src/apps/order'))).toBe(false)
  })

  // "enabled: false" is documented as keeping the entry on record without
  // syncing it -- that must not be read as "and leave whatever was already
  // copied there forever". A disabled app is not part of this build either.
  it('also deletes an app that stays in the config but is disabled', () => {
    const root = makeSandbox()
    writeSourceApp(root, 'vendor/order-app')
    writeConfig(root, [{ code: 'order', source: './vendor/order-app' }])
    run(root)

    writeConfig(root, [{ code: 'order', source: './vendor/order-app', enabled: false }])
    run(root)

    expect(existsSync(join(root, 'src/apps/order'))).toBe(false)
  })

  // src/apps/_test-fixture is committed, not synced -- see RESERVED in the
  // script. The cleanup pass must not treat "not in apps.config.mjs" as
  // license to delete it; it is never in apps.config.mjs by design.
  it('never deletes the reserved fixture directory', () => {
    const root = makeSandbox()
    const fixtureFile = join(root, 'src/apps/_test-fixture/probe/index.vue')
    mkdirSync(join(root, 'src/apps/_test-fixture/probe'), { recursive: true })
    writeFileSync(fixtureFile, '<template>probe</template>')
    writeConfig(root, [])

    run(root)

    expect(existsSync(fixtureFile)).toBe(true)
  })

  // The cleanup pass used to filter on entry.isDirectory(), so a stray
  // non-directory entry -- macOS drops exactly this file the moment Finder
  // opens a folder, and .gitignore already ignores it repo-wide -- survived
  // every sync untouched even though .gitignore treats all of src/apps/
  // (besides the fixture) as this script's output, nothing to hand-maintain.
  it('deletes a stray non-directory entry left under src/apps/', () => {
    const root = makeSandbox()
    mkdirSync(join(root, 'src/apps'), { recursive: true })
    writeFileSync(join(root, 'src/apps/.DS_Store'), '')
    writeConfig(root, [])

    run(root)

    expect(existsSync(join(root, 'src/apps/.DS_Store'))).toBe(false)
  })
})
