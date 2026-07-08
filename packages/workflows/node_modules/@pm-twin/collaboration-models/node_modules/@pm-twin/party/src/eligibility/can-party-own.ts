import type { ApplicabilityInput, ImplementedPartyType } from '../types.ts'

export function canPartyOwnSubModel(
  partyType: ImplementedPartyType,
  applicability: ApplicabilityInput | undefined,
): boolean {
  if (!applicability) return true
  if (!applicability.allowedPartyTypes?.length) return true
  return applicability.allowedPartyTypes.includes(partyType)
}
