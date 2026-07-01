import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/format'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmCardActions } from '@/components/ui/pm-more-actions'
import { PmSurface } from '@/components/ui/pm-surface'
import { PmMatchScoreBadge } from '@/components/ui/pm-match-score-badge'
import { PmWorkflowBadge } from '@/components/ui/pm-workflow-badge'
import { formatMatchTypeBadgeLabel } from '@/components/collaboration/collaboration-display'
import type { PostMatch } from '@/types/domain.ts'
import { cn } from '@/lib/utils'

export type MatchCardProps = {
  match: PostMatch
  className?: string
  showActions?: boolean
}

/** Premium post-match card for grid and mobile list layouts. */
export function MatchCard({ match, className, showActions = true }: MatchCardProps) {
  const href = `/matches/${match.id}`

  return (
    <PmSurface
      variant="default"
      shadow="card"
      interactive
      className={cn('flex h-full flex-col p-4 md:p-5', className)}
      data-slot="match-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={href} className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}>
            {formatMatchTypeBadgeLabel(match.matchType)}
          </Link>
          <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
            {formatDate(match.createdAt)}
          </p>
        </div>
        <PmMatchScoreBadge
          score={match.matchScore}
          variant="compact"
          showLabel={false}
          breakdown={match.payload?.breakdown ?? match.matchCriteria}
        />
      </div>

      <div className="mt-3">
        <PmWorkflowBadge status={match.status} entity="match" size="sm" />
      </div>

      {showActions ? (
        <PmCardActions
          className="mt-4"
          primary={{ label: 'Open match', href }}
        />
      ) : null}
    </PmSurface>
  )
}
