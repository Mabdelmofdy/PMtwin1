import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import { collectPostMatchOpportunityIds } from '@/domain/normalized/post-match-strong-key.ts'
import {
  buildOpportunityMatchesReadModel,
  OPPORTUNITY_MATCHES_EMPTY_MESSAGE,
} from '@/lib/opportunity-matches-read-model.ts'

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
  matches: PostMatch[],
  options: {
    opportunities?: Opportunity[]
    negotiations?: Negotiation[]
    deals?: Deal[]
    currentUserId?: string
  } = {},
) {
  const opportunityMap = Object.fromEntries(
    (options.opportunities ?? []).map((opp) => [opp.id, opp]),
  )
  const negotiations = options.negotiations ?? []
  const deals = options.deals ?? []

  return {
    getPostMatchesByOpportunity: (opportunityId: string) =>
      matches.filter((match) =>
        collectPostMatchOpportunityIds(match).includes(opportunityId),
      ),
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
  }
}

describe('buildOpportunityMatchesReadModel', () => {
  it('returns empty state when no matches exist', () => {
    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([], {
        opportunities: [opportunity('need-1', 'Need')],
      }),
    )

    assert.equal(model.isEmpty, true)
    assert.equal(model.emptyMessage, OPPORTUNITY_MATCHES_EMPTY_MESSAGE)
    assert.equal(model.matchesArePrimaryFlow, true)
  })

  it('discovered match shows accept and decline for pending participant', () => {
    const match: PostMatch = {
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
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [
          opportunity('need-1', 'Need'),
          opportunity('offer-1', 'Offer', 'offer'),
        ],
        currentUserId: 'user-need',
      }),
    )

    assert.equal(model.matches.length, 1)
    const card = model.matches[0]!
    assert.equal(card.actions.showAccept, true)
    assert.equal(card.actions.showDecline, true)
    assert.equal(card.actions.showStartNegotiation, false)
    assert.equal(card.matchTypeLabel, 'One Way Matching')
    assert.equal(card.relatedOpportunities[0]?.id, 'offer-1')
  })

  it('confirmed match shows start negotiation when allowed', () => {
    const match: PostMatch = {
      id: 'pm-confirmed',
      matchType: 'one_way',
      status: 'confirmed',
      matchScore: 0.88,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: participants.map((participant) => ({
        ...participant,
        participantStatus: 'accepted',
      })),
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [
          opportunity('need-1', 'Need'),
          opportunity('offer-1', 'Offer', 'offer'),
        ],
      }),
    )

    const card = model.matches[0]!
    assert.equal(card.actions.showAccept, false)
    assert.equal(card.actions.showDecline, false)
    assert.equal(card.actions.showStartNegotiation, true)
    assert.equal(card.actions.showViewNegotiation, false)
  })

  it('confirmed match shows view negotiation when negotiation exists', () => {
    const match: PostMatch = {
      id: 'pm-confirmed',
      matchType: 'one_way',
      status: 'confirmed',
      matchScore: 0.88,
      negotiationId: 'neg-1',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [...participants],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [opportunity('need-1', 'Need'), opportunity('offer-1', 'Offer', 'offer')],
        negotiations: [
          {
            id: 'neg-1',
            postMatchId: 'pm-confirmed',
            status: 'active',
            participants: [...participants],
          },
        ],
      }),
    )

    const card = model.matches[0]!
    assert.equal(card.actions.showStartNegotiation, false)
    assert.equal(card.actions.showViewNegotiation, true)
    assert.equal(card.actions.negotiationId, 'neg-1')
    assert.equal(card.actions.showCreateDeal, false)
  })

  it('agreed negotiation shows create deal when no deal exists', () => {
    const match: PostMatch = {
      id: 'pm-confirmed',
      matchType: 'one_way',
      status: 'confirmed',
      matchScore: 0.88,
      negotiationId: 'neg-agreed',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [...participants],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [opportunity('need-1', 'Need'), opportunity('offer-1', 'Offer', 'offer')],
        negotiations: [
          {
            id: 'neg-agreed',
            postMatchId: 'pm-confirmed',
            status: 'agreed',
            participants: [...participants],
          },
        ],
      }),
    )

    const card = model.matches[0]!
    assert.equal(card.actions.showCreateDeal, true)
    assert.equal(card.actions.showViewDeal, false)
  })

  it('terminal declined match hides accept and decline actions', () => {
    const match: PostMatch = {
      id: 'pm-declined',
      matchType: 'one_way',
      status: 'declined',
      matchScore: 0.5,
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: participants.map((participant) => ({
        ...participant,
        participantStatus: 'declined',
      })),
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [opportunity('need-1', 'Need'), opportunity('offer-1', 'Offer', 'offer')],
      }),
    )

    const card = model.matches[0]!
    assert.equal(card.actions.showAccept, false)
    assert.equal(card.actions.showDecline, false)
    assert.equal(card.actions.showStartNegotiation, false)
    assert.equal(card.actions.showViewDetails, true)
  })

  it('shows view deal when deal exists for post match', () => {
    const match: PostMatch = {
      id: 'pm-with-deal',
      matchType: 'one_way',
      status: 'confirmed',
      matchScore: 0.92,
      dealId: 'deal-1',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      participants: [...participants],
      payload: {
        needOpportunityId: 'need-1',
        offerOpportunityId: 'offer-1',
      },
    }

    const model = buildOpportunityMatchesReadModel(
      'need-1',
      baseDeps([match], {
        opportunities: [opportunity('need-1', 'Need'), opportunity('offer-1', 'Offer', 'offer')],
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

    const card = model.matches[0]!
    assert.equal(card.actions.showViewDeal, true)
    assert.equal(card.actions.dealId, 'deal-1')
  })

  it('marks post-match flow as primary over applications', () => {
    const model = buildOpportunityMatchesReadModel('need-1', baseDeps([]))
    assert.equal(model.matchesArePrimaryFlow, true)
  })
})
