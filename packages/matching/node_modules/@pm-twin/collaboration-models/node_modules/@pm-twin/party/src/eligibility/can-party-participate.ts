import type { ApplicabilityInput, ImplementedPartyType } from '../types.ts'
import { getRelationshipType, isRelationshipSupported } from './relationship.ts'

export function canPartyParticipate(
  ownerType: ImplementedPartyType,
  participantType: ImplementedPartyType,
  applicability: ApplicabilityInput | undefined,
): boolean {
  if (!applicability) return true
  const relationship = getRelationshipType(ownerType, participantType)
  return isRelationshipSupported(applicability, relationship)
}
