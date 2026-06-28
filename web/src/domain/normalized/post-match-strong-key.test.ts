import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { PostMatch } from '@/types/domain.ts'
import {
  collectPostMatchOpportunityIds,
  computePostMatchStrongKey,
  computePostMatchStrongKeyFromMatch,
} from '@/domain/normalized/post-match-strong-key.ts'

describe('computePostMatchStrongKey', () => {
  it('generates one_way key from promoted fields', () => {
    const key = computePostMatchStrongKey({
      matchType: 'one_way',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
    })
    assert.equal(key, 'one_way:need-1:offer-1')
  })

  it('generates one_way key from payload fallback', () => {
    const key = computePostMatchStrongKey({
      matchType: 'one_way',
      payload: {
        needOpportunityId: 'need-2',
        offerOpportunityId: 'offer-2',
      },
    })
    assert.equal(key, 'one_way:need-2:offer-2')
  })

  it('orders two_way sides deterministically', () => {
    const key = computePostMatchStrongKey({
      matchType: 'two_way',
      payload: {
        sideA: { userId: 'u-b', needId: 'need-z', offerId: 'offer-z' },
        sideB: { userId: 'u-a', needId: 'need-a', offerId: 'offer-a' },
      },
    })
    assert.equal(key, 'two_way:need-a:offer-a|need-z:offer-z')
  })

  it('generates consortium key from lead need and sorted role assignments', () => {
    const key = computePostMatchStrongKey({
      matchType: 'consortium',
      payload: {
        leadNeedId: 'lead-1',
        roles: [
          { role: 'MEP', opportunityId: 'opp-mep', userId: 'user-mep' },
          { role: 'Architect', opportunityId: 'opp-arch', userId: 'user-arch' },
        ],
      },
    })
    assert.equal(
      key,
      'consortium:lead-1:Architect:user-arch:opp-arch|MEP:user-mep:opp-mep',
    )
  })

  it('generates circular key from sorted participants and link edges', () => {
    const key = computePostMatchStrongKey({
      matchType: 'circular',
      payload: {
        cycle: ['user-c', 'user-a', 'user-b'],
        links: [
          {
            fromCreatorId: 'user-a',
            toCreatorId: 'user-b',
            needId: 'need-a',
            offerId: 'offer-b',
            score: 0.9,
          },
          {
            fromCreatorId: 'user-b',
            toCreatorId: 'user-c',
            needId: 'need-b',
            offerId: 'offer-c',
            score: 0.85,
          },
        ],
      },
    })
    assert.ok(key?.startsWith('circular:user-a,user-b,user-c:'))
    assert.ok(key?.includes('user-a:user-b:offer-b:need-a'))
  })

  it('returns null when topology payload is incomplete', () => {
    assert.equal(
      computePostMatchStrongKey({ matchType: 'consortium', payload: { leadNeedId: 'x', roles: [] } }),
      null,
    )
    assert.equal(computePostMatchStrongKey({ matchType: 'circular', payload: { cycle: [], links: [] } }), null)
  })
})

describe('collectPostMatchOpportunityIds', () => {
  it('collects ids across consortium and circular payloads', () => {
    const consortium: PostMatch = {
      id: 'pm-1',
      matchType: 'consortium',
      status: 'discovered',
      matchScore: 0.5,
      participants: [],
      payload: {
        leadNeedId: 'lead-1',
        roles: [{ role: 'Architect', opportunityId: 'opp-arch', userId: 'u1' }],
      },
    }
    assert.deepEqual(collectPostMatchOpportunityIds(consortium).sort(), [
      'lead-1',
      'opp-arch',
    ])

    const circular: PostMatch = {
      id: 'pm-2',
      matchType: 'circular',
      status: 'discovered',
      matchScore: 0.5,
      participants: [],
      payload: {
        cycle: ['u1', 'u2'],
        links: [
          {
            fromCreatorId: 'u1',
            toCreatorId: 'u2',
            needId: 'need-1',
            offerId: 'offer-2',
            score: 0.8,
          },
        ],
      },
    }
    assert.deepEqual(collectPostMatchOpportunityIds(circular).sort(), [
      'need-1',
      'offer-2',
    ])
  })
})

describe('computePostMatchStrongKeyFromMatch', () => {
  it('delegates to computePostMatchStrongKey', () => {
    const match: PostMatch = {
      id: 'pm-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.9,
      needOpportunityId: 'n1',
      offerOpportunityId: 'o1',
      participants: [],
    }
    assert.equal(
      computePostMatchStrongKeyFromMatch(match),
      'one_way:n1:o1',
    )
  })
})
