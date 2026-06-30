import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { pmEnter, pmTypography } from '@/tokens'
import { PmAnimatedMetric } from '@/components/motion/pm-animated-metric'
import { usePmDirection } from '@/components/layout/pm-direction-provider'
import { pmHeroRevealVariants } from '@/components/motion/pm-motion-presets'
import { usePmReducedMotion } from '@/components/motion/use-pm-reduced-motion'

export type PmPageHeroMetricProps = {
  value: ReactNode
  label: string
  className?: string
  /** Count-up animation when value is numeric — respects reduced motion. */
  animate?: boolean
}

/** Hero KPI block for PmPageHeader `metric` slot — stat value + overline label. */
export function PmPageHeroMetric({
  value,
  label,
  className,
  animate = true,
}: PmPageHeroMetricProps) {
  const reducedMotion = usePmReducedMotion()
  const { direction } = usePmDirection()
  const heroVariants = pmHeroRevealVariants(reducedMotion, direction)

  if (animate && typeof value === 'number') {
    return (
      <motion.div
        data-slot="pm-page-hero-metric"
        className={cn(!reducedMotion && pmEnter.hero, className)}
        {...heroVariants}
      >
        <PmAnimatedMetric value={value} label={label} />
      </motion.div>
    )
  }

  return (
    <motion.div
      data-slot="pm-page-hero-metric"
      className={cn('min-w-0 max-w-full space-y-0.5', !reducedMotion && pmEnter.hero, className)}
      {...heroVariants}
    >
      <p className={cn(pmTypography.stat, 'break-words')}>{value}</p>
      <p className={cn(pmTypography.statLabel, 'truncate')}>{label}</p>
    </motion.div>
  )
}
