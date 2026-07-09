import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import {
  hoursBetween,
  parseIsoDate,
  todayIso,
  toNumber,
} from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function dateIssue(
  code: string,
  fieldPaths: readonly string[],
  severity: ValidationIssue['severity'],
): ValidationIssue {
  return {
    code,
    source: 'business',
    severity,
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'business',
    group: 'dates',
  }
}

export const dateStartInPast: ValidationRule = {
  id: 'date-start-in-past',
  code: VAL_CODES.DATE_START_IN_PAST,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['startDate'],
  group: 'dates',
  execute(input, context) {
    if (context.isExistingDraft) return null
    const start = parseIsoDate(input.startDate)
    if (!start) return null
    const today = parseIsoDate(context.today ?? todayIso(context.now))
    if (!today) return null
    if (start.getTime() >= today.getTime()) return null
    return dateIssue(VAL_CODES.DATE_START_IN_PAST, ['startDate'], 'error')
  },
}

export const dateEndBeforeStart: ValidationRule = {
  id: 'date-end-before-start',
  code: VAL_CODES.DATE_END_BEFORE_START,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['endDate', 'startDate'],
  group: 'dates',
  execute(input) {
    const start = parseIsoDate(input.startDate)
    const end = parseIsoDate(input.endDate)
    if (!start || !end) return null
    if (end.getTime() > start.getTime()) return null
    return dateIssue(VAL_CODES.DATE_END_BEFORE_START, ['endDate'], 'error')
  },
}

export const dateDurationInvalid: ValidationRule = {
  id: 'date-duration-invalid',
  code: VAL_CODES.DATE_DURATION_INVALID,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['duration'],
  group: 'dates',
  execute(input) {
    if (input.duration === undefined || input.duration === '') return null
    const n = toNumber(input.duration)
    if (n === null) return null
    if (n > 0) return null
    return dateIssue(VAL_CODES.DATE_DURATION_INVALID, ['duration'], 'error')
  },
}

export const dateDeliveryAfterEnd: ValidationRule = {
  id: 'date-delivery-after-end',
  code: VAL_CODES.DATE_DELIVERY_AFTER_END,
  layer: 'business',
  source: 'business',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['deliveryDeadline', 'endDate'],
  group: 'dates',
  execute(input) {
    const delivery = parseIsoDate(input.deliveryDeadline)
    const end = parseIsoDate(input.endDate)
    if (!delivery || !end) return null
    if (delivery.getTime() <= end.getTime()) return null
    return dateIssue(VAL_CODES.DATE_DELIVERY_AFTER_END, ['deliveryDeadline'], 'error')
  },
}

export const dateStartSoon: ValidationRule = {
  id: 'date-start-soon',
  code: VAL_CODES.DATE_START_SOON,
  layer: 'business',
  source: 'business',
  severity: 'warning',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['startDate'],
  group: 'dates',
  execute(input, context, config) {
    const start = parseIsoDate(input.startDate)
    if (!start) return null
    const now = context.now ?? new Date()
    const hours = hoursBetween(now, start)
    if (hours < 0 || hours >= config.warningStartWithinHours) return null
    return dateIssue(VAL_CODES.DATE_START_SOON, ['startDate'], 'warning')
  },
}

export const DATE_RULES: readonly ValidationRule[] = [
  dateStartInPast,
  dateEndBeforeStart,
  dateDurationInvalid,
  dateDeliveryAfterEnd,
  dateStartSoon,
]
