/**
 * Match entity RBAC policies — pure, context- and workflow-aware.
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
  isParticipant,
} from '@/domain/rbac/policies/policy-utils.ts'

const POLICY_ID = 'match.policy'

export function evaluateMatchPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'match') return null

  if (isAdmin(context)) {
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'match.view':
      if (isParticipant(context)) {
        return allow(`${POLICY_ID}:view-participant`)
      }
      return deny(
        `${POLICY_ID}:view-denied`,
        'Match view requires participant role',
      )

    default:
      return null
  }
}
