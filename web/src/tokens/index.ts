/**
 * PM-Twin Adaptive Token Architecture — public API.
 * Authority: DDS-002 | CSS values: web/src/index.css
 */

export { PM_TOKEN_LAYERS, PM_TOKEN_DEPENDENCY_ORDER, type PmTokenLayer } from '@/tokens/pm-token-layers'
export {
  pmTokenOwnership,
  pmPageTokenPolicy,
  pmTokenValidationRules,
  type PmTokenOwnership,
} from '@/tokens/pm-token-registry'

export { pmBrandVars, pmBrandColor, type PmBrandColor } from '@/tokens/layers/brand'
export {
  pmSemanticVars,
  pmSurfaceTone,
  pmTextTone,
  pmStatusBackground,
  type PmSurfaceTone,
  type PmTextTone,
  type PmStatusBackground,
} from '@/tokens/layers/semantic'
export {
  pmComponentTokens,
  pmMatchTypeStyles,
  resolveMatchTypeStyle,
  formatMatchTypeLabel,
  type PmComponentToken,
} from '@/tokens/layers/component'
export {
  pmLayoutVars,
  pmLayoutRhythm,
  pmBreakpoints,
  pmBreakpointMedia,
  pmShellDimensions,
  pmLayoutGrid,
  pmSticky,
  pmContentWidth,
  resolveMetricColumns,
  type PmBreakpoint,
} from '@/tokens/layers/layout'
export {
  pmFontFamily,
  pmTypography,
  pmTypographyScale,
  pmTypographyWeight,
  type PmTypographyRole,
} from '@/tokens/layers/typography'
export { pmRadiusVars, pmRadius, pmRadiusPolicy, type PmRadiusSize } from '@/tokens/layers/radius'
export {
  pmElevationVars,
  pmElevation,
  pmElevationLevels,
  type PmElevationLevel,
} from '@/tokens/layers/elevation'
export {
  pmMotionVars,
  pmMotion,
  pmMotionDuration,
  pmMotionDelay,
  pmMotionDistance,
  pmMotionEasing,
  pmInteraction,
  pmEnter,
  pmLoading,
  pmPipeline,
  pmOverlay,
  pmToast,
  pmReducedMotionPolicy,
  type PmMotionSpeed,
} from '@/tokens/layers/motion'
export { pmIconSize, pmIconSpacing, type PmIconSize } from '@/tokens/layers/icon'
export { pmChartVars, pmChartSemanticMapping, type PmChartVar } from '@/tokens/layers/chart'
export { pmLogicalAlign, pmLogical, pmRtlTypography, type DocumentDirection } from '@/tokens/layers/rtl'
export { pmResponsive, pmResponsiveViewports, pmResponsiveProductionWidths, type PmResponsiveViewportGroup } from '@/tokens/layers/responsive'

/** @deprecated Use pmElevation — alias for backward compatibility. */
export { pmElevation as pmShadow } from '@/tokens/layers/elevation'

/** @deprecated Use pmLayoutRhythm — alias for backward compatibility. */
export { pmLayoutRhythm as pmLayout } from '@/tokens/layers/layout'
