/**
 * Deal entity RBAC policies — pure, context- and workflow-aware.
 */

import type {
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
} from '@/domain/rbac/types.ts'
import {
  allow,
  deny,
  isAdmin,
  isCompanyOwner,
  isParticipant,
  isReadOnlyState,
} from '@/domain/rbac/policies/policy-utils.ts'

const EXECUTED_STATES = ['execution', 'completed', 'cancelled'] as const
const POLICY_ID = 'deal.policy'

export function evaluateDealPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'deal') return null

  if (isAdmin(context)) {
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'deal.create':
      if (isCompanyOwner(context)) {
        return allow(`${POLICY_ID}:owner-create`)
      }
      return deny(
        `${POLICY_ID}:create-denied`,
        'Only company owners can create deals',
      )

    case 'deal.execute': {
      if (!isCompanyOwner(context)) {
        return deny(
          `${POLICY_ID}:execute-denied`,
          'Only company owners can execute deals',
        )
      }
      const state = context.workflowState
      if (state !== 'active' && state !== 'draft') {
        return deny(
          `${POLICY_ID}:execute-state`,
          `Deal execution requires active or draft state (current: ${state})`,
          true,
        )
      }
      return allow(`${POLICY_ID}:owner-execute`, true)
    }

    case 'deal.view':
      if (isCompanyOwner(context) || isParticipant(context)) {
        return allow(`${POLICY_ID}:view-authorized`)
      }
      if (isReadOnlyState(context, EXECUTED_STATES)) {
        return allow(`${POLICY_ID}:view-post-execution`, true)
      }
      return deny(
        `${POLICY_ID}:view-denied`,
        'Deal view requires owner or participant role',
      )

    default:
      return deny(
        `${POLICY_ID}:unknown-action`,
        `Action "${action}" is not permitted on deals`,
      )
  }
}
