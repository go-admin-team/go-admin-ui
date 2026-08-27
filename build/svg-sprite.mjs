import { readdir, readFile } from 'node:fs/promises'
import { resolve, basename } from 'node:path'
import { optimize } from 'svgo'

/**
 * Bakes src/icons/svg into one <svg> of <symbol>s and registers it on the page.
 *
 * This replaces vite-plugin-svg-icons, which stopped being published in 2022 and
 * whose sprite builder, svg-baker, brings thirteen direct dependencies of its own
 * -- postcss 5, micromatch 3, image-size 0.5 among them. Those are the packages
 * behind every dependabot advisory this repository has had to pin through
 * overrides, and none of them can be bumped: svg-baker's last release predates
 * the fixes.
 *
 * Most of what svg-baker does is not reachable from here. It renames ids and
 * prefixes classes so that combined files cannot collide -- but nothing in
 * src/icons/svg refers to an id: `url(#…)` and `href="#…"` appear zero times
 * across all 128 files. The ids that are there (`Capa_1`, `4698`) are leftovers
 * from the drawing tool, and svgo removes them.
 *
 * Three things it does that matter, all reproduced below:
 *
 *   1. strip the wrapper's own attributes, so a file's `class="icon"` or a
 *      stray `<style>` cannot leak onto the others,
 *   2. derive a viewBox for the 43 icons that only carry width and height -- a
 *      <symbol> without one does not scale, and
 *   3. keep the id as `icon-<filename>`, which is the contract SvgIcon reads:
 *      it renders `<use href="#icon-{iconClass}">`.
 *
 * Compared against the sprite the old plugin produced: same 128 ids, same
 * viewBox on every one. tests/e2e/mocked/app-shell.spec.ts checks the sprite is
 * in the page at all, which is the failure this cannot be allowed to have --
 * a missing sprite leaves every <use> in the DOM and every test green while the
 * sidebar renders blank squares.
 */

const VIRTUAL_ID = 'virtual:svg-icons-register'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Attributes on the <svg> wrapper that must not survive into a <symbol>. */
const WRAPPER_ATTRS = ['fill', 'fill-rule', 'class', 'p-id', 't']

const SVGO_PLUGINS = [
  'preset-default',
  { name: 'removeAttrs', params: { attrs: WRAPPER_ATTRS } }
]

/** `0 0 W H` from width and height, for files that carry no viewBox. */
const deriveViewBox = (openingTag) => {
  const width = openingTag.match(/\bwidth="([\d.]+)/)?.[1]
  const height = openingTag.match(/\bheight="([\d.]+)/)?.[1]
  return width && height ? `0 0 ${width} ${height}` : null
}

const toSymbol = (name, svg) => {
  const opening = svg.match(/^<svg[^>]*>/)?.[0]
  if (!opening) return null

  const viewBox = opening.match(/viewBox="([^"]*)"/)?.[1] ?? deriveViewBox(opening)
  const body = svg.slice(opening.length).replace(/<\/svg>\s*$/, '')

  // Only id and viewBox are carried over: everything else on the wrapper
  // belongs to the standalone file, not to a symbol inside a shared sprite.
  return `<symbol id="icon-${name}"${viewBox ? ` viewBox="${viewBox}"` : ''}>${body}</symbol>`
}

const buildSprite = async(iconDir) => {
  const files = (await readdir(iconDir)).filter(file => file.endsWith('.svg')).sort()

  const symbols = await Promise.all(files.map(async(file) => {
    const raw = await readFile(resolve(iconDir, file), 'utf8')
    const { data } = optimize(raw, { path: file, plugins: SVGO_PLUGINS })
    return toSymbol(basename(file, '.svg'), data)
  }))

  return symbols.filter(Boolean).join('')
}

/**
 * The module the application imports for its side effect.
 *
 * The sprite is inserted as the body's first child rather than appended: an
 * icon used above the fold would otherwise reference a symbol the parser has
 * not reached yet. `aria-hidden` and the zero size keep a screenful of shapes
 * out of the accessibility tree and out of the layout.
 */
const registerScript = (sprite) => `
const id = '__svg_sprite__'
if (typeof document !== 'undefined' && !document.getElementById(id)) {
  const mount = () => {
    if (document.getElementById(id)) return
    const host = document.createElement('div')
    host.id = id
    host.style.position = 'absolute'
    host.style.width = host.style.height = '0'
    host.style.overflow = 'hidden'
    host.setAttribute('aria-hidden', 'true')
    host.innerHTML = ${JSON.stringify(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${sprite}</svg>`)}
    document.body.insertBefore(host, document.body.firstChild)
  }
  if (document.body) mount()
  else document.addEventListener('DOMContentLoaded', mount)
}
`

export function svgSprite({ iconDir }) {
  let cached = null

  return {
    name: 'go-admin:svg-sprite',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },

    async load(id) {
      if (id !== RESOLVED_ID) return null
      // Rebuilt on every load in dev so an added icon shows up on reload;
      // cached within a build so 128 files are read once, not once per chunk.
      cached ??= await buildSprite(iconDir)
      return registerScript(cached)
    },

    configureServer(server) {
      // Adding or editing an icon invalidates the sprite and reloads the page.
      // Vite does not watch it otherwise: the virtual module has no file of its
      // own for the graph to hang a dependency on.
      server.watcher.add(iconDir)
      const invalidate = (file) => {
        if (!file.endsWith('.svg') || !file.includes('icons')) return
        cached = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
      server.watcher.on('unlink', invalidate)
    }
  }
}
