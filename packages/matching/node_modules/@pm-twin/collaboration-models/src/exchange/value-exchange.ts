import type { ExchangeMode, ValueExchangeFieldGroup } from '../types.ts'

export const VALUE_EXCHANGE_FIELD_GROUPS: Record<ExchangeMode, ValueExchangeFieldGroup> = {
  cash: {
    mode: 'cash',
    requiredFields: ['budget', 'paymentSchedule'],
    optionalFields: ['currency', 'cashAmount', 'cashPaymentTerms', 'budgetRange'],
  },
  barter: {
    mode: 'barter',
    requiredFields: ['offeredService', 'requestedService', 'equivalenceEstimate'],
    optionalFields: ['barterOffer', 'barterPreferences'],
  },
  profit_sharing: {
    mode: 'profit_sharing',
    requiredFields: ['profitSplit', 'calculationBasis'],
    optionalFields: ['profitDistribution', 'revenueModel'],
  },
  equity: {
    mode: 'equity',
    requiredFields: ['equityPercentage', 'ownershipTerms'],
    optionalFields: ['equitySplit', 'equityStructure', 'vestingTerms'],
  },
  hybrid: {
    mode: 'hybrid',
    requiredFields: ['cashComponent', 'nonCashComponent'],
    optionalFields: ['barterComponent', 'equityComponent', 'profitComponent'],
  },
}

export function buildValueExchangePayload(
  mode: ExchangeMode,
  fields: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode]
  const payload: Record<string, unknown> = {
    exchangeMode: mode,
    ...fields,
  }
  for (const key of group.requiredFields) {
    if (fields[key] != null) payload[key] = fields[key]
  }
  return payload
}

export function extractCommercialTermsFromExchange(
  exchangeData: Readonly<Record<string, unknown>> | undefined,
  exchangeMode?: string,
): Record<string, unknown> {
  if (!exchangeData) return {}
  const mode = (exchangeMode ?? exchangeData.exchangeMode ?? 'cash')
    .toString()
    .toLowerCase()
    .replace(/-/g, '_')

  const terms: Record<string, unknown> = { exchangeMode: mode }

  if (mode === 'cash' || mode === 'hybrid') {
    if (exchangeData.budgetRange) terms.budget = exchangeData.budgetRange
    if (exchangeData.paymentSchedule ?? exchangeData.cashPaymentTerms) {
      terms.paymentSchedule = exchangeData.paymentSchedule ?? exchangeData.cashPaymentTerms
    }
    if (exchangeData.cashAmount) terms.amount = exchangeData.cashAmount
  }

  if (mode === 'barter' || mode === 'hybrid') {
    if (exchangeData.barterOffer) terms.offeredService = exchangeData.barterOffer
    if (exchangeData.barterPreferences) terms.requestedService = exchangeData.barterPreferences
    if (exchangeData.equivalenceEstimate) terms.equivalenceEstimate = exchangeData.equivalenceEstimate
  }

  if (mode === 'profit_sharing' || mode === 'hybrid') {
    if (exchangeData.profitSplit ?? exchangeData.profitDistribution) {
      terms.profitSplit = exchangeData.profitSplit ?? exchangeData.profitDistribution
    }
    if (exchangeData.calculationBasis) terms.calculationBasis = exchangeData.calculationBasis
  }

  if (mode === 'equity' || mode === 'hybrid') {
    if (exchangeData.equityPercentage ?? exchangeData.equitySplit) {
      terms.equityPercentage = exchangeData.equityPercentage ?? exchangeData.equitySplit
    }
    if (exchangeData.ownershipTerms ?? exchangeData.vestingTerms) {
      terms.ownershipTerms = exchangeData.ownershipTerms ?? exchangeData.vestingTerms
    }
  }

  return terms
}
