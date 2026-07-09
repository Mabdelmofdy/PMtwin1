import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { normalizeIntent, toNumber } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function capacityIssue(
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
    group: 'capacity',
  }
}

export const capacityNegative: ValidationRule = {
  id: 'capacity-negative',
  code: VAL_CODES.CAPACITY_NEGATIVE,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['capacity'],
  group: 'capacity',
  execute(input) {
    if (!input.capacity) return null
    const required = toNumber(input.capacity.required)
    const available = toNumber(input.capacity.available)
    if ((required !== null && required < 0) || (available !== null && available < 0)) {
      return capacityIssue(VAL_CODES.CAPACITY_NEGATIVE, ['capacity'])
    }
    return null
  },
}

export const capacityRequiredInvalid: ValidationRule = {
  id: 'capacity-required-invalid',
  code: VAL_CODES.CAPACITY_REQUIRED_INVALID,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['capacity.required'],
  group: 'capacity',
  execute(input) {
    const intent = normalizeIntent(input.intent)
    if (intent !== 'need' && intent !== 'hybrid') return null
    if (!input.capacity || input.capacity.required === undefined) return null
    const required = toNumber(input.capacity.required)
    if (required !== null && required > 0) return null
    return capacityIssue(VAL_CODES.CAPACITY_REQUIRED_INVALID, ['capacity.required'])
  },
}

export const capacityAvailableInvalid: ValidationRule = {
  id: 'capacity-available-invalid',
  code: VAL_CODES.CAPACITY_AVAILABLE_INVALID,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['capacity.available'],
  group: 'capacity',
  execute(input) {
    const intent = normalizeIntent(input.intent)
    if (intent !== 'offer' && intent !== 'hybrid') return null
    if (!input.capacity || input.capacity.available === undefined) return null
    const available = toNumber(input.capacity.available)
    if (available !== null && available > 0) return null
    return capacityIssue(VAL_CODES.CAPACITY_AVAILABLE_INVALID, [
      'capacity.available',
    ])
  },
}

export const CAPACITY_RULES: readonly ValidationRule[] = [
  capacityNegative,
  capacityRequiredInvalid,
  capacityAvailableInvalid,
]
