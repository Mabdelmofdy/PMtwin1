import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { hasText } from '../validators/primitives.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

function fieldIssue(
  code: string,
  fieldPaths: readonly string[],
  severity: ValidationIssue['severity'] = 'error',
): ValidationIssue {
  return {
    code,
    source: 'field',
    severity,
    scope: DRAFT_UPDATE_PUBLISH,
    fieldPaths,
    message: messageForCode(code),
    layer: 'field',
    group: 'field',
  }
}

export const fieldTitleRequired: ValidationRule = {
  id: 'field-title-required',
  code: VAL_CODES.FIELD_TITLE_REQUIRED,
  layer: 'field',
  source: 'field',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['title'],
  group: 'field',
  execute(input) {
    if (hasText(input.title)) return null
    return fieldIssue(VAL_CODES.FIELD_TITLE_REQUIRED, ['title'])
  },
}

export const fieldTitleLength: ValidationRule = {
  id: 'field-title-length',
  code: VAL_CODES.FIELD_TITLE_TOO_LONG,
  layer: 'field',
  source: 'field',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['title'],
  group: 'field',
  execute(input, _ctx, config) {
    if (!hasText(input.title)) return null
    if (String(input.title).length <= config.titleMaxLength) return null
    return fieldIssue(VAL_CODES.FIELD_TITLE_TOO_LONG, ['title'])
  },
}

export const fieldDescriptionLength: ValidationRule = {
  id: 'field-description-length',
  code: VAL_CODES.FIELD_DESCRIPTION_TOO_LONG,
  layer: 'field',
  source: 'field',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['description'],
  group: 'field',
  execute(input, _ctx, config) {
    if (!hasText(input.description)) return null
    if (String(input.description).length <= config.descriptionMaxLength) return null
    return fieldIssue(VAL_CODES.FIELD_DESCRIPTION_TOO_LONG, ['description'])
  },
}

export const FIELD_RULES: readonly ValidationRule[] = [
  fieldTitleRequired,
  fieldTitleLength,
  fieldDescriptionLength,
]
