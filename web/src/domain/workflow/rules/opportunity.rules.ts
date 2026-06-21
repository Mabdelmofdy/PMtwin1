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

function isAdmin(context: WorkflowContext): boolean {
  return (context.userRole ?? '').toLowerCase() === 'admin'
}

export const opportunityRules: WorkflowRule[] = [
  (_from, to, context) => {
    if (to === 'published' && !isOwnerOrAdmin(context)) {
      return deny('Publishing typically requires owner or admin role')
    }
    return allow()
  },
  (_from, to, context) => {
    if (to === 'cancelled' && !isOwnerOrAdmin(context) && !isAdmin(context)) {
      return deny('Cancellation may require owner or admin role')
    }
    return allow()
  },
]

export function evaluateOpportunityRules(
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of opportunityRules) {
    const result = rule(from, to, context)
    if (!result.allowed) return result
  }
  return allow()
}
