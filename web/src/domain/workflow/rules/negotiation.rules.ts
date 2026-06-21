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

export const negotiationRules: WorkflowRule[] = [
  (from, to, context) => {
    if (to === 'agreed' && from === 'countered') {
      const participants = context.entitySnapshot?.participants
      if (Array.isArray(participants) && participants.length > 2) {
        return deny('Multi-party agreement may require all participants (advisory)')
      }
    }
    return allow()
  },
  (_from, to, context) => {
    if (to === 'cancelled' && !context.userId) {
      return deny('Cancellation typically requires an authenticated participant')
    }
    return allow()
  },
]

export function evaluateNegotiationRules(
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  for (const rule of negotiationRules) {
    const result = rule(from, to, context)
    if (!result.allowed) return result
  }
  return allow()
}
