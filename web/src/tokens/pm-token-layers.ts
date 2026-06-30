/**
 * PM-Twin Adaptive Token Architecture — layer identifiers.
 * Authority: DDS-002. Constitutional parent: DDS-001.
 */

export const PM_TOKEN_LAYERS = [
  'brand',
  'semantic',
  'component',
  'layout',
  'typography',
  'radius',
  'elevation',
  'motion',
  'icon',
  'chart',
] as const

export type PmTokenLayer = (typeof PM_TOKEN_LAYERS)[number]

/** Official dependency chain — higher layers may depend on lower, never reverse. */
export const PM_TOKEN_DEPENDENCY_ORDER: readonly PmTokenLayer[] = [
  'brand',
  'semantic',
  'typography',
  'radius',
  'elevation',
  'motion',
  'icon',
  'layout',
  'component',
  'chart',
] as const
