import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { OpportunityMatchesReadModel } from '@/lib/opportunity-matches-read-model.ts'
import {
  acceptPostMatchUiAction,
  declinePostMatchUiAction,
} from '@/lib/post-match-ui-actions.ts'
import { StartNegotiationButton } from '@/components/negotiation/start-negotiation-button.tsx'
import { CreateDealButton } from '@/components/negotiation/create-deal-button.tsx'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatMatchTypeLabel } from '@/components/shared/pm-design-tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { PmEmptyState } from '@/components/ui/pm-index'

const MATCH_TYPE_TONE = {
  one_way: 'info',
  two_way: 'primary',
  consortium: 'warning',
  circular: 'success',
} as const

type RelatedMatchesPanelProps = {
  readonly model: OpportunityMatchesReadModel
  readonly currentUserId?: string | null
  readonly canAct?: boolean
  readonly highlighted?: boolean
  readonly sectionId?: string
}

export function RelatedMatchesPanel({
  model,
  currentUserId,
  canAct = true,
  highlighted = false,
  sectionId = 'related-matches',
}: RelatedMatchesPanelProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const handlePostMatchAction = (
    matchId: string,
    action: 'accept' | 'decline',
  ) => {
    if (!currentUserId) {
      toast.error('Sign in to respond to this match.')
      return
    }
    const key = `${matchId}:${action}`
    if (pendingAction === key) return
    setPendingAction(key)

    const result =
      action === 'accept'
        ? acceptPostMatchUiAction(matchId, currentUserId)
        : declinePostMatchUiAction(matchId, currentUserId)

    setPendingAction(null)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(
      action === 'accept' ? 'Match accepted' : 'Match declined',
      { description: `Status is now ${result.status}.` },
    )
  }

  const matchCountLabel = useMemo(
    () => `Related matches (${model.matches.length})`,
    [model.matches.length],
  )

  const panelDescription =
    'Primary path: review matches, accept or decline, start negotiation, then create a deal and contract.'

  const panelClassName = cn(
    highlighted && 'ring-2 ring-primary/50 transition-shadow duration-500',
  )

  if (model.isEmpty) {
    return (
      <div id={sectionId} className={panelClassName}>
        <PmContentCard title="Related matches" description={panelDescription}>
          <PmEmptyState
            title="No matches yet"
            description={model.emptyMessage}
            size="compact"
            action={
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/matches">View all matches</Link>
              </PmButton>
            }
          />
        </PmContentCard>
      </div>
    )
  }

  return (
    <div id={sectionId} className={panelClassName}>
      <PmContentCard title={matchCountLabel} description={panelDescription}>
        <div className="space-y-4">
          {model.matches.map((card) => {
            const matchTypeKey = card.match.matchType.toLowerCase()
            const actionPending = pendingAction?.startsWith(`${card.match.id}:`)

            return (
              <article
                key={card.match.id}
                className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-surface-muted/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PmBadge
                    tone={MATCH_TYPE_TONE[matchTypeKey as keyof typeof MATCH_TYPE_TONE] ?? 'neutral'}
                    uppercase
                  >
                    {formatMatchTypeLabel(matchTypeKey)}
                  </PmBadge>
                  <PmBadge tone="neutral" size="sm">
                    {card.statusLabel}
                  </PmBadge>
                  <PmBadge tone="primary" size="sm">
                    Score {card.scoreLabel}
                  </PmBadge>
                </div>

                {card.relatedOpportunities.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    <p className={cn(pmTypography.caption, 'font-medium text-muted-foreground')}>
                      Related opportunities
                    </p>
                    <ul className="space-y-1 text-sm">
                      {card.relatedOpportunities.map((item) => (
                        <li key={`${card.match.id}-${item.id}-${item.label}`}>
                          <span className="text-muted-foreground">{item.label}:</span>{' '}
                          {item.isCurrent ? (
                            <span className="font-medium">{item.title}</span>
                          ) : (
                            <Link
                              to={item.path}
                              className="font-medium text-primary hover:underline"
                            >
                              {item.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {card.participants.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    <p className={cn(pmTypography.caption, 'font-medium text-muted-foreground')}>
                      Participants
                    </p>
                    <ul className="space-y-0.5 text-sm text-muted-foreground">
                      {card.participants.map((participant) => (
                        <li key={`${card.match.id}-${participant.userId}`}>
                          {participant.role.replace(/_/g, ' ')} — {participant.displayName}
                          {participant.participantStatus
                            ? ` (${participant.participantStatus})`
                            : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={card.detailPath}>View match</Link>
                  </PmButton>

                  {canAct && card.actions.showAccept ? (
                    <PmButton
                      size="sm"
                      disabled={actionPending}
                      onClick={() => handlePostMatchAction(card.match.id, 'accept')}
                    >
                      Accept match
                    </PmButton>
                  ) : null}

                  {canAct && card.actions.showDecline ? (
                    <PmButton
                      size="sm"
                      variant="outline"
                      disabled={actionPending}
                      onClick={() => handlePostMatchAction(card.match.id, 'decline')}
                    >
                      Decline match
                    </PmButton>
                  ) : null}

                  {canAct && card.actions.showStartNegotiation ? (
                    <StartNegotiationButton
                      match={card.match}
                      variant="default"
                      className="h-8 px-3 text-xs"
                    />
                  ) : null}

                  {card.actions.showViewNegotiation && card.actions.negotiationId ? (
                    <PmButton size="sm" variant="secondary" asChild>
                      <Link to={`/negotiations/${card.actions.negotiationId}`}>
                        View negotiation
                      </Link>
                    </PmButton>
                  ) : null}

                  {canAct && card.actions.showCreateDeal ? (
                    <CreateDealButton
                      negotiation={card.actions.negotiation}
                      variant="default"
                      className="h-8 px-3 text-xs"
                    />
                  ) : null}

                  {card.actions.showViewDeal && card.actions.dealId ? (
                    <PmButton size="sm" variant="secondary" asChild>
                      <Link to={`/deals/${card.actions.dealId}`}>View deal</Link>
                    </PmButton>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </PmContentCard>
    </div>
  )
}
