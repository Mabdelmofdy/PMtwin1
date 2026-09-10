import {
  partyIdForSource,
  SYSTEM_MIGRATION_USER_ID,
  workspaceIdForSource,
  resolveLegacyOpportunityOwnership,
} from '@pm-twin/identity'
import type { PostMatchParticipant } from '@pm-twin/commands'
import type { OpportunityPost } from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'
import { toBusinessParticipant } from './business-participants.ts'
import {
  resolveOpportunityOwnership,
  type OpportunityOwnership,
  type OpportunityOwnershipContext,
} from './ownership-adapters.ts'

export type CompanyHumanParticipantLink = {
  readonly companyId: string
  readonly userId: string
  readonly role?: string
}

export type MatchingDiscoveryOwnershipContext = OpportunityOwnershipContext & {
  /**
   * Human user ids associated with a company owner key (company account id,
   * ownerPartyId, or company workspaceId). Used only for participant /
   * notification identity — never as ownerPartyId.
   */
  readonly humanUserIdsByOwnerKey?: ReadonlyMap<string, readonly string[]>
}

const COMPANY_WORKSPACE_PREFIX = 'ws-company-'
const PREFERRED_COMPANY_HUMAN_ROLES = new Set([
  'workspace_owner',
  'company_owner',
  'owner',
])

