import { partiesApi } from '@/api/parties.ts'
import { peopleApi } from '@/api/people.ts'
import type { VettingActorContext } from '@/domain/rbac/vetting-mutation-guard.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

export function resolveVettingActorContextFromActor(
  actor: CommandPermissionActor | null,
): VettingActorContext | null {
  if (!actor) return null

  const user = peopleApi.get(actor.userId)
  if (!user) return null

  const partyId = actor.activePartyId ?? partiesApi.resolveActivePartyId(actor.userId)
  const activeParty = partiesApi.getParty(partyId) ?? null

  return { user, activeParty }
}

export function resolveVettingActorContextForGateway(): VettingActorContext | null {
  return resolveVettingActorContextFromActor(getCommandPermissionActor())
}
