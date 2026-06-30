/**
 * Layer 6 — Radius Tokens
 * Border radius scale derived from --radius base.
 * CSS source: web/src/index.css @theme inline --radius-*
 */

export const pmRadiusVars = {
  base: '--radius',
  sm: '--radius-sm',
  md: '--radius-md',
  lg: '--radius-lg',
  xl: '--radius-xl',
  '2xl': '--radius-2xl',
  '3xl': '--radius-3xl',
  '4xl': '--radius-4xl',
} as const

/** Tailwind radius utility class names. */
export const pmRadius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const

/**
 * Future scaling policy: modify --radius in theme layer only.
 * Component tokens reference pmRadius.* — never raw pixel values.
 */
export const pmRadiusPolicy = {
  cardDefault: 'xl',
  buttonDefault: 'lg',
  inputDefault: 'md',
  badgeDefault: 'md',
} as const

export type PmRadiusSize = keyof typeof pmRadius
