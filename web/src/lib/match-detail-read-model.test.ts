import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  buildMatchDetailReadModel,
  isParticipantOnMatch,
  resolveMatchDetailContextOpportunityId,
  resolveMatchScoreFactors,
} from '@/lib/match-detail-read-model.ts'

const participants = [
  {
    userId: 'user-need',
    role: 'need_owner',
    opportunityId: 'need-1',
    participantStatus: 'pending',
  },
  {
    userId: 'user-offer',
    role: 'offer_provider',
    opportunityId: 'offer-1',
    participantStatus: 'pending',
  },
] as const

function opportunity(id: string, title: string, intent: 'need' | 'offer' = 'need'): Opportunity {
  return { id, title, status: 'published', intent }
}

function baseDeps(
  options: {
    opportunities?: Opportunity[]
    negotiations?: Negotiation[]
    deals?: Deal[]
    currentUserId?: string | null
    canAct?: boolean
  } = {},
) {
  const opportunityMap = Object.fromEntries(
    (options.opportunities ?? []).map((opp) => [opp.id, opp]),
  )
  const negotiations = options.negotiations ?? []
  const deals = options.deals ?? []

  return {
    getOpportunity: (id: string) => opportunityMap[id],
    getNegotiationsForPostMatch: (postMatchId: string) =>
      negotiations.filter(
        (negotiation) =>
          negotiation.postMatchId === postMatchId ||
          negotiation.matchId === postMatchId,
      ),
    getDealForPostMatch: (postMatchId: string) =>
      deals.find(
        (deal) => deal.postMatchId === postMatchId || deal.matchId === postMatchId,
      ),
    getPersonName: (userId: string) =>
      userId === 'user-need' ? 'Need Owner' : userId === 'user-offer' ? 'Offer Provider' : userId,
    currentUserId: options.currentUserId ?? 'user-need',
    canAct: options.canAct ?? true,
  }
}

function discoveredMatch(overrides: Partial<PostMatch> = {}): PostMatch {
  return {
    id: 'pm-discovered',
    matchType: 'one_way',
    status: 'discovered',
    matchScore: 0.9,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    participants: [...participants],
    payload: {
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
    },
    ...overrides,
  }
}

