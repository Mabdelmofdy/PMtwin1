import type { ApplicabilityInput, ImplementedPartyType, RelationshipType } from '../types.ts'

export function getRelationshipType(
  ownerType: ImplementedPartyType,
  participantType: ImplementedPartyType,
): RelationshipType {
  if (ownerType === 'company' && participantType === 'company') return 'B2B'
  if (ownerType === 'company' && participantType === 'individual') return 'B2P'
  if (ownerType === 'individual' && participantType === 'company') return 'P2B'
  return 'P2P'
}

export function resolvePrimaryRelationship(
  applicability: Pick<ApplicabilityInput, 'primaryRelationship' | 'supportedRelationships'>,
): RelationshipType | undefined {
  if (applicability.primaryRelationship) return applicability.primaryRelationship
  return applicability.supportedRelationships[0]
}

export function relationshipFlagsFromSupported(
  supported: readonly RelationshipType[],
): Pick<
  ApplicabilityInput,
  'supportsB2B' | 'supportsB2P' | 'supportsP2B' | 'supportsP2P'
> {
  return {
    supportsB2B: supported.includes('B2B'),
    supportsB2P: supported.includes('B2P'),
    supportsP2B: supported.includes('P2B'),
    supportsP2P: supported.includes('P2P'),
  }
}

export function isRelationshipSupported(
  applicability: ApplicabilityInput,
  relationship: RelationshipType,
): boolean {
  if (applicability.supportedRelationships.includes(relationship)) return true
  switch (relationship) {
    case 'B2B':
      return applicability.supportsB2B === true
    case 'B2P':
      return applicability.supportsB2P === true
    case 'P2B':
      return applicability.supportsP2B === true
    case 'P2P':
      return applicability.supportsP2P === true
    default:
      return false
  }
}
