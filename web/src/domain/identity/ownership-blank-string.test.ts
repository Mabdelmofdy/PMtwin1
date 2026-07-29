import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildDiscoverParticipant,
  buildMatchingDiscoveryContext,
  resolveOpportunityOwner,
} from './matching-discovery-context.ts'
import {
  normalizeOptionalOwnershipId,
  resolveOpportunityOwnership,
} from './ownership-adapters.ts'
import type { Opportunity } from '@/types/domain.ts'

describe('ownership blank-string normalization', () => {
  it('treats empty ownerPartyId/workspaceId as absent for legacy fallback', () => {
    assert.equal(normalizeOptionalOwnershipId(''), undefined)
    assert.equal(normalizeOptionalOwnershipId('   '), undefined)
    assert.equal(normalizeOptionalOwnershipId('party-individual-u1'), 'party-individual-u1')

    const ownership = resolveOpportunityOwnership(
      {
        creatorId: 'seed-user-001',
        ownerPartyId: '',
        workspaceId: '',
        createdByUserId: 'seed-user-001',
      },
      {
        userIds: new Set(['seed-user-001']),
        companyIds: new Set(),
      },
    )

    assert.equal(ownership.ownerPartyId, 'party-individual-seed-user-001')
    assert.equal(ownership.workspaceId, 'ws-personal-seed-user-001')
    assert.equal(ownership.createdByUserId, 'seed-user-001')
  })

  it('builds DiscoverPostMatch participants when stored ownership ids are blank', () => {
    const ctx = buildMatchingDiscoveryContext(['seed-user-001'], [])
    const opportunity = {
      id: 'opp-blank-owner',
      title: 'Need',
      status: 'published',
      intent: 'need',
      creatorId: 'seed-user-001',
      createdByUserId: 'seed-user-001',
      ownerPartyId: '',
      workspaceId: '',
    } as Opportunity

    const owner = resolveOpportunityOwner(opportunity, ctx)
    assert.ok(owner)
    assert.equal(owner?.ownerPartyId, 'party-individual-seed-user-001')

    const participant = buildDiscoverParticipant(opportunity, 'need_owner', ctx)
    assert.ok(participant)
    assert.equal(participant?.userId, 'seed-user-001')
    assert.equal(participant?.partyId, 'party-individual-seed-user-001')
  })
})
