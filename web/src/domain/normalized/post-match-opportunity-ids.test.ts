import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PostMatch } from '@/types/domain.ts'
import { resolvePostMatchOpportunityIds } from '@/domain/normalized/post-match-opportunity-ids.ts'

function baseMatch(overrides: Partial<PostMatch>): PostMatch {
  return {
    id: 'pm',
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.5,
    participants: [],
    ...overrides,
  }
}

describe('resolvePostMatchOpportunityIds', () => {
  it('resolves one_way from promoted fields', () => {
    const result = resolvePostMatchOpportunityIds(
      baseMatch({
        matchType: 'one_way',
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      }),
    )
    assert.equal(result.needOpportunityId, 'need-1')
    assert.equal(result.offerOpportunityId, 'offer-1')
    assert.deepEqual(result.opportunityIds, ['need-1', 'offer-1'])
  })

  it('resolves two_way from both sides', () => {
    const result = resolvePostMatchOpportunityIds(
      baseMatch({
        matchType: 'two_way',
        payload: {
          sideA: { userId: 'A', needId: 'a-need', offerId: 'a-offer' },
          sideB: { userId: 'B', needId: 'b-need', offerId: 'b-offer' },
        },
      }),
    )
    assert.equal(result.needOpportunityId, 'a-need')
    assert.equal(result.offerOpportunityId, 'a-offer')
    assert.deepEqual(result.opportunityIds, [
      'a-need',
      'a-offer',
      'b-need',
      'b-offer',
    ])
  })

  it('resolves consortium from lead + roles', () => {
    const result = resolvePostMatchOpportunityIds(
      baseMatch({
        matchType: 'consortium',
        payload: {
          leadNeedId: 'lead-need',
          roles: [
            { role: 'A', opportunityId: 'role-1', userId: 'm1' },
            { role: 'B', opportunityId: 'role-2', userId: 'm2' },
          ],
        },
      }),
    )
    assert.equal(result.needOpportunityId, 'lead-need')
    assert.equal(result.offerOpportunityId, 'role-1')
    assert.deepEqual(result.opportunityIds, ['lead-need', 'role-1', 'role-2'])
  })

  it('resolves circular from links (de-duplicated)', () => {
    const result = resolvePostMatchOpportunityIds(
      baseMatch({
        matchType: 'circular',
        payload: {
          cycle: ['c1', 'c2', 'c3'],
          links: [
            { fromCreatorId: 'c1', toCreatorId: 'c2', needId: 'c2-need', offerId: 'c1-offer', score: 0.7 },
            { fromCreatorId: 'c2', toCreatorId: 'c3', needId: 'c3-need', offerId: 'c2-offer', score: 0.7 },
            { fromCreatorId: 'c3', toCreatorId: 'c1', needId: 'c1-need', offerId: 'c3-offer', score: 0.7 },
          ],
        },
      }),
    )
    assert.equal(result.needOpportunityId, 'c2-need')
    assert.equal(result.offerOpportunityId, 'c1-offer')
    assert.equal(result.opportunityIds.length, 6)
  })
})
