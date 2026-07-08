import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolveOpportunityOwnerPartyId,
  withResolvedOwnerPartyId,
} from '@/domain/party/ownership-adapters.ts'

describe('ownership adapters', () => {
  it('prefers ownerPartyId over creatorId', () => {
    assert.equal(
      resolveOpportunityOwnerPartyId({
        ownerPartyId: 'party-001',
        creatorId: 'seed-co-corp-001',
      }),
      'party-001',
    )
  })

  it('falls back to creatorId when ownerPartyId is absent', () => {
    assert.equal(
      resolveOpportunityOwnerPartyId({ creatorId: 'seed-co-corp-001' }),
      'seed-co-corp-001',
    )
  })

  it('adds resolvedOwnerPartyId on read normalization', () => {
    const normalized = withResolvedOwnerPartyId({ creatorId: 'seed-user-001' })
    assert.equal(normalized.resolvedOwnerPartyId, 'seed-user-001')
  })
})
