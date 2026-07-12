import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { MapPin } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { matchesApi } from '@/api/matches.ts'
import { pmTypography } from '@/tokens'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { PmReadinessScoreBadge } from '@/components/ui/pm-readiness-score-badge'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmBadge } from '@/components/ui/pm-badge'
import { OpportunityListLabels } from '@/components/opportunity/opportunity-list-labels'
import {
  resolveOpportunityReadiness,
  resolveOpportunityReadinessCanonical,
} from '@/components/readiness/opportunity-readiness-card'
import type { Opportunity } from '@/types/domain.ts'
import { cn } from '@/lib/utils'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'
import { buildOpportunityExplanationFromForm } from '@/services/explainability/index.ts'
import {
  migrateLegacyExchangeModeToCommercialStructure,
  redactCommercialForMarketplace,
} from '@/domain/opportunity-commercial-structure'
import { normalizeWorkPackages } from '@/domain/opportunity-creation'

export type OpportunityCardProps = {
  opportunity: Opportunity
  className?: string
  showActions?: boolean
  /** When false, Edit is hidden from the More menu. */
  canEdit?: boolean
  /** Owner-only readiness score and match count (hidden for marketplace list viewers). */
  showOwnerInsights?: boolean
  /** Current signed-in user — drives ownership badges. */
  viewerUserId?: string | null
  viewerOrganizationId?: string | null
}

/** Premium opportunity card for grid and mobile list layouts. */
export function OpportunityCard({
  opportunity,
  className,
  showActions = true,
  canEdit = true,
  showOwnerInsights = false,
  viewerUserId,
  viewerOrganizationId,
}: OpportunityCardProps) {
  const matchCount = showOwnerInsights ? matchesApi.getByOpportunity(opportunity.id).length : 0
  const readiness = showOwnerInsights ? resolveOpportunityReadiness(opportunity) : null
  const canonicalReadiness = showOwnerInsights
    ? resolveOpportunityReadinessCanonical(opportunity)
    : null
  const explanationBundle = showOwnerInsights
    ? buildOpportunityExplanationFromForm(opportunity.id, opportunity)
    : null
  const category = opportunity.scope?.sectors?.[0]
  const href = `/opportunities/${opportunity.id}`
  const taxonomy = resolveOpportunityTaxonomyLabels(opportunity)

  const attrs = opportunity.collaborationAttributes ?? {}
  const workPackages = normalizeWorkPackages(attrs.workPackages)
  const taskCount = workPackages.reduce(
    (sum, pkg) => sum + (pkg.tasks?.length ?? 0),
    0,
  )
  const deliverableCount =
    workPackages.reduce((sum, pkg) => sum + pkg.deliverables.length, 0)
    + (Array.isArray(attrs.deliverables) ? attrs.deliverables.length : 0)

  const commercial = redactCommercialForMarketplace(
    migrateLegacyExchangeModeToCommercialStructure({
      exchangeMode: opportunity.exchangeMode,
      acceptedExchangeModes: opportunity.acceptedExchangeModes,
      paymentModes: opportunity.paymentModes,
      exchangeData: opportunity.exchangeData,
      collaborationAttributes: attrs,
    }),
  )

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4 md:p-5', className)}
      data-slot="opportunity-card"
    >
      <OpportunityListLabels
        opportunity={opportunity}
        viewerUserId={viewerUserId}
        viewerOrganizationId={viewerOrganizationId}
        showStatus
        className="mb-2"
      />
      {!showOwnerInsights && (opportunity.visibilityStatus ?? '').toLowerCase() === 'published' ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <PmBadge tone="success" size="sm">Open</PmBadge>
          <PmBadge tone="info" size="sm">Accepting Collaboration</PmBadge>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={href} className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}>
            {opportunity.title}
          </Link>
          {category ? (
            <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>{category}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {showOwnerInsights && readiness ? (
            <PmReadinessScoreBadge
              score={readiness.score}
              variant="compact"
              showLabel={false}
              explanation={{
                missingRequired: readiness.missingRequired,
                missingRecommended: readiness.missingRecommended,
              }}
              bundle={explanationBundle ?? undefined}
            />
          ) : null}
        </div>
      </div>

      <div className={cn(pmTypography.caption, 'mt-3 space-y-1 text-muted-foreground')}>
        <p>{taxonomy.mainModel}</p>
        <p>{taxonomy.subModel}</p>
        {commercial ? (
          <p>
            {commercial.isHybrid ? 'Hybrid' : commercial.derivedMode}
            {commercial.componentTypes.length > 0
              ? ` · ${commercial.componentTypes.join(' + ')}`
              : ''}
          </p>
        ) : (
          <p>{taxonomy.exchangeMode}</p>
        )}
        {(workPackages.length > 0 || taskCount > 0 || deliverableCount > 0) && (
          <p>
            {workPackages.length} Work Packages
            {taskCount > 0 ? ` · ${taskCount} Tasks` : ''}
            {deliverableCount > 0 ? ` · ${deliverableCount} Deliverables` : ''}
          </p>
        )}
      </div>

      <div
        className={cn(
          pmTypography.caption,
          'mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {opportunity.location || '—'}
        </span>
        <span>Updated {formatDate(opportunity.updatedAt)}</span>
        {matchCount > 0 ? (
          <span>
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </span>
        ) : null}
        {showOwnerInsights && readiness && canonicalReadiness ? (
          <span>
            {Math.round(readiness.score)}% · {canonicalReadiness.readinessLevel}
          </span>
        ) : null}
      </div>

      {showActions ? (
        <PmCardActions
          className="mt-4"
          primary={{ label: 'Open', href }}
          more={
            canEdit
              ? [
                  {
                    id: 'edit',
                    label: 'Edit',
                    href: `/opportunities/${opportunity.id}/edit`,
                    icon: Pencil,
                  },
                ]
              : undefined
          }
        />
      ) : null}
    </PmSurface>
  )
}
