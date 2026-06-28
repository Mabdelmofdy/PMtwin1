import type {
  DiscoverPostMatchCommand,
  PostMatchCircularLink,
  PostMatchConsortiumRole,
  PostMatchParticipant,
} from '@pm-twin/commands'
import {
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@pm-twin/commands'
import type {
  CircularMatchResult,
  ConsortiumMatchResult,
  ModelRunResult,
  OpportunityPost,
  ScoredMatch,
  TwoWayMatchResult,
} from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'
import { discoverPostMatchStrongKey } from '@/domain/normalized/post-match-discover-validation.ts'
import type { DiscoverPostMatchInput } from '@/services/post-match-command-service.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

export type ModelRunDiscoverContext = {
  readonly anchorOpportunity: Opportunity
  readonly opportunityById: ReadonlyMap<string, Opportunity>
  readonly postById: ReadonlyMap<string, OpportunityPost>
  readonly runId: string
  readonly createAggregateId: () => string
}

function toMatchCriteria(
  breakdown?: ScoredMatch['breakdown'],
): Record<string, number> {
  if (!breakdown) return {}
  const criteria: Record<string, number> = {}
  for (const [key, value] of Object.entries(breakdown)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      criteria[key] = value
    }
  }
  return criteria
}

function isPublishedNeed(post: OpportunityPost): boolean {
  const intent = post.intent ?? 'request'
  return intent === 'request' || intent === 'hybrid'
}

function isPublishedOffer(post: OpportunityPost): boolean {
  const intent = post.intent ?? 'request'
  return intent === 'offer' || intent === 'hybrid'
}

function hydrateBarterSide(
  creatorId: string,
  anchorOpportunity: Opportunity | undefined,
  allPosts: readonly OpportunityPost[],
  pairHints: {
    readonly matchedNeed?: OpportunityPost
    readonly matchedOffer?: OpportunityPost
  } = {},
): { userId: string; needId: string; offerId: string } | null {
  if (!creatorId) return null

  const published = allPosts.filter((post) => (post.status ?? '') === 'published')
  const needs = published.filter((post) => isPublishedNeed(post) && post.creatorId === creatorId)
  const offers = published.filter((post) => isPublishedOffer(post) && post.creatorId === creatorId)

  let needId = pairHints.matchedNeed?.id ?? null
  let offerId = pairHints.matchedOffer?.id ?? null

  const anchorPost = anchorOpportunity ? opportunityToPost(anchorOpportunity) : undefined
  const anchorId = anchorPost?.id ?? null
  const intent = (anchorPost?.intent ?? '').toLowerCase()

  if (intent === 'request' && anchorId) {
    needId = anchorId
    if (!offerId) {
      offerId = offers.find((post) => post.id !== anchorId)?.id ?? offers[0]?.id ?? null
    }
  } else if (intent === 'offer' && anchorId) {
    offerId = anchorId
    if (!needId) {
      needId = needs.find((post) => post.id !== anchorId)?.id ?? needs[0]?.id ?? null
    }
  } else if (anchorId) {
    if (needs.some((post) => post.id === anchorId)) needId = anchorId
    if (offers.some((post) => post.id === anchorId)) offerId = anchorId
  }

  if (!needId) needId = needs[0]?.id ?? null
  if (!offerId) offerId = offers[0]?.id ?? null

  if (!needId || !offerId) return null
  return { userId: creatorId, needId, offerId }
}

function buildOneWayParticipants(
  needId: string,
  offerId: string,
  opportunityById: ReadonlyMap<string, Opportunity>,
): PostMatchParticipant[] {
  const needOpp = opportunityById.get(needId)
  const offerOpp = opportunityById.get(offerId)
  if (!needOpp?.creatorId || !offerOpp?.creatorId) return []

  return [
    {
      userId: needOpp.creatorId,
      role: 'need_owner',
      opportunityId: needId,
      participantStatus: 'pending',
      respondedAt: null,
    },
    {
      userId: offerOpp.creatorId,
      role: 'offer_provider',
      opportunityId: offerId,
      participantStatus: 'pending',
      respondedAt: null,
    },
  ]
}

function mapOneWayMatch(
  match: ScoredMatch,
  context: ModelRunDiscoverContext,
): DiscoverPostMatchInput | null {
  const needId = match.needOpportunityId
  const offerId = match.offerOpportunityId
  if (!needId || !offerId) return null

  const participants = buildOneWayParticipants(
    needId,
    offerId,
    context.opportunityById,
  )
  if (participants.length < 2) return null

  return {
    aggregateId: context.createAggregateId(),
    matchType: 'one_way',
    needOpportunityId: needId,
    offerOpportunityId: offerId,
    matchScore: match.matchScore,
    matchCriteria: toMatchCriteria(match.breakdown),
    participants,
    runId: context.runId,
  } as DiscoverPostMatchInput
}

