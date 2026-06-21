/**
 * Application entity RBAC policies — pure, context- and workflow-aware.
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
  isUser,
} from '@/domain/rbac/policies/policy-utils.ts'

const TERMINAL_STATES = ['accepted', 'rejected', 'withdrawn'] as const
const POLICY_ID = 'application.policy'

export function evaluateApplicationPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'application') return null

  if (isAdmin(context)) {
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'application.apply':
      if (!isUser(context)) {
        return deny(
          `${POLICY_ID}:apply-role`,
          'Only users can submit applications',
        )
      }
      return allow(`${POLICY_ID}:user-apply`)

    case 'application.accept':
    case 'application.reject': {
      if (!isCompanyOwner(context)) {
        return deny(
          `${POLICY_ID}:review-denied`,
          'Only company owners can accept or reject applications',
        )
      }
      if (isReadOnlyState(context, TERMINAL_STATES)) {
        return deny(
          `${POLICY_ID}:review-terminal`,
          'Application is in a terminal state',
          true,
        )
      }
      return allow(`${POLICY_ID}:owner-review`, true)
    }

    case 'application.view':
      return allow(`${POLICY_ID}:view-all`)

    default:
      return deny(
        `${POLICY_ID}:unknown-action`,
        `Action "${action}" is not permitted on applications`,
      )
  }
}
