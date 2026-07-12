import type { Opportunity } from '@/types/domain.ts'
import { resolveOwnerPartyId, type OwnerResolvableEntity } from '@pm-twin/party'
import {
  resolveOpportunityOwnership,
  type OpportunityOwnershipContext,
} from '@/domain/identity/ownership-adapters.ts'

export {
  resolveOpportunityOwnership,
  withCanonicalOpportunityOwnership,
  type OpportunityOwnership,
  type OpportunityOwnershipContext,
} from '@/domain/identity/ownership-adapters.ts'

export function resolveOpportunityOwnerPartyId(
  opportunity: Pick<Opportunity, 'ownerPartyId' | 'creatorId'>,
): string | undefined {
  return resolveOwnerPartyId(opportunity satisfies OwnerResolvableEntity)
}

export function withResolvedOwnerPartyId<T extends Pick<Opportunity, 'ownerPartyId' | 'creatorId'>>(
  opportunity: T,
): T & { resolvedOwnerPartyId?: string } {
  const resolvedOwnerPartyId = resolveOpportunityOwnerPartyId(opportunity)
  return resolvedOwnerPartyId
    ? { ...opportunity, resolvedOwnerPartyId }
    : opportunity
}

export function resolveOpportunityWorkspaceId(
  opportunity: Pick<Opportunity, 'ownerPartyId' | 'creatorId'> & {
    readonly workspaceId?: string
  },
  ctx: OpportunityOwnershipContext,
): string | undefined {
  return resolveOpportunityOwnership(opportunity, ctx).workspaceId
}
