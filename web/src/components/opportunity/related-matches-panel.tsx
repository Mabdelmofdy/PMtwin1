import { useMemo, useState, type ReactNode } from 'react'
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
import { formatMatchTypeLabel } from '@/lib/opportunity-matches-read-model.ts'
import { formatFrameworkMatchTypeSubtitle } from '@/config/need-offer-framework.ts'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { PmMatchScoreBadge } from '@/components/ui/pm-match-score-badge'
import {
  PmCardActions,
  type PmCardActionSlot,
  type PmMoreActionItem,
} from '@/components/ui/pm-more-actions'
import { PmContentCard } from '@/components/layout/pm-layout-panels'
import { PmEmptyState, PmSurface } from '@/components/ui/pm-index'

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

type MatchCardActionBundle = {
  primary: PmCardActionSlot
  secondary?: PmCardActionSlot
  more?: PmMoreActionItem[]
  moreChildren?: ReactNode
}

function buildMatchCardActions(
  card: OpportunityMatchesReadModel['matches'][number],
  canAct: boolean,
  onAcceptDecline: (matchId: string, action: 'accept' | 'decline') => void,
  actionPending: boolean,
): MatchCardActionBundle {
  const { actions } = card
  const viewMatchSecondary: PmCardActionSlot = {
    label: 'Open match',
    href: card.detailPath,
    variant: 'outline',
  }

  const more: PmMoreActionItem[] = []

  if (canAct && actions.showDecline) {
    more.push({
      id: 'decline',
      label: 'Decline match',
      onSelect: () => onAcceptDecline(card.match.id, 'decline'),
      disabled: actionPending,
    })
  }

  if (actions.showViewNegotiation && actions.negotiationId) {
    more.push({
      id: 'view-negotiation',
      label: 'Open negotiation',
      href: `/negotiations/${actions.negotiationId}`,
    })
  }

  if (actions.showViewDeal && actions.dealId) {
    more.push({
      id: 'view-deal',
      label: 'Open deal',
      href: `/deals/${actions.dealId}`,
    })
  }

  if (canAct && actions.showAccept) {
    return {
      primary: {
        label: 'Accept match',
        onClick: () => onAcceptDecline(card.match.id, 'accept'),
        loading: actionPending,
      },
      secondary: viewMatchSecondary,
      more,
    }
  }

  if (canAct && actions.showStartNegotiation) {
    return {
      primary: {
        label: 'Start negotiation',
        render: () => (
          <StartNegotiationButton match={card.match} variant="default" size="sm" />
        ),
      },
      secondary: viewMatchSecondary,
      more,
    }
  }

  if (canAct && actions.showCreateDeal) {
    return {
      primary: {
        label: 'Create deal',
        render: () => (
          <CreateDealButton
            negotiation={card.actions.negotiation}
            variant="default"
            size="sm"
          />
        ),
      },
      secondary: viewMatchSecondary,
      more,
    }
  }

  if (actions.showViewNegotiation && actions.negotiationId) {
    return {
      primary: {
        label: 'Open negotiation',
        href: `/negotiations/${actions.negotiationId}`,
      },
      secondary: viewMatchSecondary,
      more: more.filter((item) => item.id !== 'view-negotiation'),
    }
  }

  if (actions.showViewDeal && actions.dealId) {
    return {
      primary: {
        label: 'Open deal',
        href: `/deals/${actions.dealId}`,
      },
      secondary: viewMatchSecondary,
      more: more.filter((item) => item.id !== 'view-deal'),
    }
  }

  return {
    primary: { label: 'Open match', href: card.detailPath },
    more,
  }
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
    'Review ranked matches and take the next collaboration step.'

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
            const actionBundle = buildMatchCardActions(
              card,
              canAct,
              handlePostMatchAction,
              Boolean(actionPending),
            )

            return (
              <PmSurface
                key={card.match.id}
                variant="default"
                shadow="card"
                className="p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn(pmTypography.bodySm, 'line-clamp-2 font-medium')}>
                      {card.relatedOpportunities
                        .filter((item) => !item.isCurrent)
                        .slice(0, 1)
                        .map((item) => item.title)
                        .join(' · ') || formatMatchTypeLabel(matchTypeKey)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PmBadge
                        tone={
                          MATCH_TYPE_TONE[matchTypeKey as keyof typeof MATCH_TYPE_TONE] ??
                          'neutral'
                        }
                        uppercase
                        size="sm"
                      >
                        {formatMatchTypeLabel(matchTypeKey)}
                      </PmBadge>
                      <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                        {formatFrameworkMatchTypeSubtitle(matchTypeKey)}
                      </span>
                      <PmBadge tone="neutral" size="sm">
                        {card.statusLabel}
                      </PmBadge>
                    </div>
                  </div>
                  <PmMatchScoreBadge
                    score={card.match.matchScore}
                    variant="compact"
                    showLabel={false}
                    breakdown={
                      card.match.payload?.breakdown ?? card.match.matchCriteria
                    }
                  />
                </div>

                <PmCardActions
                  className="mt-4"
                  primary={actionBundle.primary}
                  secondary={actionBundle.secondary}
                  more={actionBundle.more}
                  moreChildren={actionBundle.moreChildren}
                />
              </PmSurface>
            )
          })}
        </div>
      </PmContentCard>
    </div>
  )
}
