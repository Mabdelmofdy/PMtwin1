/**
 * Framer Motion presets aligned with DDS-005 motion tokens.
 * Use with usePmReducedMotion() — never bypass reduced-motion policy.
 */

import {
  pmMotionDelay,
  pmMotionDistance,
  pmMotionDuration,
  pmMotionEasing,
} from '@/tokens/layers/motion'
import {
  resolveInlineStartRevealOffset,
  type DocumentDirection,
} from '@/components/layout/pm-direction-bridge'

const msToS = (ms: number) => ms / 1000

export const pmFramerTransition = {
  fast: {
    duration: msToS(pmMotionDuration.fast),
    ease: pmMotionEasing.outTuple,
  },
  base: {
    duration: msToS(pmMotionDuration.base),
    ease: pmMotionEasing.outTuple,
  },
  slow: {
    duration: msToS(pmMotionDuration.slow),
    ease: pmMotionEasing.outTuple,
  },
  spring: {
    duration: msToS(pmMotionDuration.base),
    ease: pmMotionEasing.spring,
  },
} as const

/** Page content enter — used by AppPageChrome. */
export function pmPageEnterVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 },
    }
  }
  return {
    initial: { opacity: 0, y: pmMotionDistance.sm },
    animate: { opacity: 1, y: 0 },
    transition: pmFramerTransition.base,
  }
}

/** Hero metric reveal — page header KPI slot. */
export function pmHeroRevealVariants(
  reducedMotion: boolean,
  direction: DocumentDirection = 'ltr',
) {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, x: 0 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0 },
    }
  }
  const x = resolveInlineStartRevealOffset(direction, pmMotionDistance.sm)
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0 },
    transition: {
      ...pmFramerTransition.base,
      delay: msToS(pmMotionDelay.short),
    },
  }
}

/** Empty state soft reveal with optional CTA delay. */
export function pmEmptyStateVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      container: { initial: { opacity: 1 }, animate: { opacity: 1 } },
      cta: { initial: { opacity: 1 }, animate: { opacity: 1 } },
    }
  }
  return {
    container: {
      initial: { opacity: 0, y: pmMotionDistance.sm },
      animate: { opacity: 1, y: 0 },
      transition: pmFramerTransition.base,
    },
    cta: {
      initial: { opacity: 0, y: pmMotionDistance.sm },
      animate: { opacity: 1, y: 0 },
      transition: {
        ...pmFramerTransition.fast,
        delay: msToS(pmMotionDelay.base),
      },
    },
  }
}

/** KPI counter animation duration (seconds). */
export function pmMetricCountDuration(reducedMotion: boolean): number {
  return reducedMotion ? 0 : msToS(pmMotionDuration.slow)
}
