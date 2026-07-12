import { Link } from 'react-router-dom'
import type { AdminRiskSummary } from '@/domain/admin/read-models/types.ts'
import {
  healthToneCardClass,
  healthToneToBadgeTone,
} from '@/components/admin/severity/admin-severity.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminRiskSeverityPanelProps = {
  readonly summary: AdminRiskSummary
  readonly className?: string
}

export function AdminRiskSeverityPanel({ summary, className }: AdminRiskSeverityPanelProps) {
  return (
    <PmContentCard
      title="Risk Panel"
      description="Critical, warning, blocked, and healthy operational signals."
      className={className}
      actions={
        <Link
          to="/admin/command-center/risk"
          className={cn(pmTypography.caption, 'text-primary underline-offset-4 hover:underline')}
        >
          Risk detail
        </Link>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {summary.buckets.map((bucket) => (
          <div
            key={bucket.id}
            className={cn('rounded-lg border p-3', healthToneCardClass(bucket.id))}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={pmTypography.label}>{bucket.label}</p>
              <PmBadge tone={healthToneToBadgeTone(bucket.id)} size="sm">
                {bucket.count}
              </PmBadge>
            </div>
            {bucket.items.length === 0 ? (
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>None</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {bucket.items.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.destinationHref}
                      className={cn(
                        pmTypography.caption,
                        'text-foreground underline-offset-2 hover:underline',
                      )}
                    >
                      {item.title} ({item.count})
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {summary.items.length === 0 ? (
        <PmEmptyState className="mt-3" title="No elevated risk" size="compact" />
      ) : null}
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Suspended users</dt>
          <dd className={pmTypography.label}>{summary.suspendedUsers}</dd>
        </div>
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Rejected accounts</dt>
          <dd className={pmTypography.label}>{summary.rejectedDocuments}</dd>
        </div>
        <div>
          <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>Orphan opportunity hints</dt>
          <dd className={pmTypography.label}>{summary.orphanHints}</dd>
        </div>
      </dl>
    </PmContentCard>
  )
}
