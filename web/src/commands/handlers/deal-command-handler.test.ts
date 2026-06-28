import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Deal, Negotiation, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'

const participants = [
  {
    userId: 'user-need',
    role: 'need_owner',
    opportunityId: 'need-1',
    participantStatus: 'accepted',
  },
  {
    userId: 'user-offer',
    role: 'offer_provider',
    opportunityId: 'offer-1',
    participantStatus: 'accepted',
  },
] as const

function postMatchFixture(
  id: string,
  status: string,
  overrides: Partial<PostMatch> = {},
): PostMatch {
  return {
    id,
    matchType: 'one_way',
    status,
    matchScore: 0.9,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    participants: [...participants],
    payload: {
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      breakdown: { skillMatch: 1 },
    },
    ...overrides,
  }
}

function agreedNegotiationFixture(
  postMatchId: string,
  overrides: Partial<Negotiation> = {},
): Negotiation {
  return {
    id: 'neg-agreed',
    postMatchId,
    matchId: postMatchId,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [...participants],
    status: 'agreed',
    ...overrides,
  }
}

function activeNegotiationFixture(postMatchId: string): Negotiation {
  return agreedNegotiationFixture(postMatchId, {
    id: 'neg-active',
    status: 'active',
  })
}

function existingDealFixture(
  postMatchId: string,
  negotiationId: string,
): Deal {
  return {
    id: 'deal-existing',
    postMatchId,
    matchId: postMatchId,
    negotiationId,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    title: 'Existing deal',
    status: 'draft',
    participants: [...participants],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

describe('CreateDealFromPostMatch', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiationFixture('pm-confirmed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  it('agreed negotiation creates deal', () => {
    const { result, deal } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )

    assert.equal(result.success, true)
    assert.ok(deal)
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.dealId,
      deal?.id,
    )
  })

  it('active negotiation cannot create deal', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-active',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('agreed')))
  })

  it('confirmed PostMatch required', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-accepted', 'accepted')],
      negotiations: [agreedNegotiationFixture('pm-accepted')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-accepted',
      'neg-agreed',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('confirmed')))
  })

  it('declined PostMatch cannot create deal', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-declined', 'declined')],
      negotiations: [agreedNegotiationFixture('pm-declined')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-declined',
      'neg-agreed',
    )

    assert.equal(result.success, false)
  })

  it('expired PostMatch cannot create deal', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-expired', 'expired')],
      negotiations: [agreedNegotiationFixture('pm-expired')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-expired',
      'neg-agreed',
    )

    assert.equal(result.success, false)
  })

  it('superseded PostMatch cannot create deal', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-superseded', 'superseded')],
      negotiations: [agreedNegotiationFixture('pm-superseded')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-superseded',
      'neg-agreed',
    )

    assert.equal(result.success, false)
  })

  it('duplicate deal blocked', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiationFixture('pm-confirmed')],
      deals: [existingDealFixture('pm-confirmed', 'neg-agreed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('already exists')))
    assert.equal(stack.dealRepository.getAll().length, 1)
  })

  it('deal links postMatchId, negotiationId, needOpportunityId, offerOpportunityId', () => {
    const { deal } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )

    assert.ok(deal)
    assert.equal(deal.postMatchId, 'pm-confirmed')
    assert.equal(deal.negotiationId, 'neg-agreed')
    assert.equal(deal.needOpportunityId, 'need-1')
    assert.equal(deal.offerOpportunityId, 'offer-1')
    assert.equal(deal.matchId, 'pm-confirmed')
  })

  it('deal status is draft', () => {
    const { deal } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )

    assert.ok(deal)
    assert.equal(deal.status, 'draft')
  })

  it('no contract created', () => {
    const contractsBefore = stack.storage.get<unknown[]>('contracts') ?? []
    service.createDealFromPostMatch('pm-confirmed', 'neg-agreed')
    const contractsAfter = stack.storage.get<unknown[]>('contracts') ?? []
    assert.equal(contractsAfter.length, contractsBefore.length)
  })

  it('negotiation without postMatchId cannot use CreateDealFromPostMatch', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [
        {
          id: 'neg-app-only',
          opportunityId: 'opp-app',
          applicationId: 'app-1',
          status: 'agreed',
          participants: [{ userId: 'user-applicant', role: 'applicant' }],
        },
      ],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-app-only',
    )

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('postMatchId')),
    )
    assert.equal(stack.dealRepository.getAll().length, 0)
  })
})

