import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmCardActions, type PmCardActionSlot } from '@/components/ui/pm-more-actions'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmEntityListCardProps = {
  title: ReactNode
  href: string
  badge?: ReactNode
  meta?: ReactNode
  primary: PmCardActionSlot
  secondary?: PmCardActionSlot
  className?: string
}

/** Mobile list card: title link + badge + meta + PmCardActions footer. */
export function PmEntityListCard({
  title,
  href,
  badge,
  meta,
  primary,
  secondary,
  className,
}: PmEntityListCardProps) {
  return (
    <PmSurface
      data-slot="pm-entity-list-card"
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col gap-1 p-4 md:p-5', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={href}
          className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}
        >
          {title}
        </Link>
        {badge}
      </div>
      {meta ? (
        <p className={cn('mt-2 leading-relaxed', pmTypography.caption, 'text-muted-foreground')}>{meta}</p>
      ) : null}
      <PmCardActions className="mt-4" primary={primary} secondary={secondary} />
    </PmSurface>
  )
}
