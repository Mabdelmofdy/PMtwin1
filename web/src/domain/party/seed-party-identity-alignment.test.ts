import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { partyIdForSource } from '@pm-twin/identity'
import {
  canonicalPartyIdForAccount,
  partyIdLookupAliases,
  projectAccountToParty,
  projectPrimaryMembership,
} from '@/domain/party/party-projection.ts'
import { resolveVettingActorContextFromActor } from '@/domain/rbac/resolve-vetting-actor-context.ts'
import { canMutateAsVettedUser } from '@/domain/rbac/vetting-mutation-guard.ts'
import { loadUsers } from '@/infrastructure/seed/seed-loader.ts'
import { partiesApi } from '@/api/parties.ts'
import { peopleApi } from '@/api/people.ts'

describe('seed account party identity alignment', () => {
  it('projects Sara to canonical party id matching workspace ownerPartyId', () => {
    const sara = loadUsers().find((u) => u.email === 'sara.almutairi@pmtwin.test')
    assert.ok(sara)
    assert.equal(sara?.status, 'active')

    const companyIds = new Set<string>()
    const party = projectAccountToParty(sara!, companyIds)
    const expectedId = partyIdForSource(sara!.id, 'individual')
    assert.equal(party.id, expectedId)
    assert.equal(party.sourceEntityId, sara!.id)
    assert.equal(party.status, 'active')

    const membership = projectPrimaryMembership(sara!, companyIds)
    assert.equal(membership.partyId, expectedId)
    assert.equal(canonicalPartyIdForAccount(sara!, companyIds), expectedId)
  })

  it('resolves identity party aliases for legacy document owner ids', () => {
    const aliases = partyIdLookupAliases('party-individual-seed-user-002')
    assert.ok(aliases.includes('party-individual-seed-user-002'))
    assert.ok(aliases.includes('seed-user-002'))
  })

  it('allows mutations for seeded Sara when session uses identity party id', () => {
    const sara = peopleApi.listUsers().find((u) => u.email === 'sara.almutairi@pmtwin.test')
    assert.ok(sara)
    const identityPartyId = partyIdForSource(sara!.id, 'individual')
    const party = partiesApi.getParty(identityPartyId)
    assert.ok(party, 'canonical party must resolve for seed user')
    assert.equal(party?.status, 'active')
    assert.equal(canMutateAsVettedUser(sara!, party ?? null), true)

    const context = resolveVettingActorContextFromActor({
      userId: sara!.id,
      userRole: sara!.role,
      activeWorkspaceId: `ws-personal-${sara!.id}`,
      activePartyId: identityPartyId,
      workspaceRole: 'workspace_owner',
      platformRoles: [],
      capabilities: ['opportunity.create'],
      actorType: 'marketplace_user',
    })
    assert.ok(context?.activeParty)
    assert.equal(context?.activeParty?.status, 'active')
    assert.equal(canMutateAsVettedUser(context!.user, context!.activeParty), true)
  })
})
