import { formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/shared/page-primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Opportunity summary</CardTitle>
          <StatusBadge status={opportunity.status} entity="opportunity" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {opportunity.description ? (
          <p className="line-clamp-3">{opportunity.description}</p>
        ) : (
          <p>No description provided.</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {opportunity.location ? <span>{opportunity.location}</span> : null}
          {creatorName ? <span>Posted by {creatorName}</span> : null}
          {opportunity.exchangeMode ? (
            <span>Exchange: {opportunity.exchangeMode}</span>
          ) : null}
          {opportunity.modelType ? (
            <span>Model: {opportunity.modelType}</span>
          ) : null}
          {skillCount > 0 ? (
            <span>{skillCount} core skill{skillCount === 1 ? '' : 's'}</span>
          ) : null}
          {opportunity.updatedAt ? (
            <span>Updated {formatDate(opportunity.updatedAt)}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
