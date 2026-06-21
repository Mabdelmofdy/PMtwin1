/**
 * Contract entity RBAC policies — pure, context- and workflow-aware.
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
  isSigner,
} from '@/domain/rbac/policies/policy-utils.ts'

const ACTIVE_READ_ONLY_STATES = ['active', 'completed', 'terminated'] as const
const POLICY_ID = 'contract.policy'

export function evaluateContractPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'contract') return null

  if (isAdmin(context)) {
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'contract.sign': {
      const canSign =
        isSigner(context) || isCompanyOwner(context)
      if (!canSign) {
        return deny(
          `${POLICY_ID}:sign-denied`,
          'Only signers, company owner, or admin can sign contracts',
        )
      }
      const state = context.workflowState
      if (
        state === 'active' ||
        state === 'completed' ||
        state === 'terminated'
      ) {
        return deny(
          `${POLICY_ID}:sign-active`,
          'Contract is already active or closed',
          true,
        )
      }
      return allow(`${POLICY_ID}:authorized-sign`, true)
    }

    case 'contract.view':
      return allow(`${POLICY_ID}:view-all`)

    case 'contract.terminate':
      if (isReadOnlyState(context, ACTIVE_READ_ONLY_STATES)) {
        return deny(
          `${POLICY_ID}:terminate-readonly`,
          'Contract is read-only after activation (admin override available)',
          true,
        )
      }
      return deny(
        `${POLICY_ID}:terminate-denied`,
        'Contract termination requires admin role after activation',
      )

    default:
      return deny(
        `${POLICY_ID}:unknown-action`,
        `Action "${action}" is not permitted on contracts`,
      )
  }
}
