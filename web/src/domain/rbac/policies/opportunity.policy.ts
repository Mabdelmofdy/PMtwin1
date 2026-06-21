/**
 * Opportunity entity RBAC policies — pure, context- and workflow-aware.
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
  isReadOnlyState,
} from '@/domain/rbac/policies/policy-utils.ts'

const READ_ONLY_STATES = ['completed', 'cancelled'] as const
const POLICY_ID = 'opportunity.policy'

export function evaluateOpportunityPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'opportunity') return null

  if (isAdmin(context)) {
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'opportunity.create':
      if (isCompanyOwner(context)) {
        return allow(`${POLICY_ID}:owner-create`)
      }
      return deny(
        `${POLICY_ID}:create-denied`,
        'Only company owners can create opportunities',
      )

    case 'opportunity.publish': {
      if (!isCompanyOwner(context)) {
        return deny(
          `${POLICY_ID}:publish-denied`,
          'Only company owners can publish opportunities',
        )
      }
      const state = context.workflowState
      if (state !== 'draft' && state !== '') {
        return deny(
          `${POLICY_ID}:publish-state`,
          `Publishing requires draft state (current: ${state})`,
          true,
        )
      }
      return allow(`${POLICY_ID}:owner-publish`, true)
    }

    case 'opportunity.cancel': {
      if (!isCompanyOwner(context)) {
        return deny(
          `${POLICY_ID}:cancel-denied`,
          'Only company owners can cancel opportunities',
        )
      }
      if (isReadOnlyState(context, READ_ONLY_STATES)) {
        return deny(
          `${POLICY_ID}:cancel-terminal`,
          'Cannot cancel a completed or cancelled opportunity',
          true,
        )
      }
      return allow(`${POLICY_ID}:owner-cancel`, true)
    }

    case 'opportunity.view':
      return allow(`${POLICY_ID}:view-all`)

    default:
      return deny(
        `${POLICY_ID}:unknown-action`,
        `Action "${action}" is not permitted on opportunities`,
      )
  }
}
