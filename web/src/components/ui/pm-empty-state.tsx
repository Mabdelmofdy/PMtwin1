import type { ReactNode } from 'react'
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
  className?: string
  size?: 'default' | 'compact'
}

export function PmEmptyState({
  title,
  description,
  icon,
  action,
  className,
  size = 'default',
}: PmEmptyStateProps) {
  const reducedMotion = usePmReducedMotion()
  const variants = pmEmptyStateVariants(reducedMotion)

  return (
    <PmSurface
      data-slot="pm-empty-state"
      variant="muted"
      className={cn(
        'flex flex-col items-center justify-center border-dashed border-border/80 bg-gradient-to-b from-surface-muted to-surface text-center',
        !reducedMotion && pmEnter.empty,
        size === 'default' ? 'px-6 py-16' : 'px-4 py-10',
        className,
      )}
    >
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <motion.h2
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
      {action ? (
        <motion.div className="mt-4" {...variants.cta}>
          {action}
        </motion.div>
      ) : null}
    </PmSurface>
  )
}
