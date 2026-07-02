/**
 * Centralized permission registry — coarse role matrix + action catalog.
 * Fine-grained decisions still pass through entity policy evaluation.
 */

import type { PermissionAction, RbacEntityType, Role } from '@/domain/rbac/types.ts'

/** All registered permission actions. */
export const ALL_PERMISSION_ACTIONS: readonly PermissionAction[] = [
  'opportunity.create',
  'opportunity.publish',
  'opportunity.view',
  'opportunity.cancel',
  'application.apply',
  'application.accept',
  'application.reject',
  'application.view',
  'match.view',
  'negotiation.start',
  'negotiation.counter',
  'negotiation.accept',
  'negotiation.terminate',
  'negotiation.view',
  'deal.create',
  'deal.execute',
  'deal.view',
  'contract.sign',
  'contract.view',
  'contract.terminate',
] as const

/** All canonical RBAC roles. */
export const ALL_ROLES: readonly Role[] = ['admin', 'company_owner', 'user'] as const

/**
 * Default permissions matrix — advisory coarse filter.
 * Entity policies provide context- and workflow-aware refinement.
 */
export const ROLE_MATRIX: Readonly<Record<Role, readonly string[]>> = {
  admin: ['*'],
  company_owner: [
    'opportunity.*',
    'application.accept',
    'application.reject',
    'application.view',
    'negotiation.*',
    'deal.create',
    'deal.execute',
    'deal.view',
    'contract.sign',
    'contract.view',
    'contract.terminate',
  ],
  user: [
    'application.apply',
    'application.view',
    'opportunity.view',
    'negotiation.counter',
    'negotiation.accept',
    'deal.view',
    'contract.sign',
    'contract.view',
  ],
} as const

/** Maps each action to its governing entity type. */
export const ACTION_ENTITY_MAP: Readonly<Record<PermissionAction, RbacEntityType>> = {
  'opportunity.create': 'opportunity',
  'opportunity.publish': 'opportunity',
  'opportunity.view': 'opportunity',
  'opportunity.cancel': 'opportunity',
  'application.apply': 'application',
  'application.accept': 'application',
  'application.reject': 'application',
  'application.view': 'application',
  'match.view': 'match',
  'negotiation.start': 'negotiation',
  'negotiation.counter': 'negotiation',
  'negotiation.accept': 'negotiation',
  'negotiation.terminate': 'negotiation',
  'negotiation.view': 'negotiation',
  'deal.create': 'deal',
  'deal.execute': 'deal',
  'deal.view': 'deal',
  'contract.sign': 'contract',
  'contract.view': 'contract',
  'contract.terminate': 'contract',
} as const

/**
 * Actions that imply a workflow transition (from current state → targetState).
 * Used by the workflow-RBAC bridge for combined evaluation.
 */
export const ACTION_WORKFLOW_TARGETS: Readonly<
  Partial<Record<PermissionAction, string>>
> = {
  'opportunity.publish': 'published',
  'opportunity.cancel': 'cancelled',
  'application.accept': 'accepted',
  'application.reject': 'rejected',
  'application.apply': 'submitted',
  'negotiation.start': 'active',
  'negotiation.counter': 'countered',
  'negotiation.accept': 'agreed',
  'negotiation.terminate': 'cancelled',
  'deal.create': 'draft',
  'deal.execute': 'execution',
  'contract.sign': 'active',
  'contract.terminate': 'terminated',
} as const

/** Match an action against a role-matrix pattern (supports `*` and `entity.*`). */
export function matchesRolePattern(
  action: PermissionAction,
  pattern: string,
): boolean {
  if (pattern === '*') return true
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2)
    return action.startsWith(`${prefix}.`)
  }
  return action === pattern
}

/** Coarse matrix check — true if role's patterns include the action. */
export function isActionInRoleMatrix(
  action: PermissionAction,
  role: Role,
): boolean {
  const patterns = ROLE_MATRIX[role] ?? []
  return patterns.some((pattern) => matchesRolePattern(action, pattern))
}
