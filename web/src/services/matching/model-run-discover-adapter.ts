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
import {
  buildDiscoverParticipant,
  buildMatchingDiscoveryContextFromOpportunities,
  filterCrossOwnerPartyMatches,
  resolveOpportunityOwner,
  resolvePostOwnerPartyId,
  sameOwnerParty,
  type MatchingDiscoveryOwnershipContext,
} from '@/domain/identity/matching-discovery-context.ts'

export type ModelRunDiscoverContext = {
  readonly anchorOpportunity: Opportunity
  readonly opportunityById: ReadonlyMap<string, Opportunity>
  readonly postById: ReadonlyMap<string, OpportunityPost>
  readonly ownershipContext?: MatchingDiscoveryOwnershipContext
  readonly runId: string
  readonly createAggregateId: () => string
}

type ResolvedDiscoverContext = ModelRunDiscoverContext & {
  readonly ownershipContext: MatchingDiscoveryOwnershipContext
}

function resolveContextOwnership(
  context: ModelRunDiscoverContext,
): MatchingDiscoveryOwnershipContext {
  if (context.ownershipContext) return context.ownershipContext
  return buildMatchingDiscoveryContextFromOpportunities([
    ...context.opportunityById.values(),
  ])
}

function withResolvedOwnership(
  context: ModelRunDiscoverContext,
): ResolvedDiscoverContext {
  return {
    ...context,
    ownershipContext: resolveContextOwnership(context),
  }
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

function hydrateBarterSideByOwner(
  ownerPartyId: string,
  representativeUserId: string | undefined,
  anchorOpportunity: Opportunity | undefined,
  allPosts: readonly OpportunityPost[],
  opportunityById: ReadonlyMap<string, Opportunity>,
  ctx: MatchingDiscoveryOwnershipContext,
  pairHints: {
    readonly matchedNeed?: OpportunityPost
    readonly matchedOffer?: OpportunityPost
  } = {},
): {
  userId: string
  partyId: string
  workspaceId: string
  needId: string
  offerId: string
} | null {
  if (!ownerPartyId) return null

  const postMatchesOwner = (post: OpportunityPost) =>
    resolvePostOwnerPartyId(post, opportunityById, ctx) === ownerPartyId

  const published = allPosts.filter((post) => (post.status ?? '') === 'published')
  const needs = published.filter((post) => isPublishedNeed(post) && postMatchesOwner(post))
  const offers = published.filter((post) => isPublishedOffer(post) && postMatchesOwner(post))

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

  const anchorOwner = anchorOpportunity
    ? resolveOpportunityOwner(anchorOpportunity, ctx)
    : null
  const userId =
    representativeUserId ??
    anchorOwner?.representativeUserId ??
    anchorOpportunity?.createdByUserId ??
    (anchorOpportunity?.creatorId && ctx.userIds.has(anchorOpportunity.creatorId)
      ? anchorOpportunity.creatorId
      : undefined)

  if (!userId || ctx.companyIds.has(userId)) return null

  return {
    userId,
    partyId: ownerPartyId,
    workspaceId: anchorOwner?.workspaceId ?? '',
    needId,
    offerId,
  }
}

function buildOneWayParticipants(
  needId: string,
  offerId: string,
  opportunityById: ReadonlyMap<string, Opportunity>,
  ctx: MatchingDiscoveryOwnershipContext,
): PostMatchParticipant[] {
  const needOpp = opportunityById.get(needId)
  const offerOpp = opportunityById.get(offerId)
  if (!needOpp || !offerOpp) return []

  const needParticipant = buildDiscoverParticipant(needOpp, 'need_owner', ctx)
  const offerParticipant = buildDiscoverParticipant(offerOpp, 'offer_provider', ctx)
  if (!needParticipant || !offerParticipant) return []

  return [needParticipant, offerParticipant]
}

function mapOneWayMatch(
  match: ScoredMatch,
  context: ResolvedDiscoverContext,
): DiscoverPostMatchInput | null {
  const needId = match.needOpportunityId
  const offerId = match.offerOpportunityId
  if (!needId || !offerId) return null

  if (
    !filterCrossOwnerPartyMatches(
      needId,
      offerId,
      context.opportunityById,
      context.ownershipContext,
    )
  ) {
    return null
  }

  const participants = buildOneWayParticipants(
    needId,
    offerId,
    context.opportunityById,
    context.ownershipContext,
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
  context: ResolvedDiscoverContext,
  allPosts: readonly OpportunityPost[],
): DiscoverPostMatchInput | null {
  const needBId = match.needOpportunityId
  const offerBId = match.offerOpportunityId
  if (!needBId || !offerBId) return null

  const needB = context.opportunityById.get(needBId)
  const offerB = context.opportunityById.get(offerBId)
  if (!needB || !offerB) return null

  const anchorOwner = resolveOpportunityOwner(
    context.anchorOpportunity,
    context.ownershipContext,
  )
  const sideBOwner = resolveOpportunityOwner(needB, context.ownershipContext)
  if (!anchorOwner || !sideBOwner) return null
  if (sameOwnerParty(anchorOwner.ownerPartyId, sideBOwner.ownerPartyId)) return null

  const sideA = hydrateBarterSideByOwner(
    anchorOwner.ownerPartyId,
    anchorOwner.representativeUserId,
    context.anchorOpportunity,
    allPosts,
    context.opportunityById,
    context.ownershipContext,
  )
  const sideB = hydrateBarterSideByOwner(
    sideBOwner.ownerPartyId,
    sideBOwner.representativeUserId,
    needB,
    allPosts,
    context.opportunityById,
    context.ownershipContext,
    {
      matchedNeed: context.postById.get(needBId),
      matchedOffer: context.postById.get(offerBId),
    },
  )
  if (!sideA || !sideB) return null

  const participants: PostMatchParticipant[] = [
    {
      userId: sideA.userId,
      role: 'need_owner',
      opportunityId: sideA.needId,
      participantStatus: 'pending',
      respondedAt: null,
      partyId: sideA.partyId,
      workspaceId: sideA.workspaceId,
    },
    {
      userId: sideA.userId,
      role: 'offer_provider',
      opportunityId: sideA.offerId,
      participantStatus: 'pending',
      respondedAt: null,
      partyId: sideA.partyId,
      workspaceId: sideA.workspaceId,
    },
    {
      userId: sideB.userId,
      role: 'need_owner',
      opportunityId: sideB.needId,
      participantStatus: 'pending',
      respondedAt: null,
      partyId: sideB.partyId,
      workspaceId: sideB.workspaceId,
    },
    {
      userId: sideB.userId,
      role: 'offer_provider',
      opportunityId: sideB.offerId,
      participantStatus: 'pending',
      respondedAt: null,
      partyId: sideB.partyId,
      workspaceId: sideB.workspaceId,
    },
  ]

  const breakdown = toMatchCriteria(match.breakdown)
  const { scoreAtoB, scoreBtoA, ...factorCriteria } = breakdown
  return {
    aggregateId: context.createAggregateId(),
    matchType: 'two_way',
    matchScore: match.matchScore,
    sideA: { userId: sideA.userId, needId: sideA.needId, offerId: sideA.offerId },
    sideB: { userId: sideB.userId, needId: sideB.needId, offerId: sideB.offerId },
    scoreAtoB,
    scoreBtoA,
    matchCriteria: factorCriteria,
    valueEquivalence: match.valueEquivalence ?? null,
    participants,
    runId: context.runId,
  } as DiscoverPostMatchInput
}

function mapConsortiumMatch(
  match: ScoredMatch,
  result: ConsortiumMatchResult,
  context: ResolvedDiscoverContext,
): DiscoverPostMatchInput | null {
  const leadNeedId = context.anchorOpportunity.id
  const leadOwner = resolveOpportunityOwner(
    context.anchorOpportunity,
    context.ownershipContext,
  )
  if (!leadOwner?.representativeUserId && !context.anchorOpportunity.creatorId) {
    return null
  }

  const leadUserId =
    leadOwner?.representativeUserId ?? context.anchorOpportunity.creatorId ?? ''

  const roles: PostMatchConsortiumRole[] = []
  for (const partner of match.suggestedPartners ?? []) {
    const partnerOpp = partner.opportunityId
      ? context.opportunityById.get(partner.opportunityId)
      : undefined
    const partnerOwner = partnerOpp
      ? resolveOpportunityOwner(partnerOpp, context.ownershipContext)
      : null
    if (
      partnerOwner &&
      sameOwnerParty(leadOwner?.ownerPartyId, partnerOwner.ownerPartyId)
    ) {
      continue
    }
    const userId =
      partnerOwner?.representativeUserId ??
      partner.creatorId ??
      partnerOpp?.createdByUserId ??
      partnerOpp?.creatorId ??
      ''
    if (!partner.opportunityId || !userId) continue
    roles.push({
      role: partner.role ?? 'General',
      opportunityId: partner.opportunityId,
      userId,
      score: result.roleResults?.find((roleResult) => roleResult.role === partner.role)
        ?.matchScore,
    })
  }

  if (roles.length === 0) return null

  const leadParticipant = buildDiscoverParticipant(
    context.anchorOpportunity,
    'consortium_lead',
    context.ownershipContext,
  )
  if (!leadParticipant) return null

  const participants: PostMatchParticipant[] = [leadParticipant]

  for (const role of roles) {
    if (role.userId === leadUserId) continue
    const roleOpp = context.opportunityById.get(role.opportunityId)
    const memberParticipant = roleOpp
      ? buildDiscoverParticipant(roleOpp, 'consortium_member', context.ownershipContext)
      : null
    participants.push(
      memberParticipant ?? {
        userId: role.userId,
        role: 'consortium_member',
        opportunityId: role.opportunityId,
        participantStatus: 'pending',
        respondedAt: null,
      },
    )
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
  context: ResolvedDiscoverContext,
): DiscoverPostMatchInput | null {
  const anchorOwner = resolveOpportunityOwner(
    context.anchorOpportunity,
    context.ownershipContext,
  )
  const rawCycle = match.cycle ?? []
  if (!anchorOwner || rawCycle.length === 0) return null

  const anchorCreatorId = context.anchorOpportunity.creatorId
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
  const seenParty = new Set<string>()
  for (const userId of cycle) {
    const link =
      links.find((entry) => entry.toCreatorId === userId)
      ?? links.find((entry) => entry.fromCreatorId === userId)
    const opportunityId = link?.offerId ?? link?.needId
    const opportunity = opportunityId
      ? context.opportunityById.get(opportunityId)
      : undefined
    const owner = opportunity
      ? resolveOpportunityOwner(opportunity, context.ownershipContext)
      : null
    const partyKey = owner?.ownerPartyId ?? userId
    if (seenParty.has(partyKey)) continue
    seenParty.add(partyKey)

    const participant = opportunity
      ? buildDiscoverParticipant(opportunity, 'chain_participant', context.ownershipContext)
      : null
    participants.push(
      participant ?? {
        userId,
        role: 'chain_participant',
        opportunityId,
        participantStatus: 'pending',
        respondedAt: null,
      },
    )
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
  const enrichedContext = withResolvedOwnership(context)
  const commands: DiscoverPostMatchInput[] = []

  for (const match of result.matches) {
    let command: DiscoverPostMatchInput | null = null
    switch (result.model) {
      case 'one_way':
        command = mapOneWayMatch(match, enrichedContext)
        break
      case 'two_way':
        command = mapTwoWayMatch(match, result, enrichedContext, allPosts)
        break
      case 'consortium':
        command = mapConsortiumMatch(match, result, enrichedContext)
        break
      case 'circular':
        command = mapCircularMatch(match, result, enrichedContext)
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
