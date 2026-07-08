import type { ExchangeMode } from '../types.ts'
import type { FieldGroupId } from './types.ts'
import { VALUE_EXCHANGE_FIELD_GROUPS } from '../exchange/value-exchange.ts'

export type ValueExchangeReadinessField = {
  readonly id: string
  readonly label: string
  readonly category: FieldGroupId
  readonly priority: 'required' | 'recommended'
}

const EXCHANGE_FIELD_META: Readonly<Record<string, { label: string; category: FieldGroupId }>> = {
  budget: { label: 'Budget', category: 'financial' },
  paymentSchedule: { label: 'Payment Schedule', category: 'financial' },
  currency: { label: 'Currency', category: 'financial' },
  cashAmount: { label: 'Cash Amount', category: 'financial' },
  cashPaymentTerms: { label: 'Cash Payment Terms', category: 'financial' },
  budgetRange: { label: 'Budget Range', category: 'financial' },
  offeredService: { label: 'Offered Service', category: 'commercial' },
  requestedService: { label: 'Requested Service', category: 'commercial' },
  equivalenceEstimate: { label: 'Equivalence Estimate', category: 'commercial' },
  barterOffer: { label: 'Barter Offer', category: 'commercial' },
  barterPreferences: { label: 'Barter Preferences', category: 'commercial' },
  profitSplit: { label: 'Profit Split', category: 'financial' },
  calculationBasis: { label: 'Calculation Basis', category: 'financial' },
  profitDistribution: { label: 'Profit Distribution', category: 'financial' },
  revenueModel: { label: 'Revenue Model', category: 'financial' },
  equityPercentage: { label: 'Equity Percentage', category: 'financial' },
  ownershipTerms: { label: 'Ownership Terms', category: 'legal' },
  equitySplit: { label: 'Equity Split', category: 'financial' },
  equityStructure: { label: 'Equity Structure', category: 'financial' },
  vestingTerms: { label: 'Vesting Terms', category: 'legal' },
  cashComponent: { label: 'Cash Component', category: 'financial' },
  nonCashComponent: { label: 'Non-Cash Component', category: 'commercial' },
  barterComponent: { label: 'Barter Component', category: 'commercial' },
  equityComponent: { label: 'Equity Component', category: 'financial' },
  profitComponent: { label: 'Profit Component', category: 'financial' },
}

function fieldMeta(id: string): ValueExchangeReadinessField {
  const meta = EXCHANGE_FIELD_META[id]
  return {
    id,
    label: meta?.label ?? id,
    category: meta?.category ?? 'commercial',
    priority: 'required',
  }
}

/** Metadata for value-exchange readiness fields per mode (explainability only). */
export function getValueExchangeReadinessFields(
  mode: ExchangeMode,
): readonly ValueExchangeReadinessField[] {
  const group = VALUE_EXCHANGE_FIELD_GROUPS[mode]
  const required = group.requiredFields.map((id) => ({ ...fieldMeta(id), priority: 'required' as const }))
  const optional = group.optionalFields.map((id) => ({
    ...fieldMeta(id),
    priority: 'recommended' as const,
  }))
  return [...required, ...optional]
}
