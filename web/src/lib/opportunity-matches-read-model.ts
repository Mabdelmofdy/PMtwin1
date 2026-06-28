import { toCanonical } from '@pm-twin/lifecycle'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import { formatPercent } from '@/lib/format'
import { canShowCreateDealFromNegotiation } from '@/lib/create-deal-ui-actions.ts'
import {
  canShowStartNegotiationFromPostMatch,
  type StartNegotiationUiActionsDeps,
} from '@/lib/start-negotiation-ui-actions.ts'
import {
  canShowAcceptPostMatch,
  canShowDeclinePostMatch,
  isPostMatchTerminalForParticipantActions,
} from '@/lib/post-match-ui-actions.ts'
import {
  resolvePostMatchRelatedOpportunities,
  type RelatedOpportunityRef,
} from '@/lib/post-match-related-opportunities.ts'

const MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const

export const OPPORTUNITY_MATCHES_EMPTY_MESSAGE =
  'No matches discovered yet. Publish this opportunity to run matching.'

export type OpportunityMatchParticipantSummary = {
  readonly userId: string
  readonly role: string
  readonly participantStatus?: string
  readonly displayName: string
}

export type OpportunityMatchCardActions = {
  readonly showAccept: boolean
  readonly showDecline: boolean
  readonly showStartNegotiation: boolean
  readonly showViewNegotiation: boolean
  readonly showCreateDeal: boolean
  readonly showViewDeal: boolean
  readonly showViewDetails: boolean
  readonly negotiationId: string | null
  readonly dealId: string | null
  readonly negotiation: Negotiation | null
}

export type OpportunityMatchCard = {
  readonly match: PostMatch
  readonly matchTypeLabel: string
  readonly statusLabel: string
  readonly canonicalStatus: string
  readonly scoreLabel: string
  readonly relatedOpportunities: readonly RelatedOpportunityRef[]
  readonly participants: readonly OpportunityMatchParticipantSummary[]
  readonly detailPath: string
  readonly actions: OpportunityMatchCardActions
}

export type OpportunityMatchesReadModel = {
  readonly opportunityId: string
  readonly matches: readonly OpportunityMatchCard[]
  readonly isEmpty: boolean
  readonly emptyMessage: string
  /** PostMatch-first flow — applications are secondary on the detail page. */
  readonly matchesArePrimaryFlow: true
}

export type OpportunityMatchesReadModelDeps = {
  readonly getPostMatchesByOpportunity: (opportunityId: string) => readonly PostMatch[]
  readonly getOpportunity: (opportunityId: string) => Opportunity | undefined
  readonly getNegotiationsForPostMatch?: (
    postMatchId: string,
  ) => readonly Negotiation[]
  readonly getDealForPostMatch?: (postMatchId: string) => Deal | undefined
  readonly getPersonName?: (userId: string) => string | undefined
  readonly currentUserId?: string | null
  readonly startNegotiationDeps?: StartNegotiationUiActionsDeps
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  one_way: 'One-way',
  two_way: 'Two-way',
  consortium: 'Consortium',
  circular: 'Circular',
}

const BLOCKING_NEGOTIATION_STATUSES = new Set(['active', 'countered', 'agreed'])

export function formatMatchTypeLabel(matchType: string): string {
  const key = matchType.toLowerCase()
  return MATCH_TYPE_LABELS[key] ?? matchType.replace(/_/g, ' ')
}

function resolveParticipantDisplayName(
  userId: string,
  deps: OpportunityMatchesReadModelDeps,
): string {
  const name = deps.getPersonName?.(userId)
  return name?.trim() ? name : userId
}

type MatchLinkageDeps = Pick<
  OpportunityMatchesReadModelDeps,
  'getNegotiationsForPostMatch' | 'getDealForPostMatch'
>

export type MatchCardActionsDeps = MatchLinkageDeps &
  Pick<
    OpportunityMatchesReadModelDeps,
    'currentUserId' | 'startNegotiationDeps'
  >

