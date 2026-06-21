/**
 * RBAC policy engine — pure evaluation, advisory only.
 */

import { toCanonicalRole } from '@/domain/rbac/legacy-role-map.ts'
import { evaluateEntityPolicy } from '@/domain/rbac/policies/index.ts'
import { getRole } from '@/domain/rbac/policies/policy-utils.ts'
import {
  ALL_PERMISSION_ACTIONS,
  ACTION_ENTITY_MAP,
  isActionInRoleMatrix,
} from '@/domain/rbac/registry.ts'
import type {
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
  Role,
} from '@/domain/rbac/types.ts'

/**
 * Pure policy evaluation — no side effects, no blocking.
 * Applies role matrix coarse filter then entity-specific policies.
 */
export function evaluatePolicy(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation {
  const role = getRole(context)
  const expectedEntity = ACTION_ENTITY_MAP[action]

  if (expectedEntity && context.entityType !== expectedEntity) {
    return {
      allowed: false,
      reason: `Action "${action}" requires entity type "${expectedEntity}" (got "${context.entityType}")`,
      matchedPolicies: ['policy-engine:entity-mismatch'],
      workflowAware: false,
    }
  }

  if (!isActionInRoleMatrix(action, role)) {
    return {
      allowed: false,
      reason: `Role "${role}" is not in the default permissions matrix for "${action}"`,
      matchedPolicies: ['registry:role-matrix'],
      workflowAware: false,
    }
  }

  const entityResult = evaluateEntityPolicy(action, context)
  if (entityResult) {
    return entityResult
  }

  return {
    allowed: true,
    matchedPolicies: ['policy-engine:matrix-only'],
    workflowAware: false,
  }
}

/**
 * Determines if a user can perform an action in the given context.
 * Advisory — never blocks execution elsewhere.
 */
export function canPerformAction(
  action: PermissionAction,
  context: PermissionContext,
): PolicyEvaluation {
  return evaluatePolicy(action, context)
}

/**
 * Returns all permitted actions for the current user + entity state.
 */
export function getAllowedActions(context: PermissionContext): PermissionAction[] {
  const entityActions = ALL_PERMISSION_ACTIONS.filter(
    (action) => ACTION_ENTITY_MAP[action] === context.entityType,
  )

  return entityActions.filter(
    (action) => evaluatePolicy(action, context).allowed,
  )
}

/** Normalize a raw role string to canonical Role (convenience export). */
export function resolveRole(role: string | undefined | null): Role {
  return toCanonicalRole(role)
}