export function buildMatchingDiscoveryContext(
  userIds: readonly string[],
  companyIds: readonly string[],
  options?: {
    readonly companyHumanLinks?: readonly CompanyHumanParticipantLink[]
    readonly humanUserIdsByOwnerKey?: ReadonlyMap<string, readonly string[]>
  },
): MatchingDiscoveryOwnershipContext {
  const userIdSet = new Set(userIds)
  const companyIdSet = new Set(companyIds)
  const humanUserIdsByOwnerKey =
    options?.humanUserIdsByOwnerKey
    ?? (options?.companyHumanLinks
      ? indexHumanUserIdsByOwnerKey(
          options.companyHumanLinks,
          companyIdSet,
          userIdSet,
        )
      : undefined)

  return {
    userIds: userIdSet,
    companyIds: companyIdSet,
    humanUserIdsByOwnerKey,
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

type OpportunityOwnerInput = Pick<
  Opportunity,
  'id' | 'creatorId' | 'ownerPartyId' | 'workspaceId' | 'createdByUserId'
>

export function isValidHumanParticipantUserId(
  userId: string | undefined,
  ctx: MatchingDiscoveryOwnershipContext,
): userId is string {
  if (!userId) return false
  if (userId === SYSTEM_MIGRATION_USER_ID) return false
  if (ctx.companyIds.has(userId)) return false
  return true
}

export function indexHumanUserIdsByOwnerKey(
  links: readonly CompanyHumanParticipantLink[],
  companyIds: ReadonlySet<string>,
  userIds: ReadonlySet<string> = new Set(),
): Map<string, string[]> {
  type Ranked = { readonly userId: string; readonly rank: number }
  const buckets = new Map<string, Ranked[]>()

  const add = (key: string, userId: string, role?: string): void => {
    if (!key) return
    if (!isValidHumanParticipantUserId(userId, { userIds, companyIds })) return
    if (userIds.size > 0 && !userIds.has(userId)) return
    const rank = role && PREFERRED_COMPANY_HUMAN_ROLES.has(role) ? 0 : 1
    const list = buckets.get(key) ?? []
    if (list.some((entry) => entry.userId === userId)) return
    list.push({ userId, rank })
    buckets.set(key, list)
  }

  for (const link of links) {
    if (!companyIds.has(link.companyId)) continue
    if (link.userId === link.companyId) continue
    add(link.companyId, link.userId, link.role)
    add(partyIdForSource(link.companyId, 'company'), link.userId, link.role)
    add(workspaceIdForSource(link.companyId, 'company'), link.userId, link.role)
  }

  const indexed = new Map<string, string[]>()
  for (const [key, ranked] of buckets) {
    const sorted = [...ranked].sort(
      (left, right) => left.rank - right.rank || left.userId.localeCompare(right.userId),
    )
    indexed.set(key, sorted.map((entry) => entry.userId))
  }
  return indexed
}

type AccountWithEmployerFields = {
  readonly id: string
  readonly employerCompanyId?: string
  readonly companyId?: string
  readonly profile?: unknown
}

function optionalStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const candidate = (value as Record<string, unknown>)[key]
  return typeof candidate === 'string' && candidate.trim().length > 0
    ? candidate
    : undefined
}

export function employerCompanyIdFromAccount(
  account: AccountWithEmployerFields,
): string | undefined {
  return (
    account.employerCompanyId
    ?? account.companyId
    ?? optionalStringField(account.profile, 'employerCompanyId')
    ?? optionalStringField(account.profile, 'companyId')
  )
}

export function collectCompanyHumanLinksFromAccounts(
  users: readonly AccountWithEmployerFields[],
  companyIds: ReadonlySet<string>,
): CompanyHumanParticipantLink[] {
  const links: CompanyHumanParticipantLink[] = []
  for (const user of users) {
    if (companyIds.has(user.id) || user.id === SYSTEM_MIGRATION_USER_ID) continue
    const companyId = employerCompanyIdFromAccount(user)
    if (!companyId || !companyIds.has(companyId) || user.id === companyId) continue
    links.push({ companyId, userId: user.id, role: 'member' })
  }
  return links
}

export function collectCompanyHumanLinksFromMemberships(
  memberships: readonly {
    readonly userId: string
    readonly workspaceId: string
    readonly role?: string
    readonly status?: string
  }[],
  companyIds: ReadonlySet<string>,
): CompanyHumanParticipantLink[] {
  const links: CompanyHumanParticipantLink[] = []
  for (const membership of memberships) {
    if (membership.status && membership.status !== 'active') continue
    if (companyIds.has(membership.userId)) continue
    if (!membership.workspaceId.startsWith(COMPANY_WORKSPACE_PREFIX)) continue
    const companyId = membership.workspaceId.slice(COMPANY_WORKSPACE_PREFIX.length)
    if (!companyId || !companyIds.has(companyId)) continue
    links.push({
      companyId,
      userId: membership.userId,
      role: membership.role,
    })
  }
  return links
}

function lookupMappedHumanParticipant(
  keys: readonly (string | undefined)[],
  ctx: MatchingDiscoveryOwnershipContext,
): string | undefined {
  const index = ctx.humanUserIdsByOwnerKey
  if (!index) return undefined
  for (const key of keys) {
    if (!key) continue
    const candidates = index.get(key) ?? []
    const human = candidates.find((candidate) =>
      isValidHumanParticipantUserId(candidate, ctx),
    )
    if (human) return human
  }
  return undefined
}

/**
 * Resolve a human user id for participant / notification records.
 * Never returns a company id. Does not change ownerPartyId.
 */
export function resolveHumanParticipantUserId(
  opportunity: Pick<
    Opportunity,
    'creatorId' | 'createdByUserId' | 'ownerPartyId' | 'workspaceId'
  >,
  ctx: MatchingDiscoveryOwnershipContext,
  ownership?: Pick<
    OpportunityOwnership,
    'createdByUserId' | 'ownerPartyId' | 'workspaceId'
  >,
): string | undefined {
  const createdBy = ownership?.createdByUserId ?? opportunity.createdByUserId
  if (isValidHumanParticipantUserId(createdBy, ctx)) return createdBy

  if (
    opportunity.creatorId
    && ctx.userIds.has(opportunity.creatorId)
    && isValidHumanParticipantUserId(opportunity.creatorId, ctx)
  ) {
    return opportunity.creatorId
  }

  return lookupMappedHumanParticipant(
    [
      ownership?.ownerPartyId ?? opportunity.ownerPartyId,
      ownership?.workspaceId ?? opportunity.workspaceId,
      opportunity.creatorId,
    ],
    ctx,
  )
}

export function resolveOpportunityOwner(
  opportunity: OpportunityOwnerInput,
  ctx: MatchingDiscoveryOwnershipContext,
): ResolvedOpportunityOwner | null {
  const ownership = resolveOpportunityOwnership(opportunity, ctx)
  if (!ownership.ownerPartyId || !ownership.workspaceId) return null

  return {
    ownerPartyId: ownership.ownerPartyId,
    workspaceId: ownership.workspaceId,
    representativeUserId: resolveHumanParticipantUserId(opportunity, ctx, ownership),
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

  // Prefer a human actor id. Never notify a company id as if it were a user.
  const candidateUserId =
    owner.representativeUserId
    ?? resolveHumanParticipantUserId(opportunity, ctx, owner)

  if (!candidateUserId || ctx.companyIds.has(candidateUserId)) return null

  const mapped = toBusinessParticipant(
    {
      userId: candidateUserId,
      role,
      opportunityId: opportunity.id,
      partyId: owner.ownerPartyId,
      workspaceId: owner.workspaceId,
    },
    ctx,
  )

  return {
    userId: candidateUserId,
    role,
    opportunityId: opportunity.id,
    participantStatus,
    respondedAt: null,
    partyId: mapped.partyId,
    workspaceId: mapped.workspaceId,
    representativeUserIds: mapped.representativeUserIds ?? [candidateUserId],
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
