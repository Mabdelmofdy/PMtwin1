/**
 * Layer 10 — Chart Tokens (future analytics)
 * Documentation and reserved token names only — no chart implementation in Phase 2.
 */

/** Reserved CSS variable names for future chart theming. */
export const pmChartVars = {
  colorPositive: '--chart-positive',
  colorNegative: '--chart-negative',
  colorNeutral: '--chart-neutral',
  colorSeries1: '--chart-series-1',
  colorSeries2: '--chart-series-2',
  colorSeries3: '--chart-series-3',
  colorSeries4: '--chart-series-4',
  gridLine: '--chart-grid',
  axisLabel: '--chart-axis',
  tooltipBackground: '--chart-tooltip-bg',
  tooltipForeground: '--chart-tooltip-fg',
  legendForeground: '--chart-legend-fg',
} as const

/**
 * Chart tokens will derive from semantic layer:
 * - positive → success
 * - negative → danger
 * - neutral → muted-foreground
 * - series → brand palette rotation
 */
export const pmChartSemanticMapping = {
  positive: 'success',
  negative: 'danger',
  neutral: 'neutral',
  grid: 'border',
  tooltip: 'popover',
} as const

export type PmChartVar = keyof typeof pmChartVars
