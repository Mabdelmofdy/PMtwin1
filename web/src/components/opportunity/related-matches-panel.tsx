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
import { StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MATCH_TYPE_BADGE_STYLES: Record<string, string> = {
  one_way: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  two_way: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  consortium: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  circular: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

function MatchTypeBadge({
  matchType,
  label,
}: {
  matchType: string
  label: string
}) {
  const key = matchType.toLowerCase()
  const style =
    MATCH_TYPE_BADGE_STYLES[key] ??
    'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        style,
      )}
    >
      {label}
    </span>
  )
}

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
    () => `Collaboration matches (${model.matches.length})`,
    [model.matches.length],
  )

  const panelDescription =
    'Primary path: review matches, accept or decline, start negotiation, then create a deal and contract.'

  const panelClassName = cn(
    'border-primary/25 shadow-sm ring-1 ring-primary/10',
    highlighted && 'ring-2 ring-primary/60 shadow-md transition-shadow duration-500',
  )

  if (model.isEmpty) {
    return (
      <Card id={sectionId} className={panelClassName}>
        <CardHeader>
          <CardTitle>Collaboration matches</CardTitle>
          <p className="text-sm text-muted-foreground">{panelDescription}</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{model.emptyMessage}</p>
          <Button size="sm" variant="outline" className="cursor-pointer" asChild>
            <Link to="/matches">View all matches</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id={sectionId} className={panelClassName}>
      <CardHeader>
        <CardTitle>{matchCountLabel}</CardTitle>
        <p className="text-sm text-muted-foreground">{panelDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {model.matches.map((card) => {
          const matchTypeKey = card.match.matchType.toLowerCase()
          const actionPending = pendingAction?.startsWith(`${card.match.id}:`)

          return (
            <article
              key={card.match.id}
              className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/20"
            >
              <div className="flex flex-wrap items-center gap-2">
                <MatchTypeBadge
                  matchType={matchTypeKey}
                  label={card.matchTypeLabel}
                />
                <StatusBadge status={card.match.status} entity="match" />
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Score {card.scoreLabel}
                </span>
              </div>

              {card.relatedOpportunities.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
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
                  <p className="text-xs font-medium text-muted-foreground">
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
                <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                  <Link to={card.detailPath}>View match</Link>
                </Button>

                {canAct && card.actions.showAccept ? (
                  <Button
                    size="sm"
                    className="cursor-pointer"
                    disabled={actionPending}
                    onClick={() => handlePostMatchAction(card.match.id, 'accept')}
                  >
                    Accept match
                  </Button>
                ) : null}

                {canAct && card.actions.showDecline ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    disabled={actionPending}
                    onClick={() => handlePostMatchAction(card.match.id, 'decline')}
                  >
                    Decline match
                  </Button>
                ) : null}

                {canAct && card.actions.showStartNegotiation ? (
                  <StartNegotiationButton
                    match={card.match}
                    variant="default"
                    className="h-8 px-3 text-xs"
                  />
                ) : null}

                {card.actions.showViewNegotiation && card.actions.negotiationId ? (
                  <Button size="sm" variant="secondary" className="cursor-pointer" asChild>
                    <Link to={`/negotiations/${card.actions.negotiationId}`}>
                      View negotiation
                    </Link>
                  </Button>
                ) : null}

                {canAct && card.actions.showCreateDeal ? (
                  <CreateDealButton
                    negotiation={card.actions.negotiation}
                    variant="default"
                    className="h-8 px-3 text-xs"
                  />
                ) : null}

                {card.actions.showViewDeal && card.actions.dealId ? (
                  <Button size="sm" variant="secondary" className="cursor-pointer" asChild>
                    <Link to={`/deals/${card.actions.dealId}`}>View deal</Link>
                  </Button>
                ) : null}
              </div>
            </article>
          )
        })}
      </CardContent>
    </Card>
  )
}
