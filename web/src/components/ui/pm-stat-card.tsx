import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmMotion, pmTypography } from '@/components/shared/pm-design-tokens'
import { PmCard } from '@/components/ui/pm-card'

export type PmStatCardProps = {
  label: string
  value: string | number
  hint?: string
  trend?: ReactNode
  className?: string
  /** Compact variant for admin dense grids */
  dense?: boolean
}

export function PmStatCard({
  label,
  value,
  hint,
  trend,
  className,
  dense = false,
}: PmStatCardProps) {
  return (
    <PmCard
      data-slot="pm-stat-card"
      variant="interactive"
      padding={dense ? 'dense' : 'default'}
      className={cn(pmMotion.base, className)}
    >
      <p className={pmTypography.caption}>{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className={cn(pmTypography.mono, dense ? 'text-xl' : 'text-2xl')}>
          {value}
        </p>
        {trend}
      </div>
      {hint ? <p className={cn(pmTypography.caption, 'mt-1')}>{hint}</p> : null}
    </PmCard>
  )
}
