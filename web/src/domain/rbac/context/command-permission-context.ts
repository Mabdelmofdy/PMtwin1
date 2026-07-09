/**
 * Thread-local command permission actor for gateway RBAC enforcement.
 * Set by AuthProvider on session changes; tests may override.
 */

export type CommandPermissionActor = {
  readonly userId: string
  readonly userRole: string
  readonly activePartyId?: string
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
