/**
 * Declares which packaged frontend apps this build includes.
 *
 * Explicit rather than discovered by scanning node_modules: a scan would sync
 * whatever `pnpm install` happened to leave lying around, including an app
 * pulled in transitively as someone else's dependency. This file is the single
 * place that says "this build ships app X" -- an app absent here never reaches
 * src/apps/, so its menu entries fall back to the AppNotInstalled placeholder.
 *
 * Read only by scripts/sync-apps.mjs, at dev and build time. Nothing under src/
 * reads it: the routing in stores/permission.ts only cares whether a file
 * physically exists under src/apps/, never why.
 *
 * Ships empty, and a checkout that never touches it behaves exactly as it did
 * before this file existed.
 *
 * @typedef {object} AppEntry
 * @property {string} code       Matches the first segment after "apps/" in a
 *                               menu's component field, and becomes the
 *                               directory name under src/apps/. Letters,
 *                               digits, hyphen and underscore only -- it is
 *                               used to build a path that gets deleted and
 *                               rewritten.
 * @property {string} source     That app's views directory, resolved relative
 *                               to this file.
 * @property {boolean} [enabled] Default true. Set false to keep an entry on
 *                               record without syncing it.
 *
 * @type {AppEntry[]}
 */
export default [
  // { code: 'crm', source: '../go-admin-app-crm/views' }
]
