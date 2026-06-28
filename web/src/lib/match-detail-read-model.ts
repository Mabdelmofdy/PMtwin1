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
  resolvePostMatchRelatedOpportunities,
  type RelatedOpportunityRef,
} from '@/lib/post-match-related-opportunities.ts'

const MATCH_ENTITY = 'match' as const

/** Sentinel context id so related-opportunity resolver lists all linked opportunities. */
export const MATCH_DETAIL_NEUTRAL_CONTEXT_ID = '__match_detail_neutral__'

export type MatchDetailReadModel = {
  readonly match: PostMatch
  readonly matchTypeLabel: string
  readonly canonicalStatus: string
  readonly scoreLabel: string
  readonly relatedOpportunities: readonly RelatedOpportunityRef[]
  readonly participants: readonly OpportunityMatchParticipantSummary[]
  readonly actions: OpportunityMatchCardActions
  readonly isParticipant: boolean
  readonly canAct: boolean
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

  return {
    match,
    matchTypeLabel: formatMatchTypeLabel(match.matchType),
    canonicalStatus: toCanonical(MATCH_ENTITY, match.status ?? '') ?? match.status,
    scoreLabel: formatPercent(match.matchScore),
    relatedOpportunities: related.items,
    participants,
    actions,
    isParticipant,
    canAct,
  }
}
