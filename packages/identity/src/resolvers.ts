import type {
  ActorType,
  BusinessWorkspace,
  CreatedByActor,
  MarketplaceParty,
  WorkflowActorContext,
  WorkspaceMembership,
  WorkspaceRole,
} from './types.ts'
import { resolveWorkspaceCapabilities } from './capabilities.ts'

/** Deterministic migrated IDs — idempotent across runs. */
export function workspaceIdForSource(sourceEntityId: string, type: 'personal' | 'company'): string {
  return `ws-${type}-${sourceEntityId}`
}

export function partyIdForSource(sourceEntityId: string, type: 'individual' | 'company'): string {
  return `party-${type}-${sourceEntityId}`
}

export function membershipIdFor(userId: string, workspaceId: string): string {
  return `wsm-${userId}-${workspaceId}`
}

export const SYSTEM_MIGRATION_USER_ID = 'system-migration-actor'

export function createdByActorFromHuman(userId: string): CreatedByActor {
  return { actorType: 'marketplace_user', actorUserId: userId }
}

export function createdByActorSystem(): CreatedByActor {
  return { actorType: 'system' }
}

export function resolveCreatedByActor(input: {
  readonly createdByActor?: CreatedByActor
  readonly createdByUserId?: string
  readonly createdByActorType?: ActorType
  readonly creatorId?: string
}): CreatedByActor {
  if (input.createdByActor) return input.createdByActor
  if (input.createdByActorType === 'system' && !input.createdByUserId) {
    return createdByActorSystem()
  }
  const userId = input.createdByUserId ?? input.creatorId
  if (userId === SYSTEM_MIGRATION_USER_ID) {
    return { actorType: 'system', actorUserId: SYSTEM_MIGRATION_USER_ID }
  }
  if (userId) {
    return {
      actorType: input.createdByActorType ?? 'marketplace_user',
      actorUserId: userId,
    }
  }
  return createdByActorSystem()
}

export function buildWorkflowActorContext(input: {
  readonly actorUserId: string
  readonly actorType: ActorType
  readonly workspaceId?: string
  readonly partyId?: string
  readonly workspaceRole?: WorkspaceRole
  readonly platformRoles?: WorkflowActorContext['platformRoles']
}): WorkflowActorContext {
  const capabilities = input.workspaceRole
    ? resolveWorkspaceCapabilities(input.workspaceRole)
    : undefined
  return {
    actorUserId: input.actorUserId,
    actorType: input.actorType,
    workspaceId: input.workspaceId,
    partyId: input.partyId,
    workspaceRole: input.workspaceRole,
    platformRoles: input.platformRoles,
    capabilities,
  }
}

export type ActiveContextRecovery = {
  readonly activeWorkspaceId?: string
  readonly activePartyId?: string
  readonly requiresWorkspaceSelection: boolean
  readonly clearedInvalid: boolean
  readonly reason?: string
}

/**
 * Deterministic recovery when session references are invalid.
 * Never silently switches Company → Personal or to Platform.
 */
export function recoverActiveBusinessContext(input: {
  readonly userId: string
  readonly memberships: readonly WorkspaceMembership[]
  readonly workspaces: readonly BusinessWorkspace[]
  readonly parties: readonly MarketplaceParty[]
  readonly preferredWorkspaceId?: string
  readonly preferredPartyId?: string
}): ActiveContextRecovery {
  const activeMemberships = input.memberships.filter(
    (m) => m.userId === input.userId && m.status === 'active',
  )
  const validWorkspaces = input.workspaces.filter(
    (w) =>
      w.status === 'active' &&
      activeMemberships.some((m) => m.workspaceId === w.id),
  )

  const preferredStillValid =
    input.preferredWorkspaceId &&
    validWorkspaces.some((w) => w.id === input.preferredWorkspaceId)

  if (preferredStillValid) {
    const workspace = validWorkspaces.find((w) => w.id === input.preferredWorkspaceId)!
    const party =
      input.parties.find((p) => p.id === (input.preferredPartyId ?? workspace.ownerPartyId)) ??
      input.parties.find((p) => p.workspaceId === workspace.id)
    return {
      activeWorkspaceId: workspace.id,
      activePartyId: party?.id ?? workspace.ownerPartyId,
      requiresWorkspaceSelection: false,
      clearedInvalid: Boolean(
        input.preferredPartyId && party?.id !== input.preferredPartyId,
      ),
    }
  }

  if (validWorkspaces.length === 1) {
    const workspace = validWorkspaces[0]!
    return {
      activeWorkspaceId: workspace.id,
      activePartyId: workspace.ownerPartyId,
      requiresWorkspaceSelection: false,
      clearedInvalid: true,
      reason: 'recovered_unambiguous_workspace',
    }
  }

  if (validWorkspaces.length === 0) {
    return {
      requiresWorkspaceSelection: true,
      clearedInvalid: true,
      reason: 'no_valid_business_workspace',
    }
  }

  return {
    requiresWorkspaceSelection: true,
    clearedInvalid: true,
    reason: 'ambiguous_workspace_selection',
  }
}

export function canAccessWorkspaceEntity(input: {
  readonly activeWorkspaceId: string | undefined
  readonly entityWorkspaceId: string | undefined
}): boolean {
  if (!input.activeWorkspaceId || !input.entityWorkspaceId) return false
  return input.activeWorkspaceId === input.entityWorkspaceId
}

export function entityBelongsToOwnerParty(input: {
  readonly activePartyId: string | undefined
  readonly ownerPartyId: string | undefined
}): boolean {
  if (!input.activePartyId || !input.ownerPartyId) return false
  return input.activePartyId === input.ownerPartyId
}
