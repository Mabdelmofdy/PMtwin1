/** Public / participant visibility redaction for commercial structure. */

import type { OpportunityCommercialStructure } from './types.ts'
import { buildCommercialStructureSummary } from './commercial-summary.ts'

export type CommercialVisibilityAudience =
  | 'owner'
  | 'participant'
  | 'marketplace'
  | 'admin'
  | 'auditor'

export type PublicCommercialPresentation = {
  derivedExchangeMode: string
  isHybrid: boolean
  componentTypes: string[]
  allocationVisible: boolean
  allocationLines: string[]
  showAmounts: boolean
}

export function presentCommercialForAudience(
  structure: OpportunityCommercialStructure | null | undefined,
  audience: CommercialVisibilityAudience,
): PublicCommercialPresentation | null {
  if (!structure) return null
  const summary = buildCommercialStructureSummary(structure)
  const showAmounts =
    audience === 'owner'
    || audience === 'participant'
    || audience === 'admin'
    || audience === 'auditor'

  return {
    derivedExchangeMode: summary.derivedExchangeMode,
    isHybrid: summary.isHybrid,
    componentTypes: summary.componentLabels,
    allocationVisible: showAmounts && summary.allocationLines.length > 0,
    allocationLines: showAmounts ? summary.allocationLines : [],
    showAmounts,
  }
}

/** Flatten confidential fields for marketplace cards. */
export function redactCommercialForMarketplace(
  structure: OpportunityCommercialStructure | null | undefined,
): {
  isHybrid: boolean
  componentTypes: string[]
  derivedMode: string
} | null {
  const presented = presentCommercialForAudience(structure, 'marketplace')
  if (!presented) return null
  return {
    isHybrid: presented.isHybrid,
    componentTypes: presented.componentTypes,
    derivedMode: presented.derivedExchangeMode,
  }
}
