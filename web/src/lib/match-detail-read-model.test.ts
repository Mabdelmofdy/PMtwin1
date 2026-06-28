import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  buildMatchDetailReadModel,
  isParticipantOnMatch,
  resolveMatchDetailContextOpportunityId,
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
    assert.equal(model.matchTypeLabel, 'One-way')
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
})
