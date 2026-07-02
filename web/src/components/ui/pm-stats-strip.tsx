import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmStatsStripItem = {
  label: string
  value: ReactNode
}

export type PmStatsStripProps = {
  items: readonly PmStatsStripItem[]
  className?: string
  'data-slot'?: string
}

/** Horizontal divided metrics strip for compact KPI rows (dashboard, list heroes). */
export function PmStatsStrip({
  items,
  className,
  'data-slot': dataSlot = 'pm-stats-strip',
}: PmStatsStripProps) {
  if (items.length === 0) return null

  return (
    <PmSurface
      data-slot={dataSlot}
      variant="muted"
      className={cn(
        'flex flex-wrap divide-y divide-border/45 rounded-3xl sm:divide-x sm:divide-y-0',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-[50%] flex-1 items-center justify-between gap-2 px-5 py-3 sm:min-w-0 sm:flex-col sm:items-start sm:gap-1 sm:py-4"
        >
          <span className={cn(pmTypography.statLabel, 'text-muted-foreground')}>
            {item.label}
          </span>
          <span className={cn(pmTypography.stat, 'tabular-nums')}>{item.value}</span>
        </div>
      ))}
    </PmSurface>
  )
}
