import { PmBadge } from '@/components/ui/pm-index'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import {
  formatOpportunityIntent,
  formatOpportunityOwnershipLabel,
  resolveOpportunityIntentBadgeTone,
  resolveOpportunityOwnershipBadgeTone,
  resolveOpportunityOwnershipScope,
} from '@/components/opportunity/opportunity-display'
import type { Opportunity } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

export type OpportunityIdentityBadgesProps = {
  readonly opportunity: Opportunity
  readonly viewerUserId?: string | null
  readonly viewerOrganizationId?: string | null
  readonly creatorOrganizationId?: string | null
  readonly showStatus?: boolean
  readonly className?: string
}

/** Ownership + intent (+ optional status) chips in consistent enterprise order. */
export function OpportunityIdentityBadges({
  opportunity,
  viewerUserId,
  viewerOrganizationId,
  creatorOrganizationId,
  showStatus = false,
  className,
}: OpportunityIdentityBadgesProps) {
  const ownership = resolveOpportunityOwnershipScope({
    opportunity,
    viewerUserId,
    viewerOrganizationId,
    creatorOrganizationId,
  })
  const intentLabel = formatOpportunityIntent(opportunity.intent)

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <PmBadge tone={resolveOpportunityOwnershipBadgeTone(ownership)} size="sm">
        {formatOpportunityOwnershipLabel(ownership)}
      </PmBadge>
      {intentLabel !== '—' ? (
        <PmBadge
          tone={resolveOpportunityIntentBadgeTone(opportunity.intent)}
          size="sm"
          uppercase
        >
          {intentLabel}
        </PmBadge>
      ) : null}
      {showStatus ? <OpportunityStatusBadge status={opportunity.status} /> : null}
    </div>
  )
}
