<script>
import { h, resolveComponent } from 'vue'

export default {
  name: 'MenuItem',
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  render() {
    const vnodes = []

    if (this.icon) {
      const SvgIcon = resolveComponent('svg-icon')
      vnodes.push(h(SvgIcon, { iconClass: this.icon }))
    }

    if (this.title) {
      vnodes.push(h('span', null, this.title))
    }

    return h('div', { style: 'display:flex;align-items:center;' }, vnodes)
  }
}
</script>
