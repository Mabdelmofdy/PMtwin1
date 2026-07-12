import { Link } from 'react-router-dom'
import type { AdminPlatformHealthSummary } from '@/domain/admin/read-models/types.ts'
import {
  healthToneCardClass,
  healthToneToBadgeTone,
} from '@/components/admin/severity/admin-severity.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminPlatformHealthPanelProps = {
  readonly summary: AdminPlatformHealthSummary
  readonly className?: string
}

export function AdminPlatformHealthPanel({ summary, className }: AdminPlatformHealthPanelProps) {
  return (
    <PmContentCard
      title="Platform Health"
      description="Marketplace, commercial, matching, readiness, compliance, and data quality."
      className={className}
      actions={
        <PmBadge tone={healthToneToBadgeTone(summary.overallTone)} size="sm">
          {summary.overallLabel}
        </PmBadge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {summary.facets.map((facet) => (
          <Link
            key={facet.id}
            to={facet.href}
            className={cn(
              'rounded-lg border p-3 transition-colors hover:bg-muted/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              healthToneCardClass(facet.tone),
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={pmTypography.label}>{facet.label}</p>
              <PmBadge tone={healthToneToBadgeTone(facet.tone)} size="sm">
                {facet.tone}
              </PmBadge>
            </div>
            <p className={cn(pmTypography.stat, 'mt-1 text-base')}>
              {facet.value ?? '—'}
            </p>
            <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>{facet.detail}</p>
          </Link>
        ))}
      </div>
    </PmContentCard>
  )
}
