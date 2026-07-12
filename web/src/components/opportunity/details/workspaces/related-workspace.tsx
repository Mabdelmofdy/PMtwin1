import { Link } from 'react-router-dom'
import { useOpportunityDetailsContext } from '../opportunity-details-context.tsx'
import {
  OpportunityEmptyState,
  OpportunityRestrictedState,
  OpportunitySection,
} from '../shared/opportunity-section.tsx'
import type { OpportunityDetailsRelatedObject } from '@/lib/opportunity-details'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { ApplicationsPanel } from '@/components/opportunity/applications-panel'
import { matchingService } from '@/services/matching-service.ts'
import { peopleApi } from '@/api/people.ts'

function RelatedList({
  title,
  items,
  opportunityId,
}: {
  readonly title: string
  readonly items: readonly OpportunityDetailsRelatedObject[]
  readonly opportunityId: string
}) {
  if (items.length === 0) return null
  return (
    <OpportunitySection title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              to={item.href}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2 hover:bg-muted/40"
              onClick={() =>
                trackOcxEvent('opportunity_related_object_opened', {
                  opportunityId,
                  type: item.type,
                  id: item.id,
                })
              }
            >
              <div>
                <p className={cn(pmTypography.label)}>{item.title}</p>
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{item.id}</p>
              </div>
              {item.status ? <PmBadge tone="muted">{item.status}</PmBadge> : null}
            </Link>
          </li>
        ))}
      </ul>
    </OpportunitySection>
  )
}

export function RelatedWorkspace() {
  const { model } = useOpportunityDetailsContext()

  if (model.workspaceVisibility.related === 'restricted') {
    return (
      <OpportunityRestrictedState
        title="Related objects restricted"
        description="Related lifecycle objects are available to authorized participants only."
      />
    )
  }

  const { related, visibility, opportunity } = model
  const hasAny =
    related.matches.length > 0
    || related.negotiations.length > 0
    || related.agreements.length > 0
    || related.contracts.length > 0
    || (visibility.showLegacyApplications && related.applications.length > 0)

  if (!hasAny && !visibility.showLegacyApplications) {
    return (
      <OpportunityEmptyState
        title="No related objects"
        description="No matches, negotiations, agreements, or contracts are linked yet."
      />
    )
  }

  const applications = visibility.showLegacyApplications
    ? matchingService
        .sortApplicationsByValueScore(matchingService.getFilteredApplications(opportunity.id))
        .map((app) => ({
          ...app,
          applicant: peopleApi.get(app.applicantId),
        }))
    : []

  return (
    <div className="space-y-6" role="tabpanel" aria-label="Related Objects">
      <RelatedList title="Matches" items={related.matches} opportunityId={opportunity.id} />
      <RelatedList title="Negotiations" items={related.negotiations} opportunityId={opportunity.id} />
      <RelatedList
        title="Commercial Agreements"
        items={related.agreements}
        opportunityId={opportunity.id}
      />
      {(visibility.showContractSection || related.contracts.length > 0) && (
        <RelatedList title="Contracts" items={related.contracts} opportunityId={opportunity.id} />
      )}
      {visibility.showLegacyApplications ? (
        <OpportunitySection title="Applications">
          {applications.length === 0 ? (
            <OpportunityEmptyState
              title="No applications"
              description="No hiring applications are recorded for this opportunity."
            />
          ) : (
            <ApplicationsPanel
              applications={applications}
              canManage={model.viewer.isOwner}
              opportunityClosed={['contracted', 'completed', 'closed', 'cancelled'].includes(
                (opportunity.status ?? '').toLowerCase(),
              )}
            />
          )}
        </OpportunitySection>
      ) : null}
    </div>
  )
}
