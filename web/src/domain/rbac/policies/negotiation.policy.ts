/**
 * Negotiation entity RBAC policies — pure, context- and workflow-aware.
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
  isReadOnlyState,
} from '@/domain/rbac/policies/policy-utils.ts'

const TERMINAL_STATES = ['agreed', 'expired', 'cancelled'] as const
const POLICY_ID = 'negotiation.policy'

export function evaluateNegotiationPolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'negotiation') return null

  if (isAdmin(context)) {
    if (action === 'negotiation.terminate') {
      return allow(`${POLICY_ID}:admin-terminate`, true)
    }
    return allow(`${POLICY_ID}:admin-override`)
  }

  switch (action) {
    case 'negotiation.start':
      if (!isParticipant(context)) {
        return deny(
          `${POLICY_ID}:start-participant`,
          'Only negotiation participants can start negotiations',
        )
      }
      return allow(`${POLICY_ID}:participant-start`)

    case 'negotiation.counter':
    case 'negotiation.accept': {
      if (!isParticipant(context)) {
        return deny(
          `${POLICY_ID}:action-participant`,
          'Only negotiation participants can counter or accept',
        )
      }
      if (isReadOnlyState(context, TERMINAL_STATES)) {
        return deny(
          `${POLICY_ID}:action-terminal`,
          'Negotiation is in a terminal state',
          true,
        )
      }
      return allow(`${POLICY_ID}:participant-action`, true)
    }

    case 'negotiation.terminate':
      return deny(
        `${POLICY_ID}:terminate-denied`,
        'Only admins can terminate negotiations',
      )

    case 'negotiation.view':
      if (isParticipant(context)) {
        return allow(`${POLICY_ID}:view-participant`)
      }
      return deny(
        `${POLICY_ID}:view-denied`,
        'Negotiation view requires participant role',
      )

    default:
      return deny(
        `${POLICY_ID}:unknown-action`,
        `Action "${action}" is not permitted on negotiations`,
      )
  }
}
