import type {
  WorkflowContext,
  WorkflowEntityType,
  WorkflowRuleResult,
} from '@/domain/workflow/types.ts'
import { evaluateApplicationRules } from '@/domain/workflow/rules/application.rules.ts'
import { evaluateContractRules } from '@/domain/workflow/rules/contract.rules.ts'
import { evaluateDealRules } from '@/domain/workflow/rules/deal.rules.ts'
import { evaluateMatchRules } from '@/domain/workflow/rules/match.rules.ts'
import { evaluateNegotiationRules } from '@/domain/workflow/rules/negotiation.rules.ts'
import { evaluateOpportunityRules } from '@/domain/workflow/rules/opportunity.rules.ts'

export { applicationRules, evaluateApplicationRules } from '@/domain/workflow/rules/application.rules.ts'
export { opportunityRules, evaluateOpportunityRules } from '@/domain/workflow/rules/opportunity.rules.ts'
export { matchRules, evaluateMatchRules } from '@/domain/workflow/rules/match.rules.ts'
export { negotiationRules, evaluateNegotiationRules } from '@/domain/workflow/rules/negotiation.rules.ts'
export { dealRules, evaluateDealRules } from '@/domain/workflow/rules/deal.rules.ts'
export { contractRules, evaluateContractRules } from '@/domain/workflow/rules/contract.rules.ts'

const EVALUATORS: Record<
  WorkflowEntityType,
  (from: string, to: string, context: WorkflowContext) => WorkflowRuleResult
> = {
  application: evaluateApplicationRules,
  opportunity: evaluateOpportunityRules,
  match: evaluateMatchRules,
  negotiation: evaluateNegotiationRules,
  deal: evaluateDealRules,
  contract: evaluateContractRules,
}

export function evaluateEntityRules(
  entityType: WorkflowEntityType,
  from: string,
  to: string,
  context: WorkflowContext = {},
): WorkflowRuleResult {
  const evaluate = EVALUATORS[entityType]
  if (!evaluate) return { allowed: true }
  return evaluate(from, to, context)
}
