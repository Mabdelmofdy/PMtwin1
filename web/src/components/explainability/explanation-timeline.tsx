import type { ExplanationBundle } from '@pm-twin/explainability'
import { TIMELINE_EVENT_STATUS } from '@pm-twin/explainability'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmTimeline } from '@/components/ui/pm-timeline'

function mapTimelineStatus(
  status: ExplanationBundle['timeline'][number]['status'],
): 'done' | 'active' | 'upcoming' {
  if (status === TIMELINE_EVENT_STATUS.COMPLETED) return 'done'
  if (
    status === TIMELINE_EVENT_STATUS.ACTIVE
    || status === TIMELINE_EVENT_STATUS.PENDING
    || status === TIMELINE_EVENT_STATUS.BLOCKED
  ) {
    return status === TIMELINE_EVENT_STATUS.ACTIVE ? 'active' : 'upcoming'
  }
  return 'upcoming'
}

export function ExplanationTimeline({
  bundle,
  className,
  heading = 'Timeline',
}: {
  bundle: ExplanationBundle
  className?: string
  heading?: string
}) {
  if (bundle.timeline.length === 0) return null

  return (
    <div className={cn('space-y-2', className)} data-slot="explanation-timeline">
      <p className={cn(pmTypography.label)}>{heading}</p>
      <PmTimeline
        bare
        events={bundle.timeline.map((event, index) => ({
          id: `${event.type}-${index}`,
          label: event.title,
          description: event.description,
          timestamp: event.timestamp,
          status: mapTimelineStatus(event.status),
        }))}
      />
    </div>
  )
}
