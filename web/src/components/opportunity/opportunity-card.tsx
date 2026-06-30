import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { formatDate, truncate } from '@/lib/format'
import { matchesApi } from '@/api/matches.ts'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { getReadinessStatusTone } from '@/components/readiness/readiness-display'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import type { Opportunity } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

const READINESS_TONE = {
  incomplete: 'warning',
  needs_review: 'info',
  ready: 'success',
} as const

export type OpportunityCardProps = {
  opportunity: Opportunity
  className?: string
  showActions?: boolean
}

/** Premium opportunity card for grid and mobile list layouts. */
export function OpportunityCard({
  opportunity,
  className,
  showActions = true,
}: OpportunityCardProps) {
  const matchCount = matchesApi.getByOpportunity(opportunity.id).length
  const readiness = resolveOpportunityReadiness(opportunity)
  const readinessTone = getReadinessStatusTone(readiness.status)
  const category = opportunity.scope?.sectors?.[0]
  const href = `/opportunities/${opportunity.id}`

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4', className)}
      data-slot="opportunity-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Link to={href} className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}>
            {opportunity.title}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <PmBadge tone="outline" size="sm">
              {formatOpportunityIntent(opportunity.intent)}
            </PmBadge>
            {category ? (
              <PmBadge tone="neutral" size="sm">
                {category}
              </PmBadge>
            ) : null}
          </div>
        </div>
        <OpportunityStatusBadge status={opportunity.status} />
      </div>

      {opportunity.description ? (
        <p className={cn(pmTypography.bodySm, 'mt-3 line-clamp-2 text-muted-foreground')}>
          {truncate(opportunity.description, 120)}
        </p>
      ) : null}

      <div className={cn(pmTypography.caption, 'mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground')}>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {opportunity.location || '—'}
        </span>
        <span>Updated {formatDate(opportunity.updatedAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PmBadge tone={READINESS_TONE[readinessTone]} size="sm">
          Readiness {readiness.score}%
        </PmBadge>
        {matchCount > 0 ? (
          <PmBadge tone="info" size="sm">
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </PmBadge>
        ) : null}
      </div>

      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
          <PmButton size="sm" asChild>
            <Link to={href}>View</Link>
          </PmButton>
          <PmButton size="sm" variant="outline" asChild>
            <Link to={`/opportunities/${opportunity.id}/edit`}>Edit</Link>
          </PmButton>
        </div>
      ) : null}
    </PmSurface>
  )
}
