import type {
  ValidationContext,
  ValidationIssue,
  ValidationResult,
  ValidationRule,
  ValidationScope,
  RunRulesOptions,
  OpportunityValidationInput,
} from '../types.ts'
import { mergeValidationConfig } from '../config/defaults.ts'

function normalizeIssues(
  result: readonly ValidationIssue[] | ValidationIssue | null,
): ValidationIssue[] {
  if (result == null) return []
  if (typeof result === 'object' && 'length' in result && !('code' in result)) {
    return [...(result as readonly ValidationIssue[])]
  }
  return [result as ValidationIssue]
}

export function runRules(
  rules: readonly ValidationRule[],
  input: OpportunityValidationInput,
  context: ValidationContext = {},
  options: RunRulesOptions = {},
): ValidationResult {
  const config = mergeValidationConfig(context.config)
  const scopes = options.scopes
  const groups = options.groups

  const selected = rules.filter((rule) => {
    if (scopes && scopes.length > 0) {
      if (!rule.scope.some((s) => scopes.includes(s))) return false
    }
    if (groups && groups.length > 0) {
      if (!groups.includes(rule.group)) return false
    }
    return true
  })

  const issues: ValidationIssue[] = []
  for (const rule of selected) {
    const produced = rule.execute(input, context, config)
    issues.push(...normalizeIssues(produced))
  }

  return {
    valid: issues.every(
      (i) => i.severity === 'valid' || i.severity === 'warning',
    ),
    issues,
  }
}

export function shouldBlockOperation(
  issues: readonly ValidationIssue[],
  operationScope: ValidationScope,
): boolean {
  for (const issue of issues) {
    const inScope = issue.scope.includes(operationScope)
    if (!inScope) continue

    if (issue.severity === 'blocker') return true
    if (issue.severity === 'error') return true
    if (issue.severity === 'warning' && issue.blocksPublish && operationScope === 'publish') {
      return true
    }
  }
  return false
}

export function issuesForOperation(
  issues: readonly ValidationIssue[],
  operationScope: ValidationScope,
): readonly ValidationIssue[] {
  return issues.filter((i) => i.scope.includes(operationScope))
}

export function humanMessages(
  issues: readonly ValidationIssue[],
): readonly string[] {
  return issues.map((i) => i.message)
}

export function issue(
  partial: Omit<ValidationIssue, 'message'> & { message?: string },
  message: string,
): ValidationIssue {
  return {
    ...partial,
    message: partial.message ?? message,
  }
}
