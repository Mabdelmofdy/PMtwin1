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

export const applicationRules: WorkflowRule[] = [
  (from, to, context) => {
    if (from === 'submitted' && to === 'accepted') {
      if (!isOwnerOrAdmin(context)) {
        return deny('Only opportunity owner or admin may accept from submitted')
      }
    }
    return allow()
  },
  (from, to) => {
    if (to === 'accepted' && !['negotiating', 'shortlisted'].includes(from)) {
      return deny('Acceptance typically follows negotiation or shortlist')
    }
    return allow()
  },
  (from, to, context) => {
    if (to !== 'withdrawn') return allow()
    const role = (context.userRole ?? '').toLowerCase()
    if (role === 'admin') return allow()
    if (context.userId && context.entitySnapshot?.applicantId === context.userId) {
      return allow()
    }
    if (from === 'submitted' || from === 'reviewing') return allow()
    return deny('Withdrawal may require applicant or admin role')
  },
]

export function evaluateApplicationRules(
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of applicationRules) {
    const result = rule(from, to, context)
    if (!result.allowed) return result
  }
  return allow()
}
