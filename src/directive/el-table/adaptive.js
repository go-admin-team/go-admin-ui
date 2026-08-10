/**
 * How to use
 * <el-table height="100px" v-el-height-adaptive-table="{bottomOffset: 30}">...</el-table>
 * el-table height must be set
 * bottomOffset: 30(default) - The height of the table from the bottom of the page.
 */

const doResize = (el, binding, vnode) => {
  const $table = vnode.component?.exposed || vnode.componentInstance

  const { value } = binding

  if (!$table || !$table.height) {
    console.warn('el-table must set the height. Such as height="100px"')
    return
  }
  const bottomOffset = (value && value.bottomOffset) || 30

  const height = window.innerHeight - el.getBoundingClientRect().top - bottomOffset
  $table.layout?.setHeight(height)
  $table.doLayout?.()
}

export default {
  mounted(el, binding, vnode) {
    el.resizeListener = () => {
      doResize(el, binding, vnode)
    }
    window.addEventListener('resize', el.resizeListener)
    // Initial resize
    doResize(el, binding, vnode)
  },
  updated(el, binding, vnode) {
    doResize(el, binding, vnode)
  },
  unmounted(el) {
    if (el.resizeListener) {
      window.removeEventListener('resize', el.resizeListener)
    }
  }
}
