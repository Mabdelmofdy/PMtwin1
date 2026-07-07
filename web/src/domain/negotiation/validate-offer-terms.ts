import type { CommercialTerms } from '@/types/commercial-terms.ts'
import type { Negotiation } from '@/types/domain.ts'
import { VALUE_EXCHANGE_FIELD_GROUPS, type ExchangeMode } from '@pm-twin/collaboration-models'

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

function hasField(data: Readonly<Record<string, unknown>>, key: string): boolean {
  const value = data[key]
  if (value == null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

export function validateNegotiationOfferTerms(
  negotiation: Negotiation,
  terms: CommercialTerms,
): readonly string[] {
  const errors: string[] = []
  const exchangeMode =
    normalizeExchangeMode(terms.exchangeMode)
    ?? normalizeExchangeMode(negotiation.commercialTerms?.exchangeMode)

  if (!exchangeMode) {
    errors.push('Exchange mode is required for negotiation offers')
    return errors
  }

  const payload: Record<string, unknown> = {
    ...(negotiation.commercialTerms as Record<string, unknown> | undefined),
    ...(terms as Record<string, unknown>),
    budget: terms.amount ?? (terms as { budget?: number }).budget,
  }

  const group = VALUE_EXCHANGE_FIELD_GROUPS[exchangeMode]
  for (const field of group.requiredFields) {
    if (!hasField(payload, field)) {
      errors.push(`Missing required ${exchangeMode} offer field: ${field}`)
    }
  }

  if (exchangeMode === 'barter' || exchangeMode === 'hybrid') {
    const hasBarter =
      hasField(payload, 'barterOffer')
      || hasField(payload, 'offeredService')
      || hasField(payload, 'barterComponent')
    const hasRequest =
      hasField(payload, 'barterPreferences')
      || hasField(payload, 'requestedService')
    if (!hasBarter || !hasRequest) {
      errors.push('Barter offer requires offered and requested service data')
    }
  }

  return errors
}

export function diffCommercialTerms(
  previous: CommercialTerms | undefined,
  next: CommercialTerms,
): readonly string[] {
  const keys = new Set([
    ...Object.keys(previous ?? {}),
    ...Object.keys(next),
  ])
  const changes: string[] = []
  for (const key of keys) {
    const before = (previous as Record<string, unknown> | undefined)?.[key]
    const after = (next as Record<string, unknown>)[key]
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push(`${key}: ${String(before ?? '—')} → ${String(after ?? '—')}`)
    }
  }
  return changes
}
