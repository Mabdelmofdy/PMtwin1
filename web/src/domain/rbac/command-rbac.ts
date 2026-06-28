import type { Command } from '@pm-twin/commands'
import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import { isAdmin } from '@/domain/rbac/policies/policy-utils.ts'
import {
  ACTION_ENTITY_MAP,
  isActionInRoleMatrix,
} from '@/domain/rbac/registry.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import type { PermissionAction, PermissionContext } from '@/domain/rbac/types.ts'
import { toCanonicalRole } from '@/domain/rbac/legacy-role-map.ts'

/** Platform-only commands that require admin route access. */
export const ADMIN_ONLY_COMMAND_TYPES = new Set([
  'ConfirmPostMatch',
  'ExpirePostMatch',
  'SupersedePostMatch',
  'TransitionPostMatchStatus',
])

export type CommandCapability =
  | 'admin.platform.execute'
  | PermissionAction

export const COMMAND_REQUIRED_CAPABILITY: Readonly<
  Partial<Record<string, CommandCapability>>
> = {
  ConfirmPostMatch: 'admin.platform.execute',
  ExpirePostMatch: 'admin.platform.execute',
  SupersedePostMatch: 'admin.platform.execute',
  TransitionPostMatchStatus: 'admin.platform.execute',
}

export type CommandRbacEvaluation = {
  readonly allowed: boolean
  readonly reason?: string
  readonly requiredCapability?: CommandCapability
  readonly matchedPolicies: readonly string[]
}

function allow(
  matchedPolicies: readonly string[],
): CommandRbacEvaluation {
  return { allowed: true, matchedPolicies }
}

function deny(
  reason: string,
  requiredCapability: CommandCapability | undefined,
  matchedPolicies: readonly string[],
): CommandRbacEvaluation {
  return {
    allowed: false,
    reason,
    requiredCapability,
    matchedPolicies,
  }
}

function evaluateAdminPlatformCommand(
  actor: CommandPermissionActor | null | undefined,
  capability: CommandCapability,
): CommandRbacEvaluation {
  if (!actor?.userId) {
    return deny(
      'Authentication required for admin command.',
      capability,
      ['command-rbac:admin-auth-required'],
    )
  }

  if (!canAccessAdminForRole(actor.userRole)) {
    return deny(
      'Admin permission required.',
      capability,
      ['command-rbac:admin-role-denied'],
    )
  }

  const context: PermissionContext = {
    userId: actor.userId,
    userRole: actor.userRole,
    entityType: 'match',
    workflowState: '',
  }

  if (isAdmin(context)) {
    return allow(['command-rbac:admin-policy-override'])
  }

  if (canAccessAdminForRole(actor.userRole)) {
    return allow(['command-rbac:admin-route-role'])
  }

  return deny(
    'Admin permission required.',
    capability,
    ['command-rbac:admin-policy-denied'],
  )
}

function evaluatePermissionActionCommand(
  action: PermissionAction,
  actor: CommandPermissionActor | null | undefined,
): CommandRbacEvaluation {
  if (!actor?.userId) {
    return allow(['command-rbac:participant-command-deferred'])
  }

  const entityType = ACTION_ENTITY_MAP[action]
  const context: PermissionContext = {
    userId: actor.userId,
    userRole: actor.userRole,
    entityType,
    workflowState: '',
  }
  const role = toCanonicalRole(actor.userRole)

  if (isActionInRoleMatrix(action, role)) {
    return allow(['command-rbac:role-matrix'])
  }

  if (isAdmin(context)) {
    return allow(['command-rbac:admin-override'])
  }

  return deny(
    `Role "${role}" cannot execute command requiring "${action}".`,
    action,
    ['command-rbac:role-matrix-denied'],
  )
}

/**
 * Enforce command-level RBAC before handler execution.
 * Non-governed commands are allowed (participant commands validate in handlers).
 */
export function evaluateCommandRbac(
  command: Command,
  actor: CommandPermissionActor | null | undefined,
): CommandRbacEvaluation {
  const capability = COMMAND_REQUIRED_CAPABILITY[command.commandType]

  if (!capability) {
    if (ADMIN_ONLY_COMMAND_TYPES.has(command.commandType)) {
      return evaluateAdminPlatformCommand(actor, 'admin.platform.execute')
    }
    return allow(['command-rbac:ungoverned'])
  }

  if (capability === 'admin.platform.execute') {
    return evaluateAdminPlatformCommand(actor, capability)
  }

  return evaluatePermissionActionCommand(capability, actor)
}

export function buildCommandRbacFailureResult(
  command: Command,
  evaluation: CommandRbacEvaluation,
) {
  return {
    success: false as const,
    aggregateId: command.aggregateId,
    commandType: command.commandType,
    errors: [evaluation.reason ?? 'Command denied by RBAC.'],
  }
}
