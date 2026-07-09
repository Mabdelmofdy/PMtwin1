import type { ValidationIssue, ValidationRule } from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'

const DRAFT_UPDATE_PUBLISH = ['draft', 'update', 'publish'] as const

export const taxonomyInvalid: ValidationRule = {
  id: 'taxonomy-invalid',
  code: VAL_CODES.TAXONOMY_INVALID,
  layer: 'business',
  source: 'taxonomy',
  severity: 'error',
  scope: DRAFT_UPDATE_PUBLISH,
  fieldPaths: ['mainCollaborationModel', 'subModelType', 'exchangeMode'],
  group: 'exchange',
  execute(_input, context) {
    if (context.taxonomyValid === false) {
      const detail = context.taxonomyErrors?.[0]
      const issue: ValidationIssue = {
        code: VAL_CODES.TAXONOMY_INVALID,
        source: 'taxonomy',
        severity: 'error',
        scope: DRAFT_UPDATE_PUBLISH,
        fieldPaths: ['mainCollaborationModel', 'subModelType', 'exchangeMode'],
        message: detail
          ? messageForCode(VAL_CODES.TAXONOMY_INVALID)
          : messageForCode(VAL_CODES.TAXONOMY_INVALID),
        layer: 'business',
        group: 'exchange',
      }
      return issue
    }
    return null
  },
}

export const TAXONOMY_RULES: readonly ValidationRule[] = [taxonomyInvalid]
