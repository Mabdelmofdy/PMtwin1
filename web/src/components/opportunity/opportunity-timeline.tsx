import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  COLLABORATION_FLOW_STEPS,
  formatCollaborationFlowStepLabel,
  type CollaborationFlowStep,
} from '@/components/opportunity/opportunity-collaboration-constants'

export type OpportunityTimelineEvent = {
  readonly id: string
  readonly label: string
  readonly timestamp?: string
  readonly description?: string
  readonly status?: 'done' | 'active' | 'upcoming'
}

type OpportunityTimelineProps = {
  activeStep?: CollaborationFlowStep
  events?: readonly OpportunityTimelineEvent[]
  className?: string
  title?: string
}

/** Collaboration path strip + optional activity timeline — visual only. */
export function OpportunityTimeline({
  activeStep = 'Opportunity',
  events = [],
  className,
  title = 'Collaboration timeline',
}: OpportunityTimelineProps) {
  const activeIndex = COLLABORATION_FLOW_STEPS.indexOf(activeStep)

  return (
    <div className={cn('space-y-4', className)} data-slot="opportunity-timeline">
      <PmSurface variant="muted" className="px-4 py-3">
        <p className={cn(pmTypography.overline, 'mb-2 text-muted-foreground')}>
          Canonical collaboration path
        </p>
        <ol className={cn('flex flex-wrap items-center gap-1', pmTypography.bodySm)} aria-label="Collaboration path">
          {COLLABORATION_FLOW_STEPS.map((step, index) => {
            const isActive = index === activeIndex
            const isPast = index < activeIndex
            return (
              <li key={step} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground rtl:rotate-180"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5',
                    isActive && 'bg-primary/10 font-semibold text-primary ring-1 ring-primary/20',
                    isPast && !isActive && 'text-foreground',
                    !isActive && !isPast && 'text-muted-foreground',
                  )}
                >
                  {formatCollaborationFlowStepLabel(step)}
                </span>
              </li>
            )
          })}
        </ol>
      </PmSurface>

      {events.length > 0 ? (
        <PmSurface variant="default" className="p-4">
          <h3 className={pmTypography.h3}>{title}</h3>
          <ol className="mt-4 space-y-4">
            {events.map((event, index) => (
              <li key={event.id} className="flex gap-3">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    event.status === 'done' && 'bg-success',
                    event.status === 'active' && 'bg-primary ring-4 ring-primary/20',
                    (!event.status || event.status === 'upcoming') && 'bg-muted-foreground/40',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 border-s border-border/40 ps-3 last:border-0">
                  <p className={cn(pmTypography.label)}>{event.label}</p>
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
                  {index < events.length - 1 ? null : null}
                </div>
              </li>
            ))}
          </ol>
        </PmSurface>
      ) : null}
    </div>
  )
}
