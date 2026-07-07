import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeftRight, ArrowRight, RefreshCw, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatDate, truncate } from '@/lib/format'
import { formatMatchTypeBadgeLabel } from '@/components/collaboration/collaboration-display'
import {
  formatMatchDisplayTitle,
  resolveMatchNeedOfferTitles,
} from '@/lib/match-display.ts'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { resolveMatchTypeStyle } from '@/tokens'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmMatchScoreBadge } from '@/components/ui/pm-match-score-badge'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import type { PostMatch } from '@/types/domain.ts'
import { cn } from '@/lib/utils'
import { collectPostMatchOpportunityIds } from '@/domain/normalized/post-match-strong-key.ts'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'

const MATCH_TYPE_ICONS: Record<string, LucideIcon> = {
  one_way: ArrowRight,
  two_way: ArrowLeftRight,
  consortium: Users,
  circular: RefreshCw,
}

/** Match-type chip with topology icon and semantic tone — shared visual identity. */
export function MatchTypeChip({
  matchType,
  className,
}: {
  matchType?: string
  className?: string
}) {
  const key = (matchType || 'one_way').toLowerCase()
  const Icon = MATCH_TYPE_ICONS[key] ?? ArrowRight
  return (
    <span
      data-slot="match-type-chip"
      className={cn(
        pmTypography.badge,
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 uppercase tracking-wide',
        resolveMatchTypeStyle(key),
        className,
      )}
    >
      <Icon className="size-3 rtl:rotate-180" aria-hidden />
      {formatMatchTypeBadgeLabel(key)}
    </span>
  )
}

export type MatchCardProps = {
  match: PostMatch
  className?: string
  showActions?: boolean
  /** Truncate long need/offer titles for dense browse grids (presentation only). */
  shortenTitles?: boolean
}

const BROWSE_TITLE_MAX = 56

/** Match card — one_way keeps need/offer pairing; other topologies show a structure label. */
export function MatchCard({
  match,
  className,
  showActions = true,
  shortenTitles = false,
}: MatchCardProps) {
  const href = `/matches/${match.id}`
  const isOneWay = (match.matchType || 'one_way').toLowerCase() === 'one_way'
  const pairing = resolveMatchNeedOfferTitles(match, (id) => opportunitiesApi.get(id))
  const displayTitle = formatMatchDisplayTitle(match, (id) => opportunitiesApi.get(id))
  const needTitle = shortenTitles ? truncate(pairing.needTitle, BROWSE_TITLE_MAX) : pairing.needTitle
  const offerTitle = shortenTitles
    ? truncate(pairing.offerTitle, BROWSE_TITLE_MAX)
    : pairing.offerTitle
  const structureTitle = shortenTitles ? truncate(displayTitle, BROWSE_TITLE_MAX) : displayTitle
  const relatedOpportunities = collectPostMatchOpportunityIds(match)
    .map((id) => opportunitiesApi.get(id))
    .filter(Boolean)
  const primaryOpportunity = relatedOpportunities[0]
  const taxonomy = primaryOpportunity
    ? resolveOpportunityTaxonomyLabels(primaryOpportunity)
    : null
  const breakdown = match.payload?.breakdown ?? match.matchCriteria ?? {}
  const confidence =
    match.matchScore >= 0.9
      ? 'High Confidence'
      : match.matchScore >= 0.75
        ? 'Medium Confidence'
        : 'Low Confidence'

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4 md:p-5', className)}
      data-slot="match-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Link to={href} className="block min-w-0 hover:text-primary">
            {isOneWay ? (
              <>
                <p className={cn(pmTypography.caption, 'font-medium text-info')}>Need</p>
                <p className={cn(pmTypography.bodySm, 'line-clamp-2 font-semibold')}>
                  {needTitle}
                </p>
                <ArrowDown className="my-1 size-3.5 text-muted-foreground" aria-hidden />
                <p className={cn(pmTypography.caption, 'font-medium text-success')}>Offer</p>
                <p className={cn(pmTypography.bodySm, 'line-clamp-2 font-semibold')}>
                  {offerTitle}
                </p>
              </>
            ) : (
              <p className={cn(pmTypography.bodySm, 'line-clamp-3 font-semibold')}>
                {structureTitle}
              </p>
            )}
          </Link>
        </div>
        <PmMatchScoreBadge
          score={match.matchScore}
          variant="compact"
          showLabel={false}
          breakdown={match.payload?.breakdown ?? match.matchCriteria}
        />
      </div>

      <div
        className={cn(
          pmTypography.caption,
          'mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground',
        )}
      >
        <MatchTypeChip matchType={match.matchType} />
        <span>{formatDate(match.createdAt)}</span>
        <PmWorkflowBadge status={match.status} entity="match" size="sm" />
      </div>

      {taxonomy ? (
        <div className={cn(pmTypography.caption, 'mt-2 space-y-1 text-muted-foreground')}>
          <p>{taxonomy.mainModel}</p>
          <p>{taxonomy.subModel}</p>
          <p>{taxonomy.exchangeMode}</p>
          <p>{taxonomy.matchingTopology}</p>
        </div>
      ) : null}

      <div className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
        <p className="font-medium">{confidence}</p>
        <p>
          Skills {breakdown.skillMatch != null ? '✓' : '—'} · Timeline {breakdown.timelineFit != null ? '✓' : '—'} · Budget{' '}
          {breakdown.budgetFit != null ? '✓' : '—'} · Location {breakdown.locationFit != null ? '✓' : '—'}
        </p>
      </div>

      {showActions ? (
        <PmCardActions className="mt-4" primary={{ label: 'Open match', href }} />
      ) : null}
    </PmSurface>
  )
}
