import type {
  ApplicabilityInput,
  PartyEligibilityContext,
  PartyEligibilityResult,
} from '../types.ts'
import { canPartyOwnSubModel } from './can-party-own.ts'
import { canPartyParticipate } from './can-party-participate.ts'
import { getRelationshipType, resolvePrimaryRelationship } from './relationship.ts'

export function validatePartyEligibility(
  context: PartyEligibilityContext,
  applicability: ApplicabilityInput | undefined,
): PartyEligibilityResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!applicability) {
    return { valid: true, errors, warnings }
  }

  if (!canPartyOwnSubModel(context.ownerPartyType, applicability)) {
    errors.push(
      applicability.reason
        ?? `Party type "${context.ownerPartyType}" cannot own this collaboration sub-model`,
    )
  }

  if (context.participantPartyType) {
    if (
      !canPartyParticipate(
        context.ownerPartyType,
        context.participantPartyType,
        applicability,
      )
    ) {
      const relationship = getRelationshipType(
        context.ownerPartyType,
        context.participantPartyType,
      )
      errors.push(
        `Relationship ${relationship} is not supported for this collaboration sub-model`,
      )
    }
  }

  const primary = resolvePrimaryRelationship(applicability)
  if (primary && context.participantPartyType) {
    const actual = getRelationshipType(context.ownerPartyType, context.participantPartyType)
    if (actual !== primary) {
      warnings.push(
        `Primary relationship for this sub-model is ${primary}; current pairing is ${actual}`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
