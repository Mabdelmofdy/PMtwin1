import type { ReactNode } from 'react'
import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { pmEnter, pmTypography } from '@/tokens'
import { pmEmptyStateVariants } from '@/components/motion/pm-motion-presets'
import { usePmReducedMotion } from '@/components/motion/use-pm-reduced-motion'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmEmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
  size?: 'default' | 'compact'
  /** DOM data-slot — defaults to pm-empty-state. */
  dataSlot?: string
}

export function PmEmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
  size = 'default',
  dataSlot = 'pm-empty-state',
}: PmEmptyStateProps) {
  const reducedMotion = usePmReducedMotion()
  const variants = pmEmptyStateVariants(reducedMotion)
  const titleId = useId()

  return (
    <PmSurface
      data-slot={dataSlot}
      role="status"
      aria-labelledby={titleId}
      variant="muted"
      className={cn(
        'flex flex-col items-center justify-center border-dashed border-border/75 bg-gradient-to-b from-surface-muted/70 via-surface to-surface text-center',
        !reducedMotion && pmEnter.empty,
        size === 'default' ? 'px-6 py-16' : 'px-5 py-11',
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted-foreground" aria-hidden>{icon}</div> : null}
      <motion.h2
        id={titleId}
        className={size === 'default' ? pmTypography.h3 : pmTypography.label}
        {...variants.container}
      >
        {title}
      </motion.h2>
      {description ? (
        <motion.p
          className={cn(
            pmTypography.bodySm,
            'mt-2 max-w-md break-words text-muted-foreground',
          )}
          {...variants.container}
        >
          {description}
        </motion.p>
      ) : null}
      {action || secondaryAction ? (
        <motion.div
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
          {...variants.cta}
        >
          {action}
          {secondaryAction}
        </motion.div>
      ) : null}
    </PmSurface>
  )
}
