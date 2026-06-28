import type {
  WorkflowContext,
  WorkflowRule,
  WorkflowRuleResult,
} from '@/domain/workflow/types.ts'

function allow(): WorkflowRuleResult {
  return { allowed: true }
}

export const matchRules: WorkflowRule[] = []

export function evaluateMatchRules(
  _from: string,
  _to: string,
  _context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of matchRules) {
    const result = rule(_from, _to, _context)
    if (!result.allowed) return result
  }
  return allow()
}
