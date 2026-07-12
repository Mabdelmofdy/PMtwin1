import {
  resolveCreatedByActor,
  resolveLegacyOpportunityOwnership,
  type CreatedByActor,
} from '@pm-twin/identity'
import type { Opportunity } from '@/types/domain.ts'

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

export function resolveOpportunityOwnership(
  opportunity: OpportunityOwnershipInput,
  ctx: OpportunityOwnershipContext,
): OpportunityOwnership {
  const legacy = resolveLegacyOpportunityOwnership({
    creatorId: opportunity.creatorId,
    ownerPartyId: opportunity.ownerPartyId,
    companyIds: ctx.companyIds,
    userIds: ctx.userIds,
  })
  const createdByUserId =
    opportunity.createdByUserId ?? legacy.createdByUserId
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
    workspaceId: opportunity.workspaceId ?? legacy.workspaceId,
    ownerPartyId: opportunity.ownerPartyId ?? legacy.ownerPartyId,
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
  opportunity: Pick<Opportunity, 'workspaceId' | 'ownerPartyId' | 'creatorId'>,
  context: OpportunityOwnershipMatchContext,
): boolean {
  if (
    context.activePartyId &&
    opportunity.ownerPartyId === context.activePartyId
  ) {
    return true
  }
  if (
    context.activeWorkspaceId &&
    opportunity.workspaceId === context.activeWorkspaceId
  ) {
    return true
  }
  return Boolean(
    !opportunity.workspaceId &&
      !opportunity.ownerPartyId &&
      context.userId &&
      opportunity.creatorId === context.userId,
  )
}
