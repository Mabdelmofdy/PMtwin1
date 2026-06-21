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

export const contractRules: WorkflowRule[] = [
  (from, to, context) => {
    if (to !== 'active' || from === 'active') return allow()
    const signed = context.entitySnapshot?.signedAt
    if (!signed && !context.metadata?.allPartiesSigned) {
      return deny('Activation typically requires all parties signed (advisory)')
    }
    return allow()
  },
  (_from, to, context) => {
    if (to === 'terminated' && !isOwnerOrAdmin(context) && !isAdmin(context)) {
      return deny('Termination may require owner or admin role')
    }
    return allow()
  },
]

export function evaluateContractRules(
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of contractRules) {
    const result = rule(from, to, context)
    if (!result.allowed) return result
  }
  return allow()
}
