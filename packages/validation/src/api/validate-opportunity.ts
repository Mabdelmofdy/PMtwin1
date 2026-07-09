import type {
  OpportunityValidationInput,
  RunRulesOptions,
  ValidationContext,
  ValidationResult,
  ValidationRule,
} from '../types.ts'
import { runRules } from '../engine/run-rules.ts'
import { FIELD_RULES } from '../field/rules.ts'
import { BUSINESS_RULES } from '../business/index.ts'

export const ALL_FIELD_RULES: readonly ValidationRule[] = FIELD_RULES
export const ALL_BUSINESS_RULES: readonly ValidationRule[] = BUSINESS_RULES

export function validateOpportunityFields(
  input: OpportunityValidationInput,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  const scopes = options.scopes ?? (context.operationScope
    ? [context.operationScope]
    : (['draft', 'update', 'publish'] as const))
  return runRules(FIELD_RULES, input, context, { ...options, scopes })
}

export function validateOpportunityBusiness(
  input: OpportunityValidationInput,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  const scopes = options.scopes ?? (context.operationScope
    ? [context.operationScope]
    : (['draft', 'update', 'publish'] as const))
  return runRules(BUSINESS_RULES, input, context, { ...options, scopes })
}

export function validateOpportunityDraft(
  input: OpportunityValidationInput,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  const ctx = { ...context, operationScope: 'draft' as const }
  const field = validateOpportunityFields(input, ctx, {
    ...options,
    scopes: ['draft'],
  })
  const business = validateOpportunityBusiness(input, ctx, {
    ...options,
    scopes: ['draft'],
  })
  return {
    valid: field.valid && business.valid,
    issues: [...field.issues, ...business.issues],
  }
}
