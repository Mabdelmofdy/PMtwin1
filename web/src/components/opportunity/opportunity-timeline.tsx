import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmTimeline, type PmTimelineEvent } from '@/components/ui/pm-timeline'
import {
  COLLABORATION_FLOW_STEPS,
  formatCollaborationFlowStepLabel,
  type CollaborationFlowStep,
} from '@/components/opportunity/opportunity-collaboration-constants'

export type OpportunityTimelineEvent = PmTimelineEvent

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

      {events.length > 0 ? <PmTimeline events={events} title={title} /> : null}
    </div>
  )
}
