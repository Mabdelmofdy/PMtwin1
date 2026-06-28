import type {
  WorkflowContext,
  WorkflowRule,
  WorkflowRuleResult,
} from '@/domain/workflow/types.ts'

function allow(): WorkflowRuleResult {
  return { allowed: true }
}

function deny(reason: string): WorkflowRuleResult {
  return { allowed: false, reason }
}

function isOwnerOrAdmin(context: WorkflowContext): boolean {
  const role = (context.userRole ?? '').toLowerCase()
  return role === 'company_owner' || role === 'admin'
}

export const dealRules: WorkflowRule[] = [
  (_from, to, context) => {
    if (to === 'executing' && !isOwnerOrAdmin(context)) {
      return deny('Activating a deal typically requires owner or admin role')
    }
    return allow()
  },
  (from, to) => {
    if (to === 'completed' && from === 'draft') {
      return deny('Deal cannot complete directly from draft')
    }
    return allow()
  },
]

export function evaluateDealRules(
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of dealRules) {
    const result = rule(from, to, context)
    if (!result.allowed) return result
  }
  return allow()
}