describe('buildMatchDetailReadModel', () => {
  const opportunities = [
    opportunity('need-1', 'Need'),
    opportunity('offer-1', 'Offer', 'offer'),
  ]

  it('discovered participant sees accept and decline', () => {
    const model = buildMatchDetailReadModel(
      discoveredMatch(),
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.isParticipant, true)
    assert.equal(model.actions.showAccept, true)
    assert.equal(model.actions.showDecline, true)
    assert.equal(model.actions.showStartNegotiation, false)
    assert.equal(model.matchTypeLabel, 'One Way Matching')
    assert.equal(model.relatedOpportunities[0]?.id, 'offer-1')
  })

  it('non-participant sees read-only with no accept or decline', () => {
    const model = buildMatchDetailReadModel(
      discoveredMatch(),
      baseDeps({ opportunities, currentUserId: 'user-outsider' }),
    )

    assert.equal(model.isParticipant, false)
    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, false)
    assert.equal(model.canAct, true)
    assert.equal(model.relatedOpportunities.length, 2)
    assert.equal(
      resolveMatchDetailContextOpportunityId(discoveredMatch(), 'user-outsider'),
      '__match_detail_neutral__',
    )
  })

  it('confirmed match hides accept and decline and shows start negotiation when allowed', () => {
    const match = discoveredMatch({
      id: 'pm-confirmed',
      status: 'confirmed',
      participants: participants.map((participant) => ({
        ...participant,
        participantStatus: 'accepted',
      })),
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, false)
    assert.equal(model.actions.showStartNegotiation, true)
    assert.equal(model.actions.showViewNegotiation, false)
  })

  it('terminal declined match hides participant actions', () => {
    const match = discoveredMatch({
      id: 'pm-declined',
      status: 'declined',
      participants: participants.map((participant) => ({
        ...participant,
        participantStatus: 'declined',
      })),
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, false)
    assert.equal(model.actions.showStartNegotiation, false)
  })

  it('terminal expired match hides participant actions', () => {
    const match = discoveredMatch({
      id: 'pm-expired',
      status: 'expired',
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, false)
  })

  it('terminal superseded match hides participant actions', () => {
    const match = discoveredMatch({
      id: 'pm-superseded',
      status: 'superseded',
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, false)
  })

  it('accepted participant does not see duplicate accept but may still decline', () => {
    const match = discoveredMatch({
      status: 'accepted',
      participants: [
        { ...participants[0], participantStatus: 'accepted' },
        { ...participants[1], participantStatus: 'pending' },
      ],
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({ opportunities, currentUserId: 'user-need' }),
    )

    assert.equal(model.actions.showAccept, false)
    assert.equal(model.actions.showDecline, true)
    assert.equal(isParticipantOnMatch(match, 'user-need'), true)
  })

  it('shows view negotiation and view deal when linked', () => {
    const match = discoveredMatch({
      id: 'pm-with-deal',
      status: 'confirmed',
      negotiationId: 'neg-1',
      dealId: 'deal-1',
    })

    const model = buildMatchDetailReadModel(
      match,
      baseDeps({
        opportunities,
        negotiations: [
          {
            id: 'neg-1',
            postMatchId: 'pm-with-deal',
            status: 'active',
            participants: [...participants],
          },
        ],
        deals: [
          {
            id: 'deal-1',
            postMatchId: 'pm-with-deal',
            negotiationId: 'neg-1',
            status: 'draft',
            participants: [...participants],
          },
        ],
      }),
    )

    assert.equal(model.actions.showViewNegotiation, true)
    assert.equal(model.actions.negotiationId, 'neg-1')
    assert.equal(model.actions.showViewDeal, true)
    assert.equal(model.actions.dealId, 'deal-1')
    assert.equal(model.actions.showStartNegotiation, false)
  })

  it('resolves factor scores from breakdown and does not fake zero', () => {
    const withFactors = buildMatchDetailReadModel(
      discoveredMatch({
        payload: {
          needOpportunityId: 'need-1',
          offerOpportunityId: 'offer-1',
          breakdown: {
            skillMatch: 0.82,
            timelineFit: 0.7,
            locationFit: 0.9,
          },
        },
      }),
      baseDeps({ opportunities }),
    )
    assert.equal(withFactors.scoreFactors.skillMatch, '82%')
    assert.equal(withFactors.scoreFactors.timelineFit, '70%')
    assert.equal(withFactors.scoreFactors.locationFit, '90%')

    const twoWayMissingFactors = resolveMatchScoreFactors(
      discoveredMatch({
        matchType: 'two_way',
        matchScore: 0.88,
        payload: {
          sideA: { userId: 'A', needId: 'a-need', offerId: 'offer-a' },
          sideB: { userId: 'B', needId: 'b-need', offerId: 'offer-b' },
          scoreAtoB: 0.9,
          scoreBtoA: 0.86,
        },
      }),
    )
    assert.equal(twoWayMissingFactors.skillMatch, '—')
    assert.equal(twoWayMissingFactors.timelineFit, '—')
    assert.equal(twoWayMissingFactors.locationFit, '—')
    assert.equal(twoWayMissingFactors.scoreAtoB, '90%')
    assert.equal(twoWayMissingFactors.scoreBtoA, '86%')
  })
})

describe('buildMatchDetailReadModel — topology per match type', () => {
  const lookup = (id: string) =>
    ({
      'need-1': opportunity('need-1', 'Need One'),
      'offer-1': opportunity('offer-1', 'Offer One', 'offer'),
      'a-need': opportunity('a-need', 'Need A'),
      'b-need': opportunity('b-need', 'Need B'),
      'lead-need': opportunity('lead-need', 'Lead Need'),
      'role-1': opportunity('role-1', 'Architect Offer', 'offer'),
    })[id]

  it('exposes one_way Need → Offer topology', () => {
    const model = buildMatchDetailReadModel(discoveredMatch(), {
      ...baseDeps({
        opportunities: [
          opportunity('need-1', 'Need One'),
          opportunity('offer-1', 'Offer One', 'offer'),
        ],
      }),
      getOpportunity: lookup,
    })
    assert.equal(model.topology.topology, 'one_way')
    assert.equal(model.topology.nodes.length, 2)
    assert.equal(model.topology.edges[0]?.fromId, 'need')
    assert.equal(model.topology.edges[0]?.toId, 'offer')
  })

  it('exposes two_way Need A ↔ Need B topology', () => {
    const model = buildMatchDetailReadModel(
      discoveredMatch({
        matchType: 'two_way',
        payload: {
          sideA: { userId: 'A', needId: 'a-need', offerId: 'offer-a' },
          sideB: { userId: 'B', needId: 'b-need', offerId: 'offer-b' },
        },
      }),
      { ...baseDeps(), getOpportunity: lookup },
    )
    assert.equal(model.topology.topology, 'two_way')
    assert.equal(model.topology.nodes[0]?.subtitle, 'Need A')
    assert.equal(model.topology.nodes[1]?.subtitle, 'Need B')
    assert.equal(model.topology.edges[0]?.bidirectional, true)
  })

  it('exposes consortium Lead + Roles topology', () => {
    const model = buildMatchDetailReadModel(
      discoveredMatch({
        matchType: 'consortium',
        payload: {
          leadNeedId: 'lead-need',
          roles: [{ role: 'Architect', opportunityId: 'role-1', userId: 'm1' }],
        },
      }),
      { ...baseDeps(), getOpportunity: lookup },
    )
    assert.equal(model.topology.topology, 'consortium')
    assert.equal(model.topology.nodes[0]?.kind, 'need')
    assert.equal(model.topology.nodes[1]?.kind, 'offer')
    assert.equal(model.topology.edges[0]?.fromId, 'lead-need')
  })

  it('exposes circular A → B → C → A topology', () => {
    const model = buildMatchDetailReadModel(
      discoveredMatch({
        matchType: 'circular',
        payload: {
          cycle: ['c1', 'c2', 'c3'],
          links: [
            { fromCreatorId: 'c1', toCreatorId: 'c2', needId: 'b-need', offerId: 'offer-a', score: 0.7 },
            { fromCreatorId: 'c2', toCreatorId: 'c3', needId: 'a-need', offerId: 'offer-b', score: 0.7 },
            { fromCreatorId: 'c3', toCreatorId: 'c1', needId: 'need-1', offerId: 'offer-1', score: 0.7 },
          ],
        },
      }),
      {
        ...baseDeps(),
        getOpportunity: lookup,
        getPersonName: (id) => (id === 'c1' ? 'Party A' : id === 'c2' ? 'Party B' : 'Party C'),
      },
    )
    assert.equal(model.topology.topology, 'circular')
    assert.equal(model.topology.nodes.length, 3)
    assert.equal(model.topology.edges.length, 3)
    assert.equal(model.topology.edges[2]?.toId, 'party-0')
  })
})