describe('CreateDealFromNegotiation', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiationFixture('pm-confirmed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  it('agreed negotiation creates draft deal', () => {
    const { result, deal } = service.createDealFromNegotiation('neg-agreed')

    assert.equal(result.success, true)
    assert.ok(deal)
    assert.equal(deal.status, 'draft')
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.dealId,
      deal?.id,
    )
  })

  it('active negotiation rejected', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-active')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('agreed')))
  })

  it('countered negotiation rejected', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [
        agreedNegotiationFixture('pm-confirmed', { status: 'countered' }),
      ],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-agreed')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('agreed')))
  })

  it('cancelled negotiation rejected', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [
        agreedNegotiationFixture('pm-confirmed', { status: 'cancelled' }),
      ],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-agreed')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('agreed')))
  })

  it('expired negotiation rejected', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [
        agreedNegotiationFixture('pm-confirmed', { status: 'expired' }),
      ],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-agreed')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('agreed')))
  })

  it('duplicate negotiation deal rejected', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiationFixture('pm-confirmed')],
      deals: [existingDealFixture('pm-confirmed', 'neg-agreed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-agreed')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('already exists')))
    assert.equal(stack.dealRepository.getAll().length, 1)
  })

  it('missing negotiation rejected', () => {
    const { result } = service.createDealFromNegotiation('neg-missing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })

  it('persisted deal includes negotiationId postMatchId opportunityIds participants', () => {
    const { deal } = service.createDealFromNegotiation('neg-agreed')

    assert.ok(deal)
    assert.equal(deal.negotiationId, 'neg-agreed')
    assert.equal(deal.postMatchId, 'pm-confirmed')
    assert.equal(deal.needOpportunityId, 'need-1')
    assert.equal(deal.offerOpportunityId, 'offer-1')
    assert.deepEqual(deal.opportunityIds, ['need-1', 'offer-1'])
    assert.ok(deal.participants && deal.participants.length >= 2)
  })

  it('negotiation without postMatchId is rejected', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        {
          id: 'neg-app-only',
          opportunityId: 'opp-app',
          applicationId: 'app-1',
          status: 'agreed',
          participants: [{ userId: 'user-applicant', role: 'applicant' }],
        },
      ],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.createDealFromNegotiation('neg-app-only')

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('postMatchId')),
    )
    assert.equal(stack.dealRepository.getAll().length, 0)
  })
})

describe('TransitionDealStatus', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealCommandService>

  function draftDealFixture(id = 'deal-draft'): Deal {
    return {
      id,
      negotiationId: 'neg-agreed',
      postMatchId: 'pm-confirmed',
      needOpportunityId: 'need-1',
      offerOpportunityId: 'offer-1',
      opportunityId: 'need-1',
      title: 'Draft deal',
      status: 'draft',
      participants: [...participants],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  it('draft to review is allowed', () => {
    const { result, deal } = service.transitionDealStatus('deal-draft', 'review')

    assert.equal(result.success, true)
    assert.equal(deal?.status, 'review')
  })

  it('review to signing is allowed', () => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('deal-review')],
    })
    stack.dealRepository.update('deal-review', { status: 'review' })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result, deal } = service.transitionDealStatus(
      'deal-review',
      'signing',
    )

    assert.equal(result.success, true)
    assert.equal(deal?.status, 'signing')
  })

  it('signing to executing is allowed', () => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('deal-signing')],
    })
    stack.dealRepository.update('deal-signing', { status: 'signing' })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result, deal } = service.transitionDealStatus(
      'deal-signing',
      'executing',
    )

    assert.equal(result.success, true)
    assert.equal(deal?.status, 'executing')
  })

  it('executing to completed is allowed', () => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('deal-exec')],
    })
    stack.dealRepository.update('deal-exec', { status: 'executing' })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result, deal } = service.transitionDealStatus(
      'deal-exec',
      'completed',
    )

    assert.equal(result.success, true)
    assert.equal(deal?.status, 'completed')
  })

  it('draft to executing is rejected', () => {
    const { result } = service.transitionDealStatus('deal-draft', 'executing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not allowed')))
  })

  it('completed deal cannot transition', () => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('deal-done')],
    })
    stack.dealRepository.update('deal-done', { status: 'completed' })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.transitionDealStatus('deal-done', 'review')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })

  it('cancelled deal cannot transition', () => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('deal-cancelled')],
    })
    stack.dealRepository.update('deal-cancelled', { status: 'cancelled' })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const { result } = service.transitionDealStatus(
      'deal-cancelled',
      'review',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })

  it('missing deal fails', () => {
    const { result } = service.transitionDealStatus('deal-missing', 'review')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })

  it('same status is idempotent', () => {
    const { result, deal } = service.transitionDealStatus('deal-draft', 'draft')

    assert.equal(result.success, true)
    assert.equal(deal?.status, 'draft')
  })

  it('persists canonical status only', () => {
    const { deal } = service.transitionDealStatus('deal-draft', 'review')

    assert.equal(deal?.status, 'review')
    assert.notEqual(deal?.status, 'in_review')
  })
})
