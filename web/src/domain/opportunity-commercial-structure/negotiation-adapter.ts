/**
 * Negotiation handoff: copy opportunity commercial structure into proposed terms.
 * Accepted Offer remains authoritative for Commercial Agreement.
 */

import type { CommercialTerms } from '@/types/commercial-terms.ts'
import { deriveLegacyExchangeMode } from './legacy-migration.ts'
import type {
  OpportunityCommercialStructure,
} from './types.ts'
import { buildCommercialStructureSummary } from './commercial-summary.ts'

export type ProposedCommercialTerms = CommercialTerms & {
  commercialStructure?: OpportunityCommercialStructure
  sourceComponentIds?: string[]
  commercialStructureVersion?: number
}

export function commercialStructureToProposedTerms(
  structure: OpportunityCommercialStructure,
): ProposedCommercialTerms {
  const enabled = structure.components.filter((c) => c.enabled)
  const mode = deriveLegacyExchangeMode(structure)
  const cash = enabled.find((c) => c.type === 'cash')
  const profit = enabled.find((c) => c.type === 'profit_sharing')

  const amount =
    cash && cash.type === 'cash'
      ? cash.fixedAmount ?? cash.maximumAmount ?? cash.minimumAmount
      : undefined
  const currency =
    cash && cash.type === 'cash' ? cash.currency ?? 'SAR' : 'SAR'

  const paymentSchedule =
    cash && cash.type === 'cash' && cash.paymentSchedule?.length
      ? cash.paymentSchedule
          .map((item) => item.title || item.description || '')
          .filter(Boolean)
          .join('; ')
      : cash && cash.type === 'cash'
        ? cash.paymentTerms
        : undefined

  const profitSplit =
    profit && profit.type === 'profit_sharing'
      ? profit.profitSharePercentage
      : undefined

  return {
    amount,
    currency,
    paymentSchedule,
    profitSplit,
    exchangeMode: mode || undefined,
    commercialStructure: structuredClone(structure),
    sourceComponentIds: enabled.map((c) => c.id),
    commercialStructureVersion: 1,
  }
}

export function proposedTermsSummaryLines(
  terms: ProposedCommercialTerms,
): string[] {
  if (terms.commercialStructure) {
    return buildCommercialStructureSummary(terms.commercialStructure).previewLines
  }
  const lines: string[] = []
  if (terms.exchangeMode) lines.push(`Exchange: ${terms.exchangeMode}`)
  if (terms.amount != null) {
    lines.push(`Amount: ${terms.amount} ${terms.currency ?? 'SAR'}`)
  }
  return lines
}
