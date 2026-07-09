import type { ImplementedPartyType, PartyType, SourceEntityType } from '../types.ts'

const IMPLEMENTED_PARTY_TYPES: readonly ImplementedPartyType[] = ['company', 'individual']

const RESERVED_PARTY_TYPES: readonly PartyType[] = [
  'government',
  'bank',
  'investor',
  'university',
  'consortium',
  'association',
  'ngo',
]

export function isImplementedPartyType(type: string): type is ImplementedPartyType {
  return IMPLEMENTED_PARTY_TYPES.includes(type as ImplementedPartyType)
}

export function isReservedPartyType(type: string): type is PartyType {
  return RESERVED_PARTY_TYPES.includes(type as PartyType)
}

export function assertCreatablePartyType(type: string): ImplementedPartyType {
  if (isImplementedPartyType(type)) return type
  if (isReservedPartyType(type)) {
    throw new Error(`Party type "${type}" is reserved and not implemented in Sprint 2.5`)
  }
  throw new Error(`Unknown party type "${type}"`)
}

export function resolveSourceEntityType(isCompanyAccount: boolean): SourceEntityType {
  return isCompanyAccount ? 'company' : 'individual'
}

export function resolvePartyTypeFromSourceEntity(
  sourceEntityType: SourceEntityType,
): ImplementedPartyType {
  return sourceEntityType
}
