import type { OwnerResolvableEntity } from '../types.ts'

export function resolveOwnerPartyId(entity: OwnerResolvableEntity): string | undefined {
  if (entity.ownerPartyId) return entity.ownerPartyId
  if (entity.creatorId) return entity.creatorId
  if (entity.companyId) return entity.companyId
  return undefined
}
