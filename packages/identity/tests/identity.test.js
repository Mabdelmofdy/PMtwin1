import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertImportSchemaVersions,
  buildWorkflowActorContext,
  hasWorkspaceCapability,
  IDENTITY_SCHEMA_VERSION,
  membershipIdFor,
  partyIdForSource,
  projectIdentityFromLegacyAccounts,
  recoverActiveBusinessContext,
  resolveLegacyOpportunityOwnership,
  resolveLegacyRoleToPlatformRoles,
  resolveLegacyRoleToWorkspaceMembership,
  resolveWorkspaceCapabilities,
  SYSTEM_MIGRATION_USER_ID,
  validateOwnershipIntegrity,
  workspaceIdForSource,
} from '../dist/index.js'

describe('@pm-twin/identity', () => {
  it('maps workspace roles to capabilities without role-name scatter', () => {
    const legal = resolveWorkspaceCapabilities('legal')
    assert.ok(legal.includes('contract.sign'))
    assert.ok(!legal.includes('agreement.award'))
    assert.equal(
      hasWorkspaceCapability({ workspaceRole: 'viewer' }, 'opportunity.create'),
      false,
    )
  })

  it('separates platform roles from workspace membership roles', () => {
    assert.deepEqual(resolveLegacyRoleToPlatformRoles('admin'), ['admin'])
    assert.equal(resolveLegacyRoleToWorkspaceMembership('admin'), null)
    assert.equal(resolveLegacyRoleToWorkspaceMembership('company_owner'), 'workspace_owner')
    assert.deepEqual(resolveLegacyRoleToPlatformRoles('company_owner'), [])
  })

  it('projects identity idempotently', () => {
    const input = {
      users: [{ id: 'u1', email: 'a@x.com', profile: { name: 'A' } }],
      companies: [{ id: 'c1', email: 'c@x.com', profile: { name: 'Co', type: 'company' } }],
      companyOwnerLinks: [{ userId: 'u1', companyId: 'c1', role: 'workspace_owner' }],
    }
    const once = projectIdentityFromLegacyAccounts(input)
    const twice = projectIdentityFromLegacyAccounts(input)
    assert.deepEqual(once.workspaces.map((w) => w.id).sort(), twice.workspaces.map((w) => w.id).sort())
    assert.deepEqual(once.parties.map((p) => p.id).sort(), twice.parties.map((p) => p.id).sort())
    assert.deepEqual(once.memberships.map((m) => m.id).sort(), twice.memberships.map((m) => m.id).sort())
    assert.equal(once.workspaces.filter((w) => w.type === 'company').length, 1)
    assert.equal(once.parties.filter((p) => p.type === 'company').length, 1)
    assert.ok(once.memberships.some((m) => m.userId === 'u1' && m.workspaceId === workspaceIdForSource('c1', 'company')))
  })

  it('enforces one primary party per workspace', () => {
    const projected = projectIdentityFromLegacyAccounts({
      users: [{ id: 'u1', email: 'a@x.com' }],
      companies: [],
    })
    const result = validateOwnershipIntegrity({
      workspaces: projected.workspaces,
      parties: projected.parties,
      memberships: projected.memberships,
    })
    assert.equal(result.valid, true)
  })

  it('rejects platform ownerPartyId on marketplace entity', () => {
    const projected = projectIdentityFromLegacyAccounts({
      users: [{ id: 'u1', email: 'a@x.com' }],
      companies: [],
    })
    const result = validateOwnershipIntegrity({
      entity: {
        id: 'opp-1',
        workspaceId: projected.workspaces[0].id,
        ownerPartyId: projected.parties[0].id,
      },
      workspaces: projected.workspaces,
      parties: projected.parties,
      memberships: projected.memberships,
      platformAccess: { userId: 'admin-1', platformRoles: ['admin'] },
    })
    assert.equal(result.valid, false)
    assert.ok(result.issues.some((i) => i.code === 'platform_owner_party'))
  })

  it('recovers active context without silent company→personal switch', () => {
    const projected = projectIdentityFromLegacyAccounts({
      users: [{ id: 'u1', email: 'a@x.com' }],
      companies: [{ id: 'c1', profile: { name: 'Co' } }],
      companyOwnerLinks: [{ userId: 'u1', companyId: 'c1' }],
    })
    const recovery = recoverActiveBusinessContext({
      userId: 'u1',
      memberships: projected.memberships,
      workspaces: projected.workspaces,
      parties: projected.parties,
      preferredWorkspaceId: 'ws-missing',
    })
    assert.equal(recovery.requiresWorkspaceSelection, true)
    assert.equal(recovery.clearedInvalid, true)
  })

  it('builds immutable actor snapshot with capabilities', () => {
    const actor = buildWorkflowActorContext({
      actorUserId: 'u1',
      actorType: 'marketplace_user',
      workspaceId: 'ws-1',
      partyId: 'party-1',
      workspaceRole: 'legal',
    })
    assert.ok(actor.capabilities?.includes('contract.sign'))
  })

  it('maps legacy company creatorId without fabricating human actor', () => {
    const mapped = resolveLegacyOpportunityOwnership({
      creatorId: 'c1',
      companyIds: new Set(['c1']),
      userIds: new Set(['u1']),
    })
    assert.equal(mapped.ownerPartyId, partyIdForSource('c1', 'company'))
    assert.equal(mapped.unresolvedActor, true)
    assert.equal(mapped.createdByUserId, undefined)
  })

  it('uses stable deterministic ids', () => {
    assert.equal(workspaceIdForSource('u1', 'personal'), 'ws-personal-u1')
    assert.equal(partyIdForSource('u1', 'individual'), 'party-individual-u1')
    assert.equal(membershipIdFor('u1', 'ws-personal-u1'), 'wsm-u1-ws-personal-u1')
    assert.equal(SYSTEM_MIGRATION_USER_ID, 'system-migration-actor')
  })

  it('validates schema versions for import', () => {
    assert.equal(assertImportSchemaVersions({ identitySchemaVersion: IDENTITY_SCHEMA_VERSION }).ok, true)
    assert.equal(assertImportSchemaVersions({ identitySchemaVersion: 99 }).ok, false)
  })
})
