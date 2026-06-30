import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { pmInteraction, pmMotion, pmTypography } from '@/tokens'

import { PmCard } from '@/components/ui/pm-card'



export type PmStatCardProps = {

  label: string

  value: string | number

  hint?: string

  trend?: ReactNode

  icon?: ReactNode

  className?: string

  /** Compact variant for admin dense grids */

  dense?: boolean

}



export function PmStatCard({

  label,

  value,

  hint,

  trend,

  icon,

  className,

  dense = false,

}: PmStatCardProps) {

  return (

    <PmCard

      data-slot="pm-stat-card"

      variant="interactive"

      padding={dense ? 'dense' : 'default'}

      className={cn(pmMotion.base, pmInteraction.card, 'bg-gradient-to-b from-card to-surface', className)}

    >

      <div className="flex items-start justify-between gap-3">

        <p className={pmTypography.statLabel}>{label}</p>

        {icon ? (

          <div

            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-muted text-primary shadow-sm"

            aria-hidden

          >

            {icon}

          </div>

        ) : null}

      </div>

      <div className={cn('mt-2 flex items-baseline gap-2', dense && 'mt-1.5')}>

        <p className={cn(pmTypography.stat, dense && 'text-2xl md:text-[1.75rem]')}>

          {value}

        </p>

        {trend}

      </div>

      {hint ? <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground/95')}>{hint}</p> : null}

    </PmCard>

  )

}

