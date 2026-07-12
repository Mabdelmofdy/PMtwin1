/**
 * Thread-local command permission actor for gateway RBAC enforcement.
 * Set by AuthProvider on session changes; tests may override.
 */
import type {
  PlatformRole,
  WorkspaceCapability,
  WorkspaceRole,
} from '@pm-twin/identity'

export type CommandPermissionActor = {
  readonly userId: string
  readonly userRole: string
  readonly activeWorkspaceId?: string
  readonly activePartyId?: string
  readonly workspaceRole?: WorkspaceRole
  readonly platformRoles?: readonly PlatformRole[]
  readonly capabilities?: readonly WorkspaceCapability[]
  readonly actorType?: 'marketplace_user' | 'platform_operator' | 'system'
}

let actorOverride: CommandPermissionActor | null | undefined

export function setCommandPermissionActor(
  actor: CommandPermissionActor | null,
): void {
  actorOverride = actor
}

export function getCommandPermissionActor(): CommandPermissionActor | null {
  return actorOverride ?? null
}

export function resetCommandPermissionActorForTests(): void {
  actorOverride = undefined
}
