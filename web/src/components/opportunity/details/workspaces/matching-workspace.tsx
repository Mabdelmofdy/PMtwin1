import { Link } from 'react-router-dom'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import { RelatedMatchesPanel } from '@/components/opportunity/related-matches-panel'
import { RELATED_MATCHES_SECTION_ID } from '@/lib/publish-opportunity-feedback.ts'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'

export function MatchingWorkspace() {
  const { model, highlightRelatedMatches } = useOpportunityDetailsContext()

  if (model.workspaceVisibility.matching === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Matching unavailable"
        description="Matching details are available to the opportunity owner."
      />
    )
  }

  const { matching, collaboration, capabilities, opportunity } = model

  if (matching.count === 0) {
    return (
      <OpportunityEmptyState
        title="No Matches"
        description="No matches have been discovered yet."
        action={
          capabilities.canOpenMatching ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/matches">Browse Matches</Link>
            </PmButton>
          ) : undefined
        }
      />
    )
  }

  return (
    <div
      className="space-y-6"
      role="tabpanel"
      aria-label="Matching"
      id={RELATED_MATCHES_SECTION_ID}
    >
      <OpportunitySection title="Matching summary">
        <div className="flex flex-wrap gap-2">
          <PmBadge tone="info">{matching.count} matches</PmBadge>
          <PmBadge tone="muted">{matching.strongCount} strong</PmBadge>
          {collaboration.matchingTopology ? (
            <PmBadge tone="muted">Topology: {collaboration.matchingTopology}</PmBadge>
          ) : null}
        </div>
        <p className={cn(pmTypography.bodySm, 'mt-2 text-muted-foreground')}>
          Match scores come from the Matching Engine. Opportunity Readiness is separate and is not a match score.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PmButton size="sm" variant="outline" asChild>
            <Link
              to="/matches"
              onClick={() =>
                trackOcxEvent('opportunity_match_opened', { opportunityId: opportunity.id })
              }
            >
              Browse Matches
            </Link>
          </PmButton>
        </div>
      </OpportunitySection>

      {matching.model ? (
        <RelatedMatchesPanel
          model={matching.model}
          currentUserId={model.viewer.userId}
          canAct={capabilities.canEdit || model.viewer.isOwner}
          highlighted={highlightRelatedMatches}
          sectionId={RELATED_MATCHES_SECTION_ID}
        />
      ) : null}
    </div>
  )
}
