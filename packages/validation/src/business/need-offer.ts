import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import {
  normalizeExchangeMode,
  normalizeIntent,
  toNumber,
} from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function intentIssue(
  code: string,
  fieldPaths: readonly string[],
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity: 'error',
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'needOffer',
  }
}

export const needHasAvailableCapacity: ValidationRule = {
  id: 'need-has-available-capacity',
  code: VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['capacity.available'],
  group: 'needOffer',
  execute(input) {
    if (normalizeIntent(input.intent) !== 'need') return null
    if (input.capacity?.available === undefined) return null
    return intentIssue(VAL_CODES.INTENT_NEED_HAS_AVAILABLE_CAPACITY, [
      'capacity.available',
    ])
  },
}

export const needHasPricingTable: ValidationRule = {
  id: 'need-has-pricing-table',
  code: VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.pricingTable'],
  group: 'needOffer',
  execute(input) {
    if (normalizeIntent(input.intent) !== 'need') return null
    if (!input.exchangeData || !('pricingTable' in input.exchangeData)) return null
    if (input.exchangeData.pricingTable == null) return null
    return intentIssue(VAL_CODES.INTENT_NEED_HAS_PRICING_TABLE, [
      'exchangeData.pricingTable',
    ])
  },
}

export const offerHasRequiredCapacity: ValidationRule = {
  id: 'offer-has-required-capacity',
  code: VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['capacity.required'],
  group: 'needOffer',
  execute(input) {
    if (normalizeIntent(input.intent) !== 'offer') return null
    if (input.capacity?.required === undefined) return null
    return intentIssue(VAL_CODES.INTENT_OFFER_HAS_REQUIRED_CAPACITY, [
      'capacity.required',
    ])
  },
}

export const offerHasMandatoryDeadline: ValidationRule = {
  id: 'offer-has-mandatory-deadline',
  code: VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['attributes.mandatoryDeadline'],
  group: 'needOffer',
  execute(input) {
    if (normalizeIntent(input.intent) !== 'offer') return null
    if (!input.attributes || !('mandatoryDeadline' in input.attributes)) return null
    if (input.attributes.mandatoryDeadline == null) return null
    return intentIssue(VAL_CODES.INTENT_OFFER_HAS_MANDATORY_DEADLINE, [
      'attributes.mandatoryDeadline',
    ])
  },
}

export const offerRequiredBudgetNonCash: ValidationRule = {
  id: 'offer-required-budget-non-cash',
  code: VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['budget'],
  group: 'needOffer',
  execute(input) {
    if (normalizeIntent(input.intent) !== 'offer') return null
    const mode = normalizeExchangeMode(input.exchangeMode)
    if (!mode || mode === 'cash') return null
    const requiredBudgetFlag = input.attributes?.requiredBudget
    const budget = toNumber(input.budget)
    if (requiredBudgetFlag === true || (budget !== null && budget > 0 && requiredBudgetFlag !== false)) {
      if (requiredBudgetFlag === true) {
        return intentIssue(VAL_CODES.INTENT_OFFER_REQUIRED_BUDGET_NON_CASH, ['budget'])
      }
    }
    return null
  },
}

export const NEED_OFFER_RULES: readonly ValidationRule[] = [
  needHasAvailableCapacity,
  needHasPricingTable,
  offerHasRequiredCapacity,
  offerHasMandatoryDeadline,
  offerRequiredBudgetNonCash,
]
