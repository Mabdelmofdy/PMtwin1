import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import type { Opportunity } from '@/types/domain.ts'

type OpportunitySummaryCardProps = {
  readonly opportunity: Opportunity
  readonly creatorName?: string
  readonly skillCount: number
}

export function OpportunitySummaryCard({
  opportunity,
  creatorName,
  skillCount,
}: OpportunitySummaryCardProps) {
  return (
    <PmContentCard
      title="Overview"
      description="Summary of this opportunity posting."
      actions={<OpportunityStatusBadge status={opportunity.status} />}
    >
      {opportunity.description ? (
        <p className={cn(pmTypography.bodySm, 'line-clamp-4 text-muted-foreground')}>
          {opportunity.description}
        </p>
      ) : (
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No description provided.</p>
      )}
      <dl className={cn(pmTypography.caption, 'mt-4 grid gap-2 sm:grid-cols-2')}>
        {opportunity.location ? (
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium text-foreground">{opportunity.location}</dd>
          </div>
        ) : null}
        {creatorName ? (
          <div>
            <dt className="text-muted-foreground">Posted by</dt>
            <dd className="font-medium text-foreground">{creatorName}</dd>
          </div>
        ) : null}
        {opportunity.exchangeMode ? (
          <div>
            <dt className="text-muted-foreground">Exchange</dt>
            <dd className="font-medium text-foreground">{opportunity.exchangeMode}</dd>
          </div>
        ) : null}
        {opportunity.modelType ? (
          <div>
            <dt className="text-muted-foreground">Model</dt>
            <dd className="font-medium text-foreground">{opportunity.modelType}</dd>
          </div>
        ) : null}
        {skillCount > 0 ? (
          <div>
            <dt className="text-muted-foreground">Core skills</dt>
            <dd className="font-medium text-foreground">{skillCount}</dd>
          </div>
        ) : null}
        {opportunity.updatedAt ? (
          <div>
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="font-medium text-foreground">{formatDate(opportunity.updatedAt)}</dd>
          </div>
        ) : null}
      </dl>
    </PmContentCard>
  )
}
