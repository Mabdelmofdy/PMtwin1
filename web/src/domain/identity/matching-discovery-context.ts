import { resolveLegacyOpportunityOwnership } from '@pm-twin/identity'
import type { PostMatchParticipant } from '@pm-twin/commands'
import type { OpportunityPost } from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'
import { toBusinessParticipant } from './business-participants.ts'
import {
  resolveOpportunityOwnership,
  type OpportunityOwnershipContext,
} from './ownership-adapters.ts'

export type MatchingDiscoveryOwnershipContext = OpportunityOwnershipContext

export function buildMatchingDiscoveryContext(
  userIds: readonly string[],
  companyIds: readonly string[],
): MatchingDiscoveryOwnershipContext {
  return {
    userIds: new Set(userIds),
    companyIds: new Set(companyIds),
  }
}

export function buildMatchingDiscoveryContextFromOpportunities(
  opportunities: readonly Pick<Opportunity, 'creatorId' | 'createdByUserId'>[],
  companyIds: ReadonlySet<string> = new Set(),
): MatchingDiscoveryOwnershipContext {
  const userIds = new Set<string>()
  const companies = new Set(companyIds)
  for (const opportunity of opportunities) {
    if (opportunity.createdByUserId) userIds.add(opportunity.createdByUserId)
    if (opportunity.creatorId) {
      if (companies.has(opportunity.creatorId)) {
        companies.add(opportunity.creatorId)
      } else {
        userIds.add(opportunity.creatorId)
      }
    }
  }
  return { userIds, companyIds: companies }
}

export type ResolvedOpportunityOwner = {
  readonly ownerPartyId: string
  readonly workspaceId: string
  readonly representativeUserId?: string
}

export function resolveOpportunityOwner(
  opportunity: Pick<
    Opportunity,
    'id' | 'creatorId' | 'ownerPartyId' | 'workspaceId' | 'createdByUserId'
  >,
  ctx: MatchingDiscoveryOwnershipContext,
): ResolvedOpportunityOwner | null {
  const ownership = resolveOpportunityOwnership(opportunity, ctx)
  if (!ownership.ownerPartyId || !ownership.workspaceId) return null

  const representativeUserId =
    ownership.createdByUserId ??
    (opportunity.creatorId && ctx.userIds.has(opportunity.creatorId)
      ? opportunity.creatorId
      : undefined)

  return {
    ownerPartyId: ownership.ownerPartyId,
    workspaceId: ownership.workspaceId,
    representativeUserId,
  }
}

export function resolvePostOwnerPartyId(
  post: OpportunityPost,
  opportunityById: ReadonlyMap<string, Opportunity>,
  ctx: MatchingDiscoveryOwnershipContext,
): string | undefined {
  const extended = post as OpportunityPost & {
    readonly ownerPartyId?: string
  }
  if (extended.ownerPartyId) return extended.ownerPartyId

  if (post.id) {
    const opportunity = opportunityById.get(post.id)
    if (opportunity) {
      return resolveOpportunityOwner(opportunity, ctx)?.ownerPartyId
    }
  }

  if (!post.creatorId) return undefined
  return resolveLegacyOpportunityOwnership({
    creatorId: post.creatorId,
    companyIds: ctx.companyIds,
    userIds: ctx.userIds,
  }).ownerPartyId
}

export function sameOwnerParty(
  left: string | undefined,
  right: string | undefined,
): boolean {
  return Boolean(left && right && left === right)
}

export function buildDiscoverParticipant(
  opportunity: Opportunity,
  role: string,
  ctx: MatchingDiscoveryOwnershipContext,
  participantStatus = 'pending',
): PostMatchParticipant | null {
  const owner = resolveOpportunityOwner(opportunity, ctx)
  if (!owner) return null

  const userId =
    owner.representativeUserId ??
    opportunity.createdByUserId ??
    opportunity.creatorId
  if (!userId) return null

  const mapped = toBusinessParticipant(
    {
      userId,
      role,
      opportunityId: opportunity.id,
      partyId: owner.ownerPartyId,
      workspaceId: owner.workspaceId,
    },
    ctx,
  )

  return {
    userId,
    role,
    opportunityId: opportunity.id,
    participantStatus,
    respondedAt: null,
    partyId: mapped.partyId,
    workspaceId: mapped.workspaceId,
    representativeUserIds: mapped.representativeUserIds,
  } as PostMatchParticipant
}

export function filterCrossOwnerPartyMatches(
  needOpportunityId: string | undefined,
  offerOpportunityId: string | undefined,
  opportunityById: ReadonlyMap<string, Opportunity>,
  ctx: MatchingDiscoveryOwnershipContext,
): boolean {
  if (!needOpportunityId || !offerOpportunityId) return true
  const need = opportunityById.get(needOpportunityId)
  const offer = opportunityById.get(offerOpportunityId)
  if (!need || !offer) return true
  const needOwner = resolveOpportunityOwner(need, ctx)?.ownerPartyId
  const offerOwner = resolveOpportunityOwner(offer, ctx)?.ownerPartyId
  if (!needOwner || !offerOwner) return true
  return !sameOwnerParty(needOwner, offerOwner)
}
