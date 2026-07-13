import { partiesApi } from '@/api/parties.ts'
import { peopleApi } from '@/api/people.ts'
import type { VettingActorContext } from '@/domain/rbac/vetting-mutation-guard.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { partyIdLookupAliases } from '@/domain/party/party-projection.ts'

export function resolveVettingActorContextFromActor(
  actor: CommandPermissionActor | null,
): VettingActorContext | null {
  if (!actor) return null

  const user = peopleApi.get(actor.userId)
  if (!user) return null

  const partyId = actor.activePartyId ?? partiesApi.resolveActivePartyId(actor.userId)
  let activeParty = partiesApi.getParty(partyId) ?? null

  if (!activeParty && partyId) {
    for (const alias of partyIdLookupAliases(partyId)) {
      activeParty = partiesApi.getParty(alias) ?? null
      if (activeParty) break
    }
  }

  if (!activeParty) {
    activeParty = partiesApi.resolveActiveParty(actor.userId) ?? null
  }

  return { user, activeParty }
}

export function resolveVettingActorContextForGateway(): VettingActorContext | null {
  return resolveVettingActorContextFromActor(getCommandPermissionActor())
}
