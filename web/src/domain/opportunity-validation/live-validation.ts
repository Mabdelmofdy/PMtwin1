import type { Opportunity } from '@/types/domain.ts'
import type {
  DuplicateDraftCandidate,
  ValidationIssue,
  ValidationRuleGroup,
} from '@pm-twin/validation'
import {
  liveStateForField,
  messagesForField,
  runBusinessValidation,
  runDraftValidation,
  runFieldValidation,
  validateGroups,
} from '@/domain/opportunity-validation/index.ts'

export type FieldValidationView = {
  readonly state: 'valid' | 'warning' | 'error'
  readonly messages: readonly string[]
}

/**
 * Live validation for wizard fields. Never exposes internal VAL_* codes.
 */
export function evaluateLiveOpportunityValidation(
  opportunity: Partial<Opportunity>,
  options?: {
    readonly groups?: readonly ValidationRuleGroup[]
    readonly existingDrafts?: readonly DuplicateDraftCandidate[]
  },
): {
  readonly issues: readonly ValidationIssue[]
  readonly field: (path: string) => FieldValidationView
  readonly duplicateDraftWarning: ValidationIssue | undefined
  readonly blocked: boolean
} {
  const fieldResult = runFieldValidation(opportunity, { operationScope: 'draft' }, {
    scopes: ['draft'],
  })
  const businessResult = options?.groups
    ? validateGroups(opportunity, options.groups, 'draft', {
        existingDrafts: options.existingDrafts,
      })
    : runBusinessValidation(
        opportunity,
        { operationScope: 'draft', existingDrafts: options?.existingDrafts },
        { scopes: ['draft'] },
      )

  const issues = [...fieldResult.issues, ...businessResult.issues]
  const draft = runDraftValidation(opportunity, {
    existingDrafts: options?.existingDrafts,
  })

  return {
    issues,
    field: (path: string) => ({
      state: liveStateForField(issues, path),
      messages: messagesForField(issues, path),
    }),
    duplicateDraftWarning: issues.find((i) => i.code === 'VAL_DUP_SIMILAR_DRAFT'),
    blocked: draft.blocked,
  }
}
