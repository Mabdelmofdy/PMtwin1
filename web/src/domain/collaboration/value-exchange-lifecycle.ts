import {
  extractCommercialTermsFromExchange,
  type ExchangeMode,
} from '@pm-twin/collaboration-models'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
import { commercialTermsFromLegacyTerms } from '@/types/commercial-terms.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import type { Opportunity } from '@/types/domain.ts'
import {
  commercialStructureToProposedTerms,
  migrateLegacyExchangeModeToCommercialStructure,
  type OpportunityCommercialStructure,
} from '@/domain/opportunity-commercial-structure'

function normalizeExchangeMode(mode?: string): ExchangeMode | undefined {
  if (!mode) return undefined
  const normalized = mode.toLowerCase().replace(/-/g, '_')
  if (
    normalized === 'cash'
    || normalized === 'barter'
    || normalized === 'equity'
    || normalized === 'profit_sharing'
    || normalized === 'hybrid'
  ) {
    return normalized
  }
  return undefined
}

function amountFromBudget(
  budget: unknown,
): { amount?: number; currency?: string } {
  if (budget == null) return {}
  if (typeof budget === 'number') {
    return { amount: budget, currency: 'SAR' }
  }
  if (typeof budget === 'object' && budget !== null) {
    const record = budget as { min?: number; max?: number; currency?: string }
    const amount = record.max ?? record.min
    return {
      amount: amount != null ? Number(amount) : undefined,
      currency: record.currency ?? 'SAR',
    }
  }
  return {}
}

/** Build canonical commercial terms from an opportunity's exchange payload. */
export function buildCommercialTermsFromOpportunity(
  opportunity: Opportunity,
): CommercialTerms {
  const attrs = opportunity.collaborationAttributes ?? {}
  const exchangeData = {
    ...(opportunity.exchangeData ?? {}),
    ...attrs,
  }

  const structure = migrateLegacyExchangeModeToCommercialStructure({
    exchangeMode: opportunity.exchangeMode,
    acceptedExchangeModes: opportunity.acceptedExchangeModes,
    paymentModes: opportunity.paymentModes,
    commercialStructure: attrs.commercialStructure as
      | OpportunityCommercialStructure
      | undefined,
    exchangeData,
    collaborationAttributes: attrs,
  })

  if (structure.components.some((c) => c.enabled)) {
    const proposed = commercialStructureToProposedTerms(structure)
    // Preserve explicit legacy hybrid intent for matching/negotiation handoff.
    if (normalizeExchangeMode(opportunity.exchangeMode) === 'hybrid') {
      return { ...proposed, exchangeMode: 'hybrid' }
    }
    return proposed
  }

  const mode = normalizeExchangeMode(opportunity.exchangeMode) ?? 'cash'
  const extracted = extractCommercialTermsFromExchange(exchangeData, mode)
  const fromLegacy = commercialTermsFromLegacyTerms(extracted as CommercialTerms)
  const budgetAmount = amountFromBudget(extracted.budget ?? exchangeData.budgetRange)

  const durationRaw =
    exchangeData.duration
    ?? opportunity.collaborationAttributes?.duration
    ?? opportunity.collaborationAttributes?.contractDuration

  return {
    amount: fromLegacy?.amount ?? budgetAmount.amount,
    currency: fromLegacy?.currency ?? budgetAmount.currency ?? 'SAR',
    duration: fromLegacy?.duration ?? (durationRaw != null ? String(durationRaw) : undefined),
    paymentSchedule:
      fromLegacy?.paymentSchedule
      ?? (typeof extracted.paymentSchedule === 'string' ? extracted.paymentSchedule : undefined)
      ?? (typeof exchangeData.cashPaymentTerms === 'string' ? exchangeData.cashPaymentTerms : undefined),
    profitSplit:
      fromLegacy?.profitSplit
      ?? (extracted.profitSplit as string | number | undefined)
      ?? (extracted.calculationBasis as string | undefined),
    exchangeMode: mode,
  }
}

