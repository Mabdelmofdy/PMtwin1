import type { Opportunity } from '@/types/domain.ts'
import { PmBadge } from '@/components/ui/pm-index'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'
import { cn } from '@/lib/utils'

export type CollaborationTaxonomyBadgesProps = {
  readonly opportunity: Pick<
    Opportunity,
    | 'mainCollaborationModel'
    | 'modelType'
    | 'subModelType'
    | 'exchangeMode'
    | 'preferredMatchingTopology'
    | 'acceptedExchangeModes'
    | 'paymentModes'
  >
  readonly compact?: boolean
  readonly className?: string
}

/** Human-readable collaboration taxonomy chips for list and detail surfaces. */
export function CollaborationTaxonomyBadges({
  opportunity,
  compact = false,
  className,
}: CollaborationTaxonomyBadgesProps) {
  const labels = resolveOpportunityTaxonomyLabels(opportunity)

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <PmBadge tone="neutral" size="sm">
        {labels.mainModel}
      </PmBadge>
      <PmBadge tone="info" size="sm">
        {labels.subModel}
      </PmBadge>
      {!compact ? (
        <PmBadge tone="muted" size="sm">
          {labels.exchangeMode}
        </PmBadge>
      ) : null}
    </div>
  )
}
