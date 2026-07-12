import type { Command, TransitionOpportunityStatusCommand } from '@pm-twin/commands'
import { toCanonical } from '@pm-twin/lifecycle'
import { buildPermissionContext } from '@/domain/rbac/context/build-context.ts'
import { isAdmin } from '@/domain/rbac/policies/policy-utils.ts'
import {
  ACTION_ENTITY_MAP,
  isActionInRoleMatrix,
} from '@/domain/rbac/registry.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import type { PermissionAction, PermissionContext } from '@/domain/rbac/types.ts'
import { toCanonicalRole } from '@/domain/rbac/legacy-role-map.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'

/** Platform-only commands that require admin route access. */
export const ADMIN_ONLY_COMMAND_TYPES = new Set([
  'ConfirmPostMatch',
  'ExpirePostMatch',
  'SupersedePostMatch',
  'TransitionPostMatchStatus',
])

export type CommandRbacEntitySnapshot = {
  readonly creatorId?: string
  readonly status?: string
}

export type CommandRbacEvaluationContext = {
  readonly opportunity?: CommandRbacEntitySnapshot | null
}

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
  TransitionOpportunityStatus: 'opportunity.publish',
  PublishOpportunity: 'opportunity.publish',
  CreateOpportunity: 'opportunity.create',
  UpdateOpportunity: 'opportunity.create',
  ValidateOpportunityCollaborationModel: 'opportunity.view',
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

  // Capability-driven: do not elevate via legacy moderator→admin isAdmin() map.
  // Auditor can open Admin routes but must not execute platform mutations.
  if (hasAdminCapability(actor.userRole, 'admin.platform.execute')) {
    return allow(['command-rbac:admin-platform-capability'])
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

function isOpportunityOwner(
  actor: CommandPermissionActor,
  opportunity?: CommandRbacEntitySnapshot | null,
): boolean {
  if (!opportunity?.creatorId) return false
  return opportunity.creatorId === actor.userId
}

function evaluateTransitionOpportunityStatusRbac(
  command: TransitionOpportunityStatusCommand,
  actor: CommandPermissionActor | null | undefined,
  opportunity: CommandRbacEntitySnapshot | null | undefined,
  capability: CommandCapability,
): CommandRbacEvaluation {
  const canonicalTarget = toCanonical('opportunity', command.targetStatus)
  if (canonicalTarget !== 'published') {
    return allow(['command-rbac:transition-non-publish'])
  }

  if (!actor?.userId) {
    return deny(
      'Authentication required to publish an opportunity.',
      capability,
      ['command-rbac:publish-auth-required'],
    )
  }

  const context: PermissionContext = buildPermissionContext({
    userId: actor.userId,
    userRole: actor.userRole,
    entityType: 'opportunity',
    entity: opportunity ?? undefined,
    workflowState: opportunity?.status,
  })

  if (isAdmin(context)) {
    return allow(['command-rbac:admin-publish'])
  }

  if (isOpportunityOwner(actor, opportunity)) {
    return allow(['command-rbac:owner-publish'])
  }

  return deny(
    'Only the opportunity owner or an admin can publish.',
    capability,
    ['command-rbac:publish-not-owner'],
  )
}

/**
 * Enforce command-level RBAC before handler execution.
 * Non-governed commands are allowed (participant commands validate in handlers).
 */
export function evaluateCommandRbac(
  command: Command,
  actor: CommandPermissionActor | null | undefined,
  context?: CommandRbacEvaluationContext,
): CommandRbacEvaluation {
  if (command.commandType === 'TransitionOpportunityStatus') {
    return evaluateTransitionOpportunityStatusRbac(
      command as TransitionOpportunityStatusCommand,
      actor,
      context?.opportunity,
      'opportunity.publish',
    )
  }

  // PublishOpportunity is ownership-gated (same as Transition → published),
  // not company_owner-only — individuals publish their own Need/Offer drafts.
  if (command.commandType === 'PublishOpportunity') {
    return evaluateTransitionOpportunityStatusRbac(
      {
        commandType: 'TransitionOpportunityStatus',
        aggregateId: command.aggregateId,
        clientRequestId: command.clientRequestId,
        targetStatus: 'published',
      } as TransitionOpportunityStatusCommand,
      actor,
      context?.opportunity,
      'opportunity.publish',
    )
  }

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
