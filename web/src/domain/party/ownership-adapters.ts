import type { Opportunity } from '@/types/domain.ts'
import { resolveOwnerPartyId, type OwnerResolvableEntity } from '@pm-twin/party'

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
