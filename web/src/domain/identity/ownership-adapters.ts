import {
  resolveCreatedByActor,
  resolveLegacyOpportunityOwnership,
  type CreatedByActor,
} from '@pm-twin/identity'
import type { Opportunity } from '@/types/domain.ts'
import { partyIdLookupAliases } from '@/domain/party/party-projection.ts'

export type OpportunityOwnershipContext = {
  readonly companyIds: ReadonlySet<string>
  readonly userIds: ReadonlySet<string>
  readonly platformUserIds?: ReadonlySet<string>
}

export type OpportunityOwnership = {
  readonly workspaceId?: string
  readonly ownerPartyId?: string
  readonly createdByUserId?: string
  readonly createdByActor: CreatedByActor
}

type OpportunityOwnershipInput = Pick<
  Opportunity,
  'creatorId' | 'ownerPartyId'
> & {
  readonly workspaceId?: string
  readonly createdByUserId?: string
  readonly createdByActor?: CreatedByActor
}

/** Treat blank strings as absent so legacy ownership can resolve. */
export function normalizeOptionalOwnershipId(
  value: string | null | undefined,
): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function resolveOpportunityOwnership(
  opportunity: OpportunityOwnershipInput,
  ctx: OpportunityOwnershipContext,
): OpportunityOwnership {
  const ownerPartyId = normalizeOptionalOwnershipId(opportunity.ownerPartyId)
  const workspaceId = normalizeOptionalOwnershipId(opportunity.workspaceId)
  const legacy = resolveLegacyOpportunityOwnership({
    creatorId: opportunity.creatorId,
    ownerPartyId,
    companyIds: ctx.companyIds,
    userIds: ctx.userIds,
  })
  const createdByUserId =
    normalizeOptionalOwnershipId(opportunity.createdByUserId)
    ?? legacy.createdByUserId
  const actorUserId = createdByUserId ?? opportunity.creatorId
  const createdByActor = resolveCreatedByActor({
    createdByActor: opportunity.createdByActor,
    createdByUserId,
    creatorId: createdByUserId ? opportunity.creatorId : undefined,
    createdByActorType:
      actorUserId && ctx.platformUserIds?.has(actorUserId)
        ? 'platform_operator'
        : undefined,
  })

  return {
    workspaceId: workspaceId ?? legacy.workspaceId,
    ownerPartyId: ownerPartyId ?? legacy.ownerPartyId,
    createdByUserId,
    createdByActor,
  }
}

export function withCanonicalOpportunityOwnership<
  T extends OpportunityOwnershipInput,
>(
  opportunity: T,
  ctx: OpportunityOwnershipContext,
): T & OpportunityOwnership {
  return {
    ...opportunity,
    ...resolveOpportunityOwnership(opportunity, ctx),
  }
}

export type OpportunityOwnershipMatchContext = {
  readonly activeWorkspaceId?: string | null
  readonly activePartyId?: string | null
  readonly userId?: string | null
}

/**
 * Canonical ownership match with a legacy creator fallback only when the
 * opportunity has no canonical workspace or party owner.
 */
export function isOpportunityOwnedByContext(
  opportunity: Pick<Opportunity, 'workspaceId' | 'ownerPartyId' | 'creatorId'> & {
    readonly createdByUserId?: string
  },
  context: OpportunityOwnershipMatchContext,
): boolean {
  if (
    context.activePartyId &&
    opportunity.ownerPartyId &&
    partyIdsMatch(opportunity.ownerPartyId, context.activePartyId)
  ) {
    return true
  }
  if (
    context.activeWorkspaceId &&
    opportunity.workspaceId === context.activeWorkspaceId
  ) {
    return true
  }
  // Legacy creator fallback only when canonical ownership fields are absent.
  if (!opportunity.workspaceId && !opportunity.ownerPartyId) {
    const creator =
      opportunity.createdByUserId ?? opportunity.creatorId
    return Boolean(context.userId && creator === context.userId)
  }
  return false
}

function partyIdsMatch(left: string, right: string): boolean {
  if (left === right) return true
  const leftAliases = new Set(partyIdLookupAliases(left))
  return partyIdLookupAliases(right).some((alias) => leftAliases.has(alias))
}
