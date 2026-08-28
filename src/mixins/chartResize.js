import { debounce } from '@/utils'

/**
 * Keeps an echarts instance the size of its container.
 *
 * A mixin rather than a composable because every chart here is still Options
 * API and reads its instance off `this.chart`; a composable would mean
 * rewriting seven components to change one behaviour. It lives in src/mixins/
 * for the same reason -- src/composables/ documents itself as the thing that
 * replaces mixins, so shipping a mixin from that directory would make the
 * barrel comment a lie.
 *
 * It replaces a window-resize + sidebar-transitionend pair inherited from
 * vue-element-admin, which covered the two cases someone thought of and missed
 * the one that actually shipped broken: a chart mounted inside an inactive
 * el-tab-pane. echarts measures the container at init, an inactive pane
 * measures zero, and echarts falls back to its default 100px width -- so the
 * chart stayed 100px after the user switched to that tab, beside an identical
 * 570px chart in the pane that happened to be open.
 *
 * ResizeObserver covers all three (tab switch, sidebar collapse, window
 * resize) because it watches the box rather than guessing which events change
 * it, and it needs no reference to the sidebar's DOM.
 */
export default {
  // Not declared in data(): the observer is not state, and Vue 3 does not proxy
  // properties whose names begin with $ or _ onto the instance -- which is why
  // the mixin this replaces never worked after the Vue 3 port. Its $_ fields
  // read back undefined, so it registered no listeners at all.
  mounted() {
    this.observeChartResize()
  },

  beforeUnmount() {
    this.unobserveChartResize()
  },

  // keep-alive tears the observer down on deactivate, so it has to be set up
  // again rather than assumed live.
  activated() {
    this.observeChartResize()
  },

  deactivated() {
    this.unobserveChartResize()
  },

  methods: {
    observeChartResize() {
      const element = this.$refs.chartRef
      // Vue 3 runs both mounted and activated on a kept-alive component's first
      // insertion; without the second half of this guard that would leave two
      // observers on one element and leak the first.
      if (!element || this.chartResizeObserver) return

      // Debounced because a ResizeObserver reports every frame the box changes,
      // and the boxes here change under CSS transitions: collapsing the sidebar
      // animates the container's width for 280ms, so an undebounced callback
      // runs a full echarts relayout ~17 times per chart for one click. The
      // mixin this replaces debounced for the same reason; only its trigger
      // (window resize, sidebar transitionend) was too narrow.
      const resize = debounce(() => {
        // Zero means the container is hidden, not that it shrank; resizing to
        // it would throw away the layout with nothing to restore when the pane
        // opens again.
        if (!this.chart || !element.clientWidth || !element.clientHeight) return
        this.chart.resize()
      }, 100)

      this.chartResizeObserver = new ResizeObserver(resize)
      this.chartResizeObserver.observe(element)
    },

    unobserveChartResize() {
      if (!this.chartResizeObserver) return
      this.chartResizeObserver.disconnect()
      this.chartResizeObserver = null
    }
  }
}
