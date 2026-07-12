import { Link } from 'react-router-dom'
import type { AdminTimelineEvent } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminUniversalTimelineProps = {
  readonly events: readonly AdminTimelineEvent[]
  readonly title?: string
  readonly className?: string
}

function sortChronological(
  events: readonly AdminTimelineEvent[],
): AdminTimelineEvent[] {
  return [...events].sort((a, b) => {
    const byTime = a.timestamp.localeCompare(b.timestamp)
    if (byTime !== 0) return byTime
    return a.sequence - b.sequence
  })
}

export function AdminUniversalTimeline({
  events,
  title = 'Timeline',
  className,
}: AdminUniversalTimelineProps) {
  const sorted = sortChronological(events)

  return (
    <PmContentCard title={title} className={className}>
      {sorted.length === 0 ? (
        <PmEmptyState
          title="No timeline events"
          description="Activity for this record will appear here."
          size="compact"
        />
      ) : (
        <ol className="relative space-y-0 border-s border-border/60 ms-2" role="list">
          {sorted.map((event) => {
            const body = (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={pmTypography.label}>{event.title}</p>
                  <PmBadge tone="muted" size="sm">
                    {event.kind}
                  </PmBadge>
                </div>
                {event.description ? (
                  <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {event.description}
                  </p>
                ) : null}
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  {event.timestamp}
                </p>
              </div>
            )

            return (
              <li key={event.id} className="relative ps-6 py-3">
                <span
                  className="absolute start-0 top-5 size-2 -translate-x-1/2 rounded-full bg-primary/70"
                  aria-hidden
                />
                {event.href ? (
                  <Link
                    to={event.href}
                    className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ol>
      )}
    </PmContentCard>
  )
}