function mapTwoWayMatch(
  match: ScoredMatch,
  _result: TwoWayMatchResult,
  context: ModelRunDiscoverContext,
  allPosts: readonly OpportunityPost[],
): DiscoverPostMatchInput | null {
  const needBId = match.needOpportunityId
  const offerBId = match.offerOpportunityId
  if (!needBId || !offerBId) return null

  const needB = context.postById.get(needBId)
  const offerB = context.postById.get(offerBId)
  if (!needB?.creatorId || !offerB?.creatorId) return null

  const ourUserId = context.anchorOpportunity.creatorId
  if (!ourUserId || needB.creatorId === ourUserId) return null

  const sideA = hydrateBarterSide(
    ourUserId,
    context.anchorOpportunity,
    allPosts,
  )
  const sideB = hydrateBarterSide(needB.creatorId, context.opportunityById.get(needBId), allPosts, {
    matchedNeed: needB,
    matchedOffer: offerB,
  })
  if (!sideA || !sideB) return null

  const participants: PostMatchParticipant[] = [
    {
      userId: sideA.userId,
      role: 'need_owner',
      opportunityId: sideA.needId,
      participantStatus: 'pending',
      respondedAt: null,
    },
    {
      userId: sideA.userId,
      role: 'offer_provider',
      opportunityId: sideA.offerId,
      participantStatus: 'pending',
      respondedAt: null,
    },
    {
      userId: sideB.userId,
      role: 'need_owner',
      opportunityId: sideB.needId,
      participantStatus: 'pending',
      respondedAt: null,
    },
    {
      userId: sideB.userId,
      role: 'offer_provider',
      opportunityId: sideB.offerId,
      participantStatus: 'pending',
      respondedAt: null,
    },
  ]

  const breakdown = toMatchCriteria(match.breakdown)
  return {
    aggregateId: context.createAggregateId(),
    matchType: 'two_way',
    matchScore: match.matchScore,
    sideA,
    sideB,
    scoreAtoB: breakdown.scoreAtoB,
    scoreBtoA: breakdown.scoreBtoA,
    valueEquivalence: match.valueEquivalence ?? null,
    participants,
    runId: context.runId,
  } as DiscoverPostMatchInput
}

function mapConsortiumMatch(
  match: ScoredMatch,
  result: ConsortiumMatchResult,
  context: ModelRunDiscoverContext,
): DiscoverPostMatchInput | null {
  const leadNeedId = context.anchorOpportunity.id
  const leadCreatorId = context.anchorOpportunity.creatorId
  if (!leadCreatorId) return null

  const roles: PostMatchConsortiumRole[] = (match.suggestedPartners ?? []).map((partner) => ({
    role: partner.role ?? 'General',
    opportunityId: partner.opportunityId ?? '',
    userId: partner.creatorId ?? '',
    score: result.roleResults?.find((roleResult) => roleResult.role === partner.role)?.matchScore,
  })).filter((role) => role.opportunityId && role.userId)

  if (roles.length === 0) return null

  const participants: PostMatchParticipant[] = [
    {
      userId: leadCreatorId,
      role: 'consortium_lead',
      opportunityId: leadNeedId,
      participantStatus: 'pending',
      respondedAt: null,
    },
  ]

  for (const role of roles) {
    if (role.userId === leadCreatorId) continue
    participants.push({
      userId: role.userId,
      role: 'consortium_member',
      opportunityId: role.opportunityId,
      participantStatus: 'pending',
      respondedAt: null,
    })
  }

  return {
    aggregateId: context.createAggregateId(),
    matchType: 'consortium',
    matchScore: match.matchScore,
    leadNeedId,
    roles,
    valueBalance: match.valueAnalysis ?? undefined,
    participants,
    runId: context.runId,
  } as DiscoverPostMatchInput
}

function mapCircularMatch(
  match: ScoredMatch,
  _result: CircularMatchResult,
  context: ModelRunDiscoverContext,
): DiscoverPostMatchInput | null {
  const anchorCreatorId = context.anchorOpportunity.creatorId
  const rawCycle = match.cycle ?? []
  if (!anchorCreatorId || !rawCycle.includes(anchorCreatorId)) return null

  const links = (match.links ?? match.linkScores ?? []) as PostMatchCircularLink[]
  if (links.length === 0) return null

  const cycle = [...rawCycle]
  if (cycle.length > 1 && cycle[0] === cycle[cycle.length - 1]) {
    cycle.pop()
  }

  if (links.some((link) => !link.fromCreatorId || !link.toCreatorId || !link.needId || !link.offerId)) {
    return null
  }

  const participants: PostMatchParticipant[] = []
  const seenUser = new Set<string>()
  for (const userId of cycle) {
    if (seenUser.has(userId)) continue
    seenUser.add(userId)
    const link =
      links.find((entry) => entry.toCreatorId === userId)
      ?? links.find((entry) => entry.fromCreatorId === userId)
    const opportunityId = link?.offerId ?? link?.needId
    participants.push({
      userId,
      role: 'chain_participant',
      opportunityId,
      participantStatus: 'pending',
      respondedAt: null,
    })
  }

  return {
    aggregateId: context.createAggregateId(),
    matchType: 'circular',
    matchScore: match.matchScore,
    cycle,
    links: links.map((link) => ({ ...link })),
    chainBalance: match.valueAnalysis ?? undefined,
    participants,
    runId: context.runId,
  } as DiscoverPostMatchInput
}

export function modelRunResultToDiscoverCommands(
  result: ModelRunResult,
  context: ModelRunDiscoverContext,
  allPosts: readonly OpportunityPost[],
): DiscoverPostMatchInput[] {
  const commands: DiscoverPostMatchInput[] = []

  for (const match of result.matches) {
    let command: DiscoverPostMatchInput | null = null
    switch (result.model) {
      case 'one_way':
        command = mapOneWayMatch(match, context)
        break
      case 'two_way':
        command = mapTwoWayMatch(match, result, context, allPosts)
        break
      case 'consortium':
        command = mapConsortiumMatch(match, result, context)
        break
      case 'circular':
        command = mapCircularMatch(match, result, context)
        break
      default:
        break
    }
    if (command) commands.push(command)
  }

  return commands
}

export function discoverInputStrongKey(
  input: DiscoverPostMatchInput,
): string | null {
  const probe = {
    commandType: 'DiscoverPostMatch',
    clientRequestId: 'probe',
    ...input,
  } as DiscoverPostMatchCommand
  return discoverPostMatchStrongKey(probe)
}

export {
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverCircularPostMatch,
}
