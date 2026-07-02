import { peopleApi } from '@/api/people.ts'
import {
  OpportunityIdentityBadges,
  type OpportunityIdentityBadgesProps,
} from '@/components/opportunity/opportunity-identity'

export type OpportunityListLabelsProps = Omit<
  OpportunityIdentityBadgesProps,
  'creatorOrganizationId'
>

/** Colored ownership / need / offer chips for list cards. */
export function OpportunityListLabels({
  opportunity,
  viewerUserId,
  viewerOrganizationId,
  showStatus,
  className,
}: OpportunityListLabelsProps) {
  const creator = opportunity.creatorId
    ? peopleApi.get(opportunity.creatorId)
    : undefined

  return (
    <OpportunityIdentityBadges
      opportunity={opportunity}
      viewerUserId={viewerUserId}
      viewerOrganizationId={viewerOrganizationId}
      creatorOrganizationId={creator?.organizationId}
      showStatus={showStatus}
      className={className}
    />
  )
}
