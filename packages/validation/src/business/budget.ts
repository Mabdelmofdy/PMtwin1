import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import {
  getNestedNumber,
  getNestedString,
  hasText,
  normalizeExchangeMode,
  toNumber,
} from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const
const PUBLISH_ONLY = ['publish'] as const

function budgetIssue(
  code: string,
  fieldPaths: readonly string[],
  scope: readonly ('draft' | 'update' | 'publish')[] = DRAFT_UPDATE_PUBLISH,
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity: 'error',
    scope,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'budget',
  }
}

function resolveBudget(input: {
  budget?: number
  exchangeData?: Readonly<Record<string, unknown>>
  collaborationAttributes?: Readonly<Record<string, unknown>>
}): number | null {
  if (input.budget !== undefined) return toNumber(input.budget)
  const direct = getNestedNumber(input.exchangeData, [
    'budget',
    'cashAmount',
    'cashComponent',
  ])
  if (direct !== null) return direct
  const range = input.exchangeData?.budgetRange
  if (range && typeof range === 'object') {
    return getNestedNumber(range as Record<string, unknown>, ['min', 'max'])
  }
  for (const source of [input.exchangeData, input.collaborationAttributes]) {
    const structure = source?.commercialStructure
    if (!structure || typeof structure !== 'object') continue
    const components = (structure as Record<string, unknown>).components
    if (!Array.isArray(components)) continue
    const cash = components.find(
      (component) =>
        component !== null &&
        typeof component === 'object' &&
        (component as Record<string, unknown>).type === 'cash' &&
        (component as Record<string, unknown>).enabled !== false,
    ) as Record<string, unknown> | undefined
    if (!cash) continue
    const amount = getNestedNumber(cash, [
      'fixedAmount',
      'maximumAmount',
      'minimumAmount',
    ])
    if (amount !== null) return amount
  }
  return null
}

export const budgetCashRequired: ValidationRule = {
  id: 'budget-cash-required',
  code: VAL_CODES.BUDGET_CASH_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: PUBLISH_ONLY,
  fieldPaths: ['budget', 'exchangeData.budget'],
  group: 'budget',
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (mode !== 'cash') return null
    const budget = resolveBudget(input)
    if (budget !== null && budget > 0) return null
    return budgetIssue(VAL_CODES.BUDGET_CASH_REQUIRED, ['budget'], PUBLISH_ONLY)
  },
}

export const budgetBelowMinimum: ValidationRule = {
  id: 'budget-below-minimum',
  code: VAL_CODES.BUDGET_BELOW_MINIMUM,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['budget'],
  group: 'budget',
  execute(input, _ctx, config) {
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (mode !== 'cash' && mode !== 'hybrid') return null
    const budget = resolveBudget(input)
    if (budget === null) return null
    if (budget >= config.minimumBudget) return null
    return budgetIssue(VAL_CODES.BUDGET_BELOW_MINIMUM, ['budget'])
  },
}

export const budgetProfitFieldsRequired: ValidationRule = {
  id: 'budget-profit-fields',
  code: VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: PUBLISH_ONLY,
  fieldPaths: ['exchangeData.profitSplit', 'exchangeData.calculationBasis'],
  group: 'budget',
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (mode !== 'profit_sharing') return null
    const data = input.exchangeData
    const attrs = input.collaborationAttributes
    const profit =
      getNestedNumber(data, ['profitSplit', 'profitSharePercentage', 'profitPercent']) ??
      getNestedNumber(attrs, ['profitSplit', 'profitSharePercentage', 'profitPercent'])
    const basis =
      getNestedString(data, ['calculationBasis', 'revenueBasis', 'revenueModel']) ??
      getNestedString(attrs, ['calculationBasis', 'revenueBasis', 'revenueModel'])
    const cycle =
      getNestedString(data, ['settlementCycle', 'profitDistribution']) ??
      getNestedString(attrs, ['settlementCycle', 'profitDistribution'])
    if (profit !== null && hasText(basis) && hasText(cycle)) return null
    return budgetIssue(
      VAL_CODES.BUDGET_PROFIT_FIELDS_REQUIRED,
      ['exchangeData.profitSplit'],
      PUBLISH_ONLY,
    )
  },
}

export const budgetEquityFieldsRequired: ValidationRule = {
  id: 'budget-equity-fields',
  code: VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: PUBLISH_ONLY,
  fieldPaths: ['exchangeData.equityPercentage'],
  group: 'budget',
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (mode !== 'equity') return null
    const data = input.exchangeData
    const attrs = input.collaborationAttributes
    const equity =
      getNestedNumber(data, ['equityPercentage', 'equitySplit']) ??
      getNestedNumber(attrs, ['equityPercentage', 'equitySplit'])
    const capital =
      getNestedString(data, ['capitalContribution', 'ownershipTerms']) ??
      getNestedString(attrs, ['capitalContribution', 'ownershipTerms'])
    const governance =
      getNestedString(data, ['governanceRights', 'equityStructure']) ??
      getNestedString(attrs, ['governanceRights', 'equityStructure'])
    if (equity !== null && hasText(capital) && hasText(governance)) return null
    return budgetIssue(
      VAL_CODES.BUDGET_EQUITY_FIELDS_REQUIRED,
      ['exchangeData.equityPercentage'],
      PUBLISH_ONLY,
    )
  },
}

export const budgetHybridComponents: ValidationRule = {
  id: 'budget-hybrid-components',
  code: VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData'],
  group: 'budget',
  execute(input) {
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (mode !== 'hybrid') return null
    const data = input.exchangeData ?? {}
    const cash = getNestedNumber(data, ['cashComponent', 'budget', 'cashAmount'])
    const nonCash =
      getNestedString(data, ['nonCashComponent']) ??
      getNestedNumber(data, ['equityComponent', 'profitComponent', 'barterComponent'])
    const hasEquity = getNestedNumber(data, ['equityComponent', 'equityPercentage']) !== null
    const hasProfit = getNestedNumber(data, ['profitComponent', 'profitSplit']) !== null
    const hasBarter = hasText(getNestedString(data, ['barterComponent', 'barterOffer']))
    if (cash !== null && cash > 0 && (nonCash !== null && nonCash !== undefined || hasEquity || hasProfit || hasBarter)) {
      return null
    }
    // If hybrid selected but no components filled yet, only error when any hybrid key present
    const touched = Object.keys(data).some((k) =>
      /cash|equity|profit|barter|hybrid|nonCash/i.test(k),
    )
    if (!touched) return null
    return budgetIssue(VAL_CODES.BUDGET_HYBRID_COMPONENT_REQUIRED, ['exchangeData'])
  },
}

export const BUDGET_RULES: readonly ValidationRule[] = [
  budgetCashRequired,
  budgetBelowMinimum,
  budgetProfitFieldsRequired,
  budgetEquityFieldsRequired,
  budgetHybridComponents,
]
