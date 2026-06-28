/**
 * Match entity RBAC policies — placeholder until match RBAC rules are defined.
 */

import type {
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
} from '@/domain/rbac/types.ts'

export function evaluateMatchPolicy(
  _action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation | null {
  if (context.entityType !== 'match') return null
  return null
}
