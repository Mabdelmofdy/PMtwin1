/** Matching-compatible exchange profile from commercial structure. */

import type { ExchangeMode } from '@pm-twin/collaboration-models'
import { deriveLegacyExchangeMode, derivePrimaryMode } from './legacy-migration.ts'
import type {
  MatchingExchangeProfile,
  OpportunityCommercialStructure,
} from './types.ts'

export function deriveMatchingExchangeProfile(
  commercialStructure: OpportunityCommercialStructure,
): MatchingExchangeProfile {
  const enabled = commercialStructure.components.filter((c) => c.enabled)
  const modes = enabled.map((c) => c.type)
  const legacyMode = deriveLegacyExchangeMode(commercialStructure)
  const primaryMode: ExchangeMode =
    legacyMode === ''
      ? 'cash'
      : legacyMode

  const allocationSummary = enabled.map((c) => ({
    type: c.type,
    percentage: c.allocationPercentage,
    amount: c.allocationAmount?.amount,
    currency: c.allocationAmount?.currency,
  }))

  const negotiability: MatchingExchangeProfile['negotiability'] = {}
  for (const c of enabled) {
    negotiability[c.type] = c.negotiable !== false
  }

  return {
    primaryMode,
    modes,
    isHybrid: enabled.length > 1 || primaryMode === 'hybrid',
    allocationMethod: commercialStructure.allocationMethod,
    allocationSummary,
    negotiability,
  }
}

/** Sync primaryMode + derived hybrid onto structure for persistence. */
export function syncCommercialStructureDerivedFields(
  structure: OpportunityCommercialStructure,
): OpportunityCommercialStructure {
  const enabled = structure.components.filter((c) => c.enabled)
  return {
    ...structure,
    primaryMode: derivePrimaryMode(structure),
    totalAllocationPercentage:
      structure.allocationMethod === 'percentage'
        ? enabled.reduce((sum, c) => sum + (c.allocationPercentage ?? 0), 0)
        : structure.totalAllocationPercentage,
  }
}
