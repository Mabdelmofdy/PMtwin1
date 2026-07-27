import { toCanonical } from '@pm-twin/lifecycle'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import { formatPercent } from '@/lib/format'
import {
  buildMatchCardActions,
  formatMatchTypeLabel,
  type OpportunityMatchCardActions,
  type OpportunityMatchParticipantSummary,
} from '@/lib/opportunity-matches-read-model.ts'
import {
  buildMatchTopologyReadModel,
  type MatchTopologyReadModel,
} from '@/lib/match-topology-read-model.ts'

import {
  resolvePostMatchRelatedOpportunities,
  type RelatedOpportunityRef,
} from '@/lib/post-match-related-opportunities.ts'
import { enrichTwoWayMatchScoreBreakdown } from '@/lib/match-score-factor-enrichment.ts'

const MATCH_ENTITY = 'match' as const
export const MATCH_DETAIL_NEUTRAL_CONTEXT_ID = '__match_detail_neutral__'

export type MatchScoreFactorLabels = {
  readonly skillMatch: string
  readonly timelineFit: string
  readonly locationFit: string
  readonly scoreAtoB?: string
  readonly scoreBtoA?: string
}

export type MatchDetailReadModel = {
  readonly match: PostMatch
  readonly matchTypeLabel: string
  readonly canonicalStatus: string
  readonly scoreLabel: string
  readonly scoreFactors: MatchScoreFactorLabels
  readonly relatedOpportunities: readonly RelatedOpportunityRef[]
  readonly participants: readonly OpportunityMatchParticipantSummary[]
  readonly actions: OpportunityMatchCardActions
  readonly isParticipant: boolean
  readonly canAct: boolean
  readonly topology: MatchTopologyReadModel
}

export type MatchDetailReadModelDeps = {
  readonly getOpportunity: (opportunityId: string) => Opportunity | undefined
  readonly getNegotiationsForPostMatch?: (
    postMatchId: string,
  ) => readonly Negotiation[]
  readonly getDealForPostMatch?: (postMatchId: string) => Deal | undefined
  readonly getPersonName?: (userId: string) => string | undefined
  readonly currentUserId?: string | null
  readonly canAct?: boolean
}

function resolveParticipantDisplayName(
  userId: string,
  deps: MatchDetailReadModelDeps,
): string {
  const name = deps.getPersonName?.(userId)
  return name?.trim() ? name : userId
}

function optionalPercentLabel(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? formatPercent(value)
    : '—'
}

/**
 * Resolve factor scores from matchCriteria / payload.breakdown / enrichment.
 * Missing factors stay undefined so UI can show "—" instead of fake 0%.
 */
export function resolveMatchScoreFactors(
  match: PostMatch,
  enrichedBreakdown?: Readonly<Record<string, number>> | null,
): MatchScoreFactorLabels {
  const breakdown = {
    ...(match.matchCriteria ?? {}),
    ...(match.payload?.breakdown ?? {}),
    ...(enrichedBreakdown ?? {}),
  }
  const read = (key: string): number | undefined => {
    const value = breakdown[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }

  const factors: MatchScoreFactorLabels = {
    skillMatch: optionalPercentLabel(read('skillMatch')),
    timelineFit: optionalPercentLabel(read('timelineFit')),
    locationFit: optionalPercentLabel(read('locationFit')),
  }

  const scoreAtoB = read('scoreAtoB') ?? match.payload?.scoreAtoB
  const scoreBtoA = read('scoreBtoA') ?? match.payload?.scoreBtoA
  if (match.matchType === 'two_way' || scoreAtoB != null || scoreBtoA != null) {
    return {
      ...factors,
      scoreAtoB: optionalPercentLabel(
        typeof scoreAtoB === 'number' ? scoreAtoB : undefined,
      ),
      scoreBtoA: optionalPercentLabel(
        typeof scoreBtoA === 'number' ? scoreBtoA : undefined,
      ),
    }
  }

  return factors
}

/**
 * Context opportunity for topology-aware related-opportunity labels.
 * Participants use their linked opportunity; others use a neutral sentinel.
 */
export function resolveMatchDetailContextOpportunityId(
  match: PostMatch,
  userId: string | null | undefined,
): string {
  if (userId) {
    const participant = match.participants?.find((p) => p.userId === userId)
    if (participant?.opportunityId?.trim()) {
      return participant.opportunityId
    }
  }
  return MATCH_DETAIL_NEUTRAL_CONTEXT_ID
}

export function isParticipantOnMatch(
  match: PostMatch,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false
  return Boolean(match.participants?.some((participant) => participant.userId === userId))
}

export function buildMatchDetailReadModel(
  match: PostMatch,
  deps: MatchDetailReadModelDeps,
): MatchDetailReadModel {
  const contextOpportunityId = resolveMatchDetailContextOpportunityId(
    match,
    deps.currentUserId,
  )
  const related = resolvePostMatchRelatedOpportunities(
    match,
    contextOpportunityId,
    deps.getOpportunity,
  )
  const participants = normalizeParticipants(match.participants).map((participant) => ({
    userId: participant.userId,
    role: participant.role,
    participantStatus: participant.participantStatus,
    displayName: resolveParticipantDisplayName(participant.userId, deps),
  }))
  const isParticipant = isParticipantOnMatch(match, deps.currentUserId)
  const canAct = deps.canAct !== false && Boolean(deps.currentUserId)
  const actions = buildMatchCardActions(match, deps)
  const topology = buildMatchTopologyReadModel(
    match,
    deps.getOpportunity,
    deps.getPersonName,
  )
  const enrichedBreakdown = enrichTwoWayMatchScoreBreakdown(
    match,
    deps.getOpportunity,
  )

  return {
    match,
    matchTypeLabel: formatMatchTypeLabel(match.matchType),
    canonicalStatus: toCanonical(MATCH_ENTITY, match.status ?? '') ?? match.status,
    scoreLabel: formatPercent(match.matchScore),
    scoreFactors: resolveMatchScoreFactors(match, enrichedBreakdown),
    relatedOpportunities: related.items,
    participants,
    actions,
    isParticipant,
    canAct,
    topology,
  }
}
