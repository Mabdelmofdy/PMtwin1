import { useEffect } from 'react'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'

export function HistoryWorkspace() {
  const { model } = useOpportunityDetailsContext()

  useEffect(() => {
    if (model.capabilities.canViewHistory) {
      trackOcxEvent('opportunity_history_viewed', {
        opportunityId: model.opportunity.id,
        count: model.history.length,
      })
    }
  }, [model.capabilities.canViewHistory, model.history.length, model.opportunity.id])

  if (!model.capabilities.canViewHistory) {
    return (
      <OpportunityRestrictedState
        title="History restricted"
        description="Activity history is available to authorized viewers only."
      />
    )
  }

  if (model.history.length === 0) {
    return (
      <OpportunityEmptyState
        title="No History"
        description="No additional activity has been recorded."
      />
    )
  }

  return (
    <div className="space-y-4" role="tabpanel" aria-label="History">
      <OpportunitySection title="Activity timeline">
        <ol className="relative space-y-4 border-s border-border ps-4">
          {model.history.map((event) => (
            <li key={event.id} className="relative">
              <span
                className="absolute -start-[1.3rem] top-1.5 size-2.5 rounded-full bg-muted-foreground/70"
                aria-hidden
              />
              <p className={cn(pmTypography.label)}>{event.label}</p>
              {event.timestampLabel ? (
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  <time dateTime={event.timestamp}>{event.timestampLabel}</time>
                </p>
              ) : null}
              {event.description ? (
                <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>
                  {event.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </OpportunitySection>
    </div>
  )
}
