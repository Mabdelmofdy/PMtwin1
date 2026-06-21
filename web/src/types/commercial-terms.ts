/** Canonical commercial terms structure (Phase B2). */
export type CommercialTerms = {
  amount?: number
  currency?: string
  duration?: string
  paymentSchedule?: string
  profitSplit?: number | string
  exchangeMode?: string
}

/** @deprecated Use CommercialTerms — legacy negotiation/deal terms shape */
export type NegotiationTerms = CommercialTerms & {
  value?: number
}

/** @deprecated Use CommercialTerms — legacy application value blob */
export type ApplicationValue = {
  amount?: number
  currency?: string
  requestedValue?: number
  requested_value?: number
  value_score?: number
  commercialTerms?: CommercialTerms
}

export function commercialTermsFromApplicationValue(
  raw?: ApplicationValue | null,
): CommercialTerms | undefined {
  if (!raw) return undefined
  if (raw.commercialTerms) return raw.commercialTerms
  const amount =
    raw.amount ?? raw.requestedValue ?? raw.requested_value ?? undefined
  if (amount == null && !raw.currency) return undefined
  return {
    amount: amount != null ? Number(amount) : undefined,
    currency: raw.currency ?? 'SAR',
  }
}

export function commercialTermsFromLegacyTerms(
  source?: CommercialTerms | NegotiationTerms | null,
): CommercialTerms | undefined {
  if (!source) return undefined
  const amount =
    source.amount ??
    (source as NegotiationTerms).value ??
    (source as { agreedValue?: number }).agreedValue
  return {
    amount: amount != null ? Number(amount) : undefined,
    currency: source.currency ?? 'SAR',
    duration: source.duration,
    paymentSchedule: source.paymentSchedule,
    profitSplit: source.profitSplit,
    exchangeMode: source.exchangeMode,
  }
}

export function commercialTermsFromValueTerms(
  valueTerms?: Record<string, unknown> | null,
): CommercialTerms | undefined {
  if (!valueTerms) return undefined
  return commercialTermsFromLegacyTerms(valueTerms as NegotiationTerms)
}
