import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmTimelineEventStatus = 'done' | 'active' | 'upcoming'

export type PmTimelineEvent = {
  readonly id: string
  readonly label: string
  readonly timestamp?: string
  readonly description?: string
  readonly status?: PmTimelineEventStatus
  readonly meta?: ReactNode
}

export type PmTimelineProps = {
  events: readonly PmTimelineEvent[]
  title?: string
  className?: string
  /** Render without surrounding surface (for embedding in cards). */
  bare?: boolean
  'aria-label'?: string
}

function markerClass(status?: PmTimelineEventStatus): string {
  if (status === 'done') return 'bg-success'
  if (status === 'active') return 'bg-primary ring-4 ring-primary/20'
  return 'bg-muted-foreground/40'
}

/**
 * Canonical vertical activity timeline (DS v2).
 * Consolidates opportunity/collaboration timeline event rendering.
 */
export function PmTimeline({
  events,
  title,
  className,
  bare = false,
  'aria-label': ariaLabel = 'Activity timeline',
}: PmTimelineProps) {
  if (events.length === 0) return null

  const list = (
    <ol className="space-y-4" aria-label={ariaLabel}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1
        return (
          <li key={event.id} className="relative flex gap-3">
            <span className="flex flex-col items-center">
              <span
                className={cn('mt-1 size-2.5 shrink-0 rounded-full', markerClass(event.status))}
                aria-hidden
              />
              {!isLast ? (
                <span className="mt-1 w-px flex-1 bg-border/60" aria-hidden />
              ) : null}
            </span>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={pmTypography.label}>{event.label}</p>
                {event.meta ?? null}
              </div>
              {event.description ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {event.description}
                </p>
              ) : null}
              {event.timestamp ? (
                <p className={cn(pmTypography.caption, 'mt-0.5 text-muted-foreground')}>
                  {event.timestamp}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )

  if (bare) {
    return (
      <div data-slot="pm-timeline" className={className}>
        {title ? <h3 className={cn(pmTypography.h3, 'mb-4')}>{title}</h3> : null}
        {list}
      </div>
    )
  }

  return (
    <PmSurface data-slot="pm-timeline" variant="default" className={cn('p-4', className)}>
      {title ? <h3 className={cn(pmTypography.h3, 'mb-4')}>{title}</h3> : null}
      {list}
    </PmSurface>
  )
}
