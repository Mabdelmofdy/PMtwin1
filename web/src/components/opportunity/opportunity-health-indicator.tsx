import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'

export type OpportunityHealthState =
  | 'Draft'
  | 'Needs Attention'
  | 'Ready to Publish'
  | 'Published'
  | 'Archived'
  | 'Withdrawn'

export type OpportunityHealthIndicatorProps = {
  readonly healthState: OpportunityHealthState
  readonly validationPercent: number
  readonly readinessPercent: number
  readonly publishReady: boolean
  readonly estimatedMatch?: string
  readonly why?: string
  readonly state?: 'loading' | 'empty' | 'normal' | 'error'
}

const TONE: Record<OpportunityHealthState, 'info' | 'warning' | 'success' | 'muted' | 'danger'> = {
  Draft: 'info',
  'Needs Attention': 'warning',
  'Ready to Publish': 'success',
  Published: 'success',
  Archived: 'muted',
  Withdrawn: 'muted',
}

/**
 * Display-only opportunity health aggregation for the detail page.
 * Business states replace generic “Healthy” labels.
 */
export function OpportunityHealthIndicator({
  healthState,
  validationPercent,
  readinessPercent,
  publishReady,
  estimatedMatch = '—',
  why = 'A quick owner overview of validation, readiness, publish readiness, and expected match quality.',
  state = 'normal',
}: OpportunityHealthIndicatorProps) {
  return (
    <OcxSummaryCard
      title="Opportunity Health"
      why={why}
      state={state}
      testId="opportunity-health-indicator"
    >
      <div className="flex flex-wrap items-center gap-2">
        <PmBadge tone={TONE[healthState]} size="sm">
          {healthState}
        </PmBadge>
        {publishReady ? (
          <PmBadge tone="success" size="sm">
            Publish Ready
          </PmBadge>
        ) : (
          <PmBadge tone="warning" size="sm">
            Not publish ready
          </PmBadge>
        )}
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-4">
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Validation
          </dt>
          <dd className="font-medium tabular-nums">{Math.round(validationPercent)}%</dd>
        </div>
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Readiness
          </dt>
          <dd className="font-medium tabular-nums">{Math.round(readinessPercent)}%</dd>
        </div>
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Estimated match
          </dt>
          <dd className="font-medium">{estimatedMatch}</dd>
        </div>
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Publish
          </dt>
          <dd className="font-medium">{publishReady ? 'Ready' : 'Blocked'}</dd>
        </div>
      </dl>
    </OcxSummaryCard>
  )
}

export function resolveOpportunityHealthState(input: {
  readonly status?: string
  readonly visibilityStatus?: string
  readonly errorCount: number
  readonly publishReady: boolean
}): OpportunityHealthState {
  const visibility = (input.visibilityStatus ?? '').toLowerCase()
  const status = (input.status ?? 'draft').toLowerCase()
  if (visibility === 'archived' || status === 'cancelled') return 'Archived'
  if (visibility === 'withdrawn') return 'Withdrawn'
  if (status === 'published' || status === 'matched' || status === 'negotiating') {
    return 'Published'
  }
  if (input.errorCount > 0) return 'Needs Attention'
  if (input.publishReady) return 'Ready to Publish'
  return 'Draft'
}
