import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

/**
 * The parts of echarts this project actually draws.
 *
 * Importing the package whole pulls in every chart type, both renderers and
 * some forty components -- 1,117 kB, 370 kB gzipped, larger than the whole of
 * Element Plus. What the project draws is four chart types and eight
 * components, which is 216 kB gzipped.
 *
 * The list is derived from the options the components pass, not guessed: bar,
 * line, pie and radar series; grid, tooltip, legend, title, visualMap,
 * dataZoom and axisPointer keys; and RadarComponent for the radar chart's
 * coordinate system, which is separate from the series that draws on it.
 *
 * Adding a chart type means adding it here too, and the failure is loud --
 * echarts throws on an unregistered series. tests/e2e/mocked/dashboard.spec.ts
 * reads the rendered pixels, so a missing registration turns it red rather
 * than shipping a blank canvas.
 */
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  // Canvas only. SVG is the other renderer echarts ships and nothing here asks
  // for it; including both would be half the saving given back.
  CanvasRenderer
])

export default echarts
export * from 'echarts/core'
