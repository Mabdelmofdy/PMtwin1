import { Link } from 'react-router-dom'
import { formatDate, formatPercent } from '@/lib/format'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import {
  formatMatchTypeBadgeLabel,
  resolveMatchTypeTone,
} from '@/components/collaboration/collaboration-display'
import type { PostMatch } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

export type MatchCardProps = {
  match: PostMatch
  className?: string
  showActions?: boolean
}

/** Premium post-match card for grid and mobile list layouts. */
export function MatchCard({ match, className, showActions = true }: MatchCardProps) {
  const matchTypeKey = match.matchType.toLowerCase()
  const href = `/matches/${match.id}`

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4', className)}
      data-slot="match-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Link to={href} className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}>
            {formatMatchTypeBadgeLabel(match.matchType)}
          </Link>
          <PmBadge tone={resolveMatchTypeTone(matchTypeKey)} size="sm" uppercase>
            {matchTypeKey.replace(/_/g, ' ')}
          </PmBadge>
        </div>
        <span className="text-lg font-semibold tabular-nums text-primary">
          {formatPercent(match.matchScore)}
        </span>
      </div>

      <div className={cn(pmTypography.caption, 'mt-3 flex flex-wrap items-center gap-2')}>
        <PmWorkflowBadge status={match.status} entity="match" />
        <span className="text-muted-foreground">{formatDate(match.createdAt)}</span>
      </div>

      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
          <PmButton size="sm" asChild>
            <Link to={href}>View match</Link>
          </PmButton>
        </div>
      ) : null}
    </PmSurface>
  )
}
