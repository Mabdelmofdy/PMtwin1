import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isOpportunityOwnedByContext } from './ownership-adapters.ts'
import {
  stampCommercialAgreementCreateMetadata,
  stampNegotiationCreateMetadata,
} from './command-actor-stamping.ts'
import { setCommandPermissionActor, resetCommandPermissionActorForTests } from '@/domain/rbac/context/command-permission-context.ts'

describe('legacy compatibility restrictions', () => {
  it('does not authorize ownership from creatorId alone when canonical fields exist', () => {
    assert.equal(
      isOpportunityOwnedByContext(
        {
          workspaceId: 'ws-company-a',
          ownerPartyId: 'party-company-a',
          creatorId: 'employee-1',
        },
        {
          activeWorkspaceId: 'ws-personal-employee',
          activePartyId: 'party-individual-employee',
          userId: 'employee-1',
        },
      ),
      false,
    )
  })

  it('matches owner when active party id is an alias of opportunity ownerPartyId', () => {
    assert.equal(
      isOpportunityOwnedByContext(
        {
          workspaceId: 'ws-personal-seed-user-002',
          ownerPartyId: 'party-individual-seed-user-002',
          creatorId: 'seed-user-002',
        },
        {
          activeWorkspaceId: 'ws-personal-seed-user-002',
          activePartyId: 'seed-user-002',
          userId: 'seed-user-002',
        },
      ),
      true,
    )
  })

  it('stamps canonical metadata on new negotiation writes', () => {
    setCommandPermissionActor({
      userId: 'actor-1',
      userRole: 'user',
      activeWorkspaceId: 'ws-personal-actor-1',
      activePartyId: 'party-individual-actor-1',
      actorType: 'marketplace_user',
    })
    const metadata = stampNegotiationCreateMetadata({
      actorUserId: 'actor-1',
      partyId: 'party-individual-actor-1',
      workspaceId: 'ws-personal-actor-1',
      actorType: 'marketplace_user',
    })
    assert.equal(metadata.initiatingPartyId, 'party-individual-actor-1')
    assert.equal(metadata.initiatedByWorkspaceId, 'ws-personal-actor-1')
    assert.equal(metadata.createdByUserId, 'actor-1')
    resetCommandPermissionActorForTests()
  })

  it('stamps canonical metadata on new commercial agreement writes', () => {
    const metadata = stampCommercialAgreementCreateMetadata(
      {
        actorUserId: 'award-user',
        partyId: 'party-company-a',
        workspaceId: 'ws-company-a',
        actorType: 'marketplace_user',
      },
      'party-company-owner',
    )
    assert.equal(metadata.originatingOwnerPartyId, 'party-company-owner')
    assert.equal(metadata.createdByUserId, 'award-user')
    assert.equal(metadata.initiatingPartyId, 'party-company-a')
  })
})
