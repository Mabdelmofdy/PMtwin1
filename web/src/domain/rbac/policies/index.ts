/**
 * Entity policy registry — routes actions to per-entity evaluators.
 */

import type {
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
  RbacEntityType,
} from '@/domain/rbac/types.ts'
import { evaluateApplicationPolicy } from '@/domain/rbac/policies/application.policy.ts'
import { evaluateContractPolicy } from '@/domain/rbac/policies/contract.policy.ts'
import { evaluateDealPolicy } from '@/domain/rbac/policies/deal.policy.ts'
import { evaluateMatchPolicy } from '@/domain/rbac/policies/match.policy.ts'
import { evaluateNegotiationPolicy } from '@/domain/rbac/policies/negotiation.policy.ts'
import { evaluateOpportunityPolicy } from '@/domain/rbac/policies/opportunity.policy.ts'

export type EntityPolicyEvaluator = (
  action: PermissionAction,
  context: PermissionContext,
) => PolicyEvaluation | null

const ENTITY_POLICIES: Record<RbacEntityType, EntityPolicyEvaluator> = {
  opportunity: evaluateOpportunityPolicy,
  application: evaluateApplicationPolicy,
  match: evaluateMatchPolicy,
  negotiation: evaluateNegotiationPolicy,
  deal: evaluateDealPolicy,
  contract: evaluateContractPolicy,
}

export function evaluateEntityPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  const evaluator = ENTITY_POLICIES[context.entityType]
  if (!evaluator) return null
  return evaluator(action, context)
}

export {
  evaluateApplicationPolicy,
  evaluateContractPolicy,
  evaluateDealPolicy,
  evaluateMatchPolicy,
  evaluateNegotiationPolicy,
  evaluateOpportunityPolicy,
}