function resolveActiveNegotiation(
  match: PostMatch,
  deps: MatchLinkageDeps,
): Negotiation | undefined {
  if (match.negotiationId) {
    const direct = deps.getNegotiationsForPostMatch?.(match.id) ?? []
    const fromId = direct.find((n) => n.id === match.negotiationId)
    if (fromId) return fromId
  }

  const linked = deps.getNegotiationsForPostMatch?.(match.id) ?? []
  return linked.find((negotiation) => {
    const status =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    return BLOCKING_NEGOTIATION_STATUSES.has(status)
  })
}

function resolveDealForMatch(
  match: PostMatch,
  deps: MatchLinkageDeps,
): Deal | undefined {
  if (match.dealId) {
    const byPostMatch = deps.getDealForPostMatch?.(match.id)
    if (byPostMatch?.id === match.dealId) return byPostMatch
  }
  return deps.getDealForPostMatch?.(match.id)
}

export function buildMatchCardActions(
  match: PostMatch,
  deps: MatchCardActionsDeps,
): OpportunityMatchCardActions {
  const userId = deps.currentUserId ?? null
  const negotiation = resolveActiveNegotiation(match, deps)
  const deal = resolveDealForMatch(match, deps)
  const terminalForParticipant = isPostMatchTerminalForParticipantActions(match)

  const startNegotiationDeps: StartNegotiationUiActionsDeps | undefined =
    deps.startNegotiationDeps ??
    (deps.getNegotiationsForPostMatch
      ? { getNegotiationsForPostMatch: deps.getNegotiationsForPostMatch }
      : undefined)

  const showAccept = !terminalForParticipant && canShowAcceptPostMatch(match, userId)
  const showDecline = !terminalForParticipant && canShowDeclinePostMatch(match, userId)
  const showStartNegotiation = canShowStartNegotiationFromPostMatch(
    match,
    startNegotiationDeps,
  )
  const showViewNegotiation = Boolean(negotiation?.id)
  const showCreateDeal = canShowCreateDealFromNegotiation(negotiation)
  const showViewDeal = Boolean(deal?.id)

  return {
    showAccept,
    showDecline,
    showStartNegotiation,
    showViewNegotiation,
    showCreateDeal,
    showViewDeal,
    showViewDetails: true,
    negotiationId: negotiation?.id ?? null,
    dealId: deal?.id ?? null,
    negotiation: negotiation ?? null,
  }
}

function buildMatchCard(
  match: PostMatch,
  opportunityId: string,
  deps: OpportunityMatchesReadModelDeps,
): OpportunityMatchCard {
  const canonicalStatus = toCanonical(MATCH_ENTITY, match.status ?? '') ?? match.status
  const related = resolvePostMatchRelatedOpportunities(
    match,
    opportunityId,
    deps.getOpportunity,
  )
  const participants = normalizeParticipants(match.participants).map((participant) => ({
    userId: participant.userId,
    role: participant.role,
    participantStatus: participant.participantStatus,
    displayName: resolveParticipantDisplayName(participant.userId, deps),
  }))

  return {
    match,
    matchTypeLabel: formatMatchTypeLabel(match.matchType),
    statusLabel: canonicalStatus,
    canonicalStatus,
    scoreLabel: formatPercent(match.matchScore),
    relatedOpportunities: related.items,
    participants,
    detailPath: `/matches/${match.id}`,
    actions: buildMatchCardActions(match, deps),
  }
}

export function buildOpportunityMatchesReadModel(
  opportunityId: string,
  deps: OpportunityMatchesReadModelDeps,
): OpportunityMatchesReadModel {
  const matches = deps
    .getPostMatchesByOpportunity(opportunityId)
    .map((match) => buildMatchCard(match, opportunityId, deps))
    .sort((a, b) => b.match.matchScore - a.match.matchScore)

  return {
    opportunityId,
    matches,
    isEmpty: matches.length === 0,
    emptyMessage: OPPORTUNITY_MATCHES_EMPTY_MESSAGE,
    matchesArePrimaryFlow: true,
  }
}
