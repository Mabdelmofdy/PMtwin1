import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity, PostMatch } from '@/types/domain.ts'
import { resolvePostMatchRelatedOpportunities } from '@/lib/post-match-related-opportunities.ts'

function opportunity(
  id: string,
  title: string,
  intent: Opportunity['intent'] = 'need',
): Opportunity {
  return { id, title, status: 'published', intent }
}

function lookup(
  map: Record<string, Opportunity>,
): (id: string) => Opportunity | undefined {
  return (id) => map[id]
}

describe('resolvePostMatchRelatedOpportunities', () => {
  it('one_way need opportunity shows counterpart offer', () => {
    const match: PostMatch = {
      id: 'pm-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.8,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const view = resolvePostMatchRelatedOpportunities(
      match,
      'need-1',
      lookup({
        'need-1': opportunity('need-1', 'HQ Fit-out Need', 'need'),
        'offer-1': opportunity('offer-1', 'MEP Offer', 'offer'),
      }),
    )

    assert.equal(view.matchType, 'one_way')
    assert.equal(view.items.length, 1)
    assert.equal(view.items[0]?.id, 'offer-1')
    assert.equal(view.items[0]?.label, 'Offer')
    assert.equal(view.items[0]?.title, 'MEP Offer')
  })

  it('one_way offer opportunity shows counterpart need', () => {
    const match: PostMatch = {
      id: 'pm-1',
      matchType: 'one_way',
      status: 'discovered',
      matchScore: 0.8,
      participants: [],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const view = resolvePostMatchRelatedOpportunities(
      match,
      'offer-1',
      lookup({
        'need-1': opportunity('need-1', 'HQ Fit-out Need', 'need'),
        'offer-1': opportunity('offer-1', 'MEP Offer', 'offer'),
      }),
    )

    assert.equal(view.items.length, 1)
    assert.equal(view.items[0]?.id, 'need-1')
    assert.equal(view.items[0]?.label, 'Need')
  })

  it('two_way opportunity shows both barter sides', () => {
    const match: PostMatch = {
      id: 'pm-barter',
      matchType: 'two_way',
      status: 'discovered',
      matchScore: 0.75,
      participants: [],
      payload: {
        sideA: { userId: 'u1', needId: 'need-a', offerId: 'offer-a' },
        sideB: { userId: 'u2', needId: 'need-b', offerId: 'offer-b' },
      },
    }

    const view = resolvePostMatchRelatedOpportunities(
      match,
      'need-a',
      lookup({
        'need-a': opportunity('need-a', 'Need A'),
        'offer-a': opportunity('offer-a', 'Offer A', 'offer'),
        'need-b': opportunity('need-b', 'Need B'),
        'offer-b': opportunity('offer-b', 'Offer B', 'offer'),
      }),
    )

    assert.equal(view.matchType, 'two_way')
    assert.deepEqual(
      view.items.map((item) => item.id),
      ['need-a', 'offer-a', 'need-b', 'offer-b'],
    )
    assert.match(view.items[0]?.label ?? '', /Side A/)
    assert.match(view.items[2]?.label ?? '', /Side B/)
  })

  it('consortium opportunity shows lead need and role assignments', () => {
    const match: PostMatch = {
      id: 'pm-consortium',
      matchType: 'consortium',
      status: 'discovered',
      matchScore: 0.7,
      participants: [],
      payload: {
        leadNeedId: 'lead-1',
        roles: [
          { role: 'Architect', opportunityId: 'opp-arch', userId: 'u-arch' },
          { role: 'QS', opportunityId: 'opp-qs', userId: 'u-qs' },
        ],
      },
    }

    const view = resolvePostMatchRelatedOpportunities(
      match,
      'opp-arch',
      lookup({
        'lead-1': opportunity('lead-1', 'Mega Project Need'),
        'opp-arch': opportunity('opp-arch', 'Architecture Offer', 'offer'),
        'opp-qs': opportunity('opp-qs', 'QS Offer', 'offer'),
      }),
    )

    assert.equal(view.matchType, 'consortium')
    assert.equal(view.items[0]?.id, 'lead-1')
    assert.equal(view.items[0]?.label, 'Lead need')
    assert.equal(view.items[1]?.label, 'Architect role')
    assert.equal(view.items[2]?.label, 'QS role')
    assert.equal(view.items[1]?.isCurrent, true)
  })

  it('circular opportunity shows cycle members and chain links', () => {
    const match: PostMatch = {
      id: 'pm-circular',
      matchType: 'circular',
      status: 'discovered',
      matchScore: 0.65,
      participants: [],
      payload: {
        cycle: ['opp-1', 'opp-2'],
        links: [
          {
            fromCreatorId: 'c1',
            toCreatorId: 'c2',
            needId: 'need-link-1',
            offerId: 'offer-link-1',
            score: 0.8,
          },
        ],
      },
    }

    const view = resolvePostMatchRelatedOpportunities(
      match,
      'opp-1',
      lookup({
        'opp-1': opportunity('opp-1', 'Cycle One'),
        'opp-2': opportunity('opp-2', 'Cycle Two'),
        'need-link-1': opportunity('need-link-1', 'Chain Need'),
        'offer-link-1': opportunity('offer-link-1', 'Chain Offer', 'offer'),
      }),
    )

    assert.equal(view.matchType, 'circular')
    assert.ok(view.items.some((item) => item.id === 'opp-1' && item.label === 'Cycle member'))
    assert.ok(view.items.some((item) => item.id === 'opp-2'))
    assert.ok(view.items.some((item) => item.id === 'need-link-1' && /need/.test(item.label)))
    assert.ok(view.items.some((item) => item.id === 'offer-link-1' && /offer/.test(item.label)))
  })
})
