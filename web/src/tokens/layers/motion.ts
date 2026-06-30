/**
 * Layer 8 — Motion Tokens
 * Duration, easing, and reduced-motion policy.
 * CSS source: web/src/index.css --motion-*
 */

export const pmMotionVars = {
  fast: '--motion-fast',
  base: '--motion-base',
  slow: '--motion-slow',
  easeOut: '--motion-ease-out',
  easeSpring: '--motion-ease-spring',
} as const

/** Motion utility class names. */
export const pmMotion = {
  fast: 'pm-motion-fast',
  base: 'pm-motion-base',
  slow: 'pm-motion-slow',
  spring: 'pm-motion-spring',
} as const

/** Documented durations (mirror CSS values for JS checks). */
export const pmMotionDuration = {
  fast: '120ms',
  normal: '180ms',
  slow: '240ms',
  hover: '120ms',
  transition: '180ms',
} as const

export const pmMotionEasing = {
  out: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  spring: 'cubic-bezier(0.34, 1.2, 0.64, 1)',
} as const

/** Reduced motion: index.css @media (prefers-reduced-motion: reduce) collapses all transitions. */
export const pmReducedMotionPolicy = 'global-collapse' as const

export type PmMotionSpeed = keyof typeof pmMotion
