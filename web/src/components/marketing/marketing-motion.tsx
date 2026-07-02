/**
 * Shared motion variants for public marketing pages.
 * Respects prefers-reduced-motion via usePmReducedMotion.
 */

import type { HTMLMotionProps, Variants } from 'framer-motion'
import { usePmReducedMotion } from '@/components/motion/use-pm-reduced-motion'
import {
  pmMotionDelay,
  pmMotionDistance,
  pmMotionDuration,
  pmMotionEasing,
} from '@/tokens/layers/motion'

const msToS = (ms: number) => ms / 1000

export const marketingMotionDuration = {
  fast: msToS(150),
  base: msToS(280),
  slow: msToS(480),
  hero: msToS(560),
} as const

export const marketingMotionEase = pmMotionEasing.outTuple

/** Fade-up reveal for sections and blocks. */
export function marketingFadeUpVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    }
  }
  return {
    hidden: { opacity: 0, y: pmMotionDistance.lg },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: marketingMotionDuration.slow,
        ease: marketingMotionEase,
      },
    },
  }
}

/** Stagger children inside a section grid or list. */
export function marketingStaggerContainerVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: {},
      visible: { transition: { staggerChildren: 0 } },
    }
  }
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: msToS(pmMotionDelay.stagger),
        delayChildren: msToS(pmMotionDelay.short),
      },
    },
  }
}

/** Card item inside a stagger container. */
export function marketingStaggerItemVariants(reducedMotion: boolean): Variants {
  return marketingFadeUpVariants(reducedMotion)
}

/** Subtle hover lift for interactive cards. */
export function marketingCardHoverProps(reducedMotion: boolean): Pick<
  HTMLMotionProps<'div'>,
  'whileHover' | 'whileTap' | 'transition'
> {
  if (reducedMotion) {
    return { transition: { duration: 0 } }
  }
  return {
    whileHover: {
      y: -4,
      transition: { duration: msToS(pmMotionDuration.hover), ease: marketingMotionEase },
    },
    whileTap: { scale: 0.995 },
    transition: { duration: msToS(pmMotionDuration.transition), ease: marketingMotionEase },
  }
}

/** Very subtle infinite float for hero visuals only. */
export function marketingHeroVisualFloatProps(reducedMotion: boolean): Pick<
  HTMLMotionProps<'div'>,
  'animate' | 'transition'
> {
  if (reducedMotion) {
    return { animate: { y: 0 }, transition: { duration: 0 } }
  }
  return {
    animate: { y: [0, -6, 0] },
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }
}

/** Hero text entrance — title, subtitle, actions. */
export function marketingHeroTextVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    }
  }
  return {
    hidden: { opacity: 0, y: pmMotionDistance.md },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: marketingMotionDuration.hero,
        ease: marketingMotionEase,
      },
    },
  }
}

export function marketingHeroStaggerVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: {},
      visible: { transition: { staggerChildren: 0 } },
    }
  }
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: msToS(pmMotionDelay.base),
        delayChildren: msToS(pmMotionDelay.short),
      },
    },
  }
}

/** Cross-fade for tab panels. */
export function marketingTabPanelVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
      exit: { opacity: 1 },
    }
  }
  return {
    hidden: { opacity: 0, y: pmMotionDistance.sm },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: marketingMotionDuration.base, ease: marketingMotionEase },
    },
    exit: {
      opacity: 0,
      y: -pmMotionDistance.sm,
      transition: { duration: marketingMotionDuration.fast, ease: marketingMotionEase },
    },
  }
}

/** Hook returning all marketing motion helpers with reduced-motion state. */
export function useMarketingMotion() {
  const reducedMotion = usePmReducedMotion()
  return {
    reducedMotion,
    fadeUp: marketingFadeUpVariants(reducedMotion),
    staggerContainer: marketingStaggerContainerVariants(reducedMotion),
    staggerItem: marketingStaggerItemVariants(reducedMotion),
    cardHover: marketingCardHoverProps(reducedMotion),
    heroVisualFloat: marketingHeroVisualFloatProps(reducedMotion),
    heroText: marketingHeroTextVariants(reducedMotion),
    heroStagger: marketingHeroStaggerVariants(reducedMotion),
    tabPanel: marketingTabPanelVariants(reducedMotion),
    viewport: reducedMotion
      ? { once: true, amount: 0.1 as const }
      : { once: true, amount: 0.2 as const, margin: '-40px' as const },
  }
}