export function formatCommercialTermsDisplayLines(
  terms: CommercialTerms | null | undefined,
): readonly string[] {
  if (!terms) return []
  const lines: string[] = []
  if (terms.exchangeMode) {
    lines.push(`Exchange: ${formatCollaborationExchangeMode(terms.exchangeMode)}`)
  }
  if (terms.amount != null) {
    lines.push(`Amount: ${terms.amount.toLocaleString('en-GB')} ${terms.currency ?? 'SAR'}`)
  }
  if (terms.duration) lines.push(`Duration: ${terms.duration}`)
  if (terms.paymentSchedule) lines.push(`Payment schedule: ${terms.paymentSchedule}`)
  if (terms.profitSplit != null) lines.push(`Profit split: ${terms.profitSplit}`)
  return lines
}

export function mergeOpportunityExchangeIntoTerms(
  opportunity: Opportunity,
  existing?: CommercialTerms | null,
): CommercialTerms {
  const seeded = buildCommercialTermsFromOpportunity(opportunity)
  return {
    ...seeded,
    ...existing,
    exchangeMode: existing?.exchangeMode ?? seeded.exchangeMode,
    amount: existing?.amount ?? seeded.amount,
    currency: existing?.currency ?? seeded.currency,
    duration: existing?.duration ?? seeded.duration,
    paymentSchedule: existing?.paymentSchedule ?? seeded.paymentSchedule,
    profitSplit: existing?.profitSplit ?? seeded.profitSplit,
  }
}

/** Wizard draft payload for opportunity.exchangeData by mode. */
export function buildValueExchangeDraftPayload(input: {
  readonly exchangeMode: string
  readonly paymentModes: readonly string[]
  readonly collaborationAttributes: Readonly<Record<string, unknown>>
}): Record<string, unknown> {
  const mode = (input.exchangeMode || 'cash').toLowerCase().replace(/-/g, '_')
  const attrs = input.collaborationAttributes
  const payload: Record<string, unknown> = {
    exchangeMode: mode,
    accepted_modes: [...input.paymentModes],
  }

  if (mode === 'cash' || mode === 'hybrid') {
    if (attrs.budgetRange) payload.budgetRange = attrs.budgetRange
    if (attrs.budget) payload.budgetRange = attrs.budget
    if (attrs.paymentSchedule) payload.paymentSchedule = attrs.paymentSchedule
    if (attrs.cashPaymentTerms) payload.cashPaymentTerms = attrs.cashPaymentTerms
    if (attrs.cashAmount) payload.cashAmount = attrs.cashAmount
  }

  if (mode === 'barter' || mode === 'hybrid') {
    if (attrs.barterOffer) payload.barterOffer = attrs.barterOffer
    if (attrs.offeredService) payload.barterOffer = attrs.offeredService
    if (attrs.barterPreferences) payload.barterPreferences = attrs.barterPreferences
    if (attrs.requestedService) payload.barterPreferences = attrs.requestedService
    if (attrs.equivalenceEstimate) payload.equivalenceEstimate = attrs.equivalenceEstimate
  }

  if (mode === 'profit_sharing' || mode === 'hybrid') {
    if (attrs.profitSplit) payload.profitSplit = attrs.profitSplit
    if (attrs.profitDistribution) payload.profitSplit = attrs.profitDistribution
    if (attrs.calculationBasis) payload.calculationBasis = attrs.calculationBasis
  }

  if (mode === 'equity' || mode === 'hybrid') {
    if (attrs.equityPercentage) payload.equityPercentage = attrs.equityPercentage
    if (attrs.equitySplit) payload.equitySplit = attrs.equitySplit
    if (attrs.ownershipTerms) payload.ownershipTerms = attrs.ownershipTerms
    if (attrs.vestingTerms) payload.vestingTerms = attrs.vestingTerms
  }

  if (mode === 'hybrid') {
    if (attrs.cashComponent) payload.cashComponent = attrs.cashComponent
    if (attrs.barterComponent) payload.barterComponent = attrs.barterComponent
    if (attrs.equityComponent) payload.equityComponent = attrs.equityComponent
    if (attrs.profitComponent) payload.profitComponent = attrs.profitComponent
  }

  return payload
}
