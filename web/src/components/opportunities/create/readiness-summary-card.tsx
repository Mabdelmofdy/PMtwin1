import { PmButton, PmSurface } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type ReadinessSummaryCardProps = {
  score: number
  requiredCount: number
  recommendedCount: number
  onViewDetails: () => void
  className?: string
}

export function ReadinessSummaryCard({
  score,
  requiredCount,
  recommendedCount,
  onViewDetails,
  className,
}: ReadinessSummaryCardProps) {
  const needsAttention = requiredCount + recommendedCount > 0
  return (
    <PmSurface
      data-slot="readiness-summary-card"
      className={cn('space-y-3 p-4', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            Opportunity Readiness
          </p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {Math.round(score)}%
          </p>
        </div>
        <PmButton type="button" variant="outline" size="sm" onClick={onViewDetails}>
          View Details
        </PmButton>
      </div>
      {needsAttention ? (
        <div className="space-y-1">
          <p className={cn(pmTypography.label, 'text-foreground')}>Needs Attention</p>
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {requiredCount} required item{requiredCount === 1 ? '' : 's'} remaining
            {recommendedCount > 0
              ? ` · ${recommendedCount} recommended improvement${recommendedCount === 1 ? '' : 's'}`
              : ''}
          </p>
        </div>
      ) : (
        <p className={cn(pmTypography.caption, 'text-success')}>
          Required items look complete
        </p>
      )}
    </PmSurface>
  )
}
