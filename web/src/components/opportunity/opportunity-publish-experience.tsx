import { cn } from '@/lib/utils'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmReadinessScoreBadge } from '@/components/ui/pm-readiness-score-badge'
import { PmButton } from '@/components/ui/pm-button'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { resolvePublishVisualState } from '@/components/opportunity/opportunity-display'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import { PublishReadinessAlert } from '@/components/readiness/publish-readiness-alert'
import type { Opportunity } from '@/types/domain.ts'

const STATE_COPY: Record<
  ReturnType<typeof resolvePublishVisualState>,
  { label: string; tone: 'muted' | 'success' | 'warning' | 'info' }
> = {
  draft: { label: 'Draft', tone: 'muted' },
  ready: { label: 'Ready to publish', tone: 'success' },
  blocked: { label: 'Publish blocked', tone: 'warning' },
  published: { label: 'Published', tone: 'info' },
}

export type OpportunityPublishPanelProps = {
  opportunity: Opportunity
  publishDetails?: readonly string[] | null
  onPublish?: () => void
  showPublishButton?: boolean
  className?: string
}

/** Publish experience chrome — draft / ready / blocked / published visuals. */
export function OpportunityPublishPanel({
  opportunity,
  publishDetails,
  onPublish,
  showPublishButton = false,
  className,
}: OpportunityPublishPanelProps) {
  const readiness = resolveOpportunityReadiness(opportunity)
  const visualState = resolvePublishVisualState(opportunity.status, readiness.status)
  const copy = STATE_COPY[visualState]

  return (
    <div className={cn('space-y-3', className)} data-slot="opportunity-publish-panel">
      <PmContentCard
        title="Publish for matching"
        description="Publishing makes this opportunity visible for matching once profile and opportunity readiness are complete."
      >
        <div className="flex flex-wrap items-center gap-2">
          <PmBadge tone={copy.tone}>{copy.label}</PmBadge>
          <PmReadinessScoreBadge score={readiness.score} variant="compact" />
        </div>

        {publishDetails ? (
          <div className="mt-3">
            <PublishReadinessAlert details={publishDetails} />
          </div>
        ) : null}

        {showPublishButton && onPublish ? (
          <PmButton className="mt-4 w-full" onClick={onPublish}>
            Publish for matching
          </PmButton>
        ) : null}
      </PmContentCard>
    </div>
  )
}

export type OpportunityPublishExperienceProps = {
  publishDetails?: readonly string[] | null
  className?: string
}

/** Inline publish blocked alert for wizard — visual wrapper only. */
export function OpportunityPublishExperience({
  publishDetails,
  className,
}: OpportunityPublishExperienceProps) {
  if (!publishDetails?.length) return null

  return (
    <div className={className} data-slot="opportunity-publish-experience">
      <PublishReadinessAlert details={publishDetails} />
    </div>
  )
}
