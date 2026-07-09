import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { getNestedNumber, toNumber } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function commercialIssue(
  code: string,
  fieldPaths: readonly string[],
): ValidationIssue {
  return {
    code,
    source: 'commercial',
    severity: 'error',
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'commercial',
  }
}

export const commercialRetentionRange: ValidationRule = {
  id: 'commercial-retention-range',
  code: VAL_CODES.COMMERCIAL_RETENTION_RANGE,
  layer: 'business',
  source: 'commercial',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.retention'],
  group: 'commercial',
  execute(input, _ctx, config) {
    const retention = getNestedNumber(input.exchangeData, [
      'retention',
      'retentionPercent',
    ])
    if (retention === null) return null
    const max = Math.min(config.retentionMax, config.maxRetentionPercent)
    if (retention >= 0 && retention <= max) return null
    return commercialIssue(VAL_CODES.COMMERCIAL_RETENTION_RANGE, [
      'exchangeData.retention',
    ])
  },
}

export const commercialProfitShareRange: ValidationRule = {
  id: 'commercial-profit-share-range',
  code: VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE,
  layer: 'business',
  source: 'commercial',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.profitSplit'],
  group: 'commercial',
  execute(input, _ctx, config) {
    const value =
      getNestedNumber(input.exchangeData, [
        'profitSplit',
        'profitSharePercentage',
        'profitPercent',
      ]) ??
      getNestedNumber(input.collaborationAttributes, [
        'profitSplit',
        'profitSharePercentage',
      ])
    if (value === null) return null
    if (value >= config.profitShareMin && value <= config.profitShareMax) {
      return null
    }
    return commercialIssue(VAL_CODES.COMMERCIAL_PROFIT_SHARE_RANGE, [
      'exchangeData.profitSplit',
    ])
  },
}

export const commercialVatRange: ValidationRule = {
  id: 'commercial-vat-range',
  code: VAL_CODES.COMMERCIAL_VAT_RANGE,
  layer: 'business',
  source: 'commercial',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.vat'],
  group: 'commercial',
  execute(input, _ctx, config) {
    const vat = getNestedNumber(input.exchangeData, ['vat', 'vatPercent', 'vatRate'])
    if (vat === null) return null
    const max = Math.min(config.vatMax, config.maxVatPercent)
    if (vat >= 0 && vat <= max) return null
    return commercialIssue(VAL_CODES.COMMERCIAL_VAT_RANGE, ['exchangeData.vat'])
  },
}

export const commercialAdvanceExceedsBudget: ValidationRule = {
  id: 'commercial-advance-exceeds-budget',
  code: VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET,
  layer: 'business',
  source: 'commercial',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.advancePayment'],
  group: 'commercial',
  execute(input, _ctx, config) {
    const advance = getNestedNumber(input.exchangeData, [
      'advancePayment',
      'advance',
    ])
    if (advance === null) return null
    const budget =
      toNumber(input.budget) ??
      getNestedNumber(input.exchangeData, ['budget', 'cashAmount'])
    if (budget === null) return null
    const maxByPercent = (budget * config.advancePaymentMaxPercent) / 100
    if (advance <= budget && advance <= maxByPercent) return null
    return commercialIssue(VAL_CODES.COMMERCIAL_ADVANCE_EXCEEDS_BUDGET, [
      'exchangeData.advancePayment',
    ])
  },
}

export const commercialMinMaxContract: ValidationRule = {
  id: 'commercial-min-max-contract',
  code: VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT,
  layer: 'business',
  source: 'commercial',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['exchangeData.minContractValue', 'exchangeData.maxContractValue'],
  group: 'commercial',
  execute(input) {
    const min = getNestedNumber(input.exchangeData, [
      'minContractValue',
      'minimumContractValue',
    ])
    const max = getNestedNumber(input.exchangeData, [
      'maxContractValue',
      'maximumContractValue',
    ])
    if (min === null || max === null) return null
    if (min <= max) return null
    return commercialIssue(VAL_CODES.COMMERCIAL_MIN_MAX_CONTRACT, [
      'exchangeData.minContractValue',
    ])
  },
}

export const COMMERCIAL_RULES: readonly ValidationRule[] = [
  commercialRetentionRange,
  commercialProfitShareRange,
  commercialVatRange,
  commercialAdvanceExceedsBudget,
  commercialMinMaxContract,
]
