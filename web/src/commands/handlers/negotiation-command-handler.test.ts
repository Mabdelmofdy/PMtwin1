import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createNegotiationCommandService } from '@/services/negotiation-command-service.ts'

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

function activeNegotiationFixture(
  postMatchId: string,
  overrides: Partial<Negotiation> = {},
): Negotiation {
  return {
    id: 'neg-existing',
    postMatchId,
    matchId: postMatchId,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [...participants],
    status: 'active',
    ...overrides,
  }
}

describe('StartNegotiationFromPostMatch', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createNegotiationCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
  })

  it('confirmed PostMatch can start negotiation', () => {
    const { result, negotiation } = service.startNegotiationFromPostMatch(
      'pm-confirmed',
    )

    assert.equal(result.success, true)
    assert.ok(negotiation)
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.negotiationId,
      negotiation?.id,
    )
  })

  it('discovered PostMatch cannot start negotiation', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-discovered', 'discovered')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-discovered')

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('confirmed')),
    )
  })

  it('accepted PostMatch cannot start negotiation', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-accepted', 'accepted')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-accepted')

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('confirmed')),
    )
  })

  it('declined PostMatch cannot start negotiation', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-declined', 'declined')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-declined')

    assert.equal(result.success, false)
  })

  it('expired PostMatch cannot start negotiation', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-expired', 'expired')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-expired')

    assert.equal(result.success, false)
  })

  it('superseded PostMatch cannot start negotiation', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-superseded', 'superseded')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-superseded')

    assert.equal(result.success, false)
  })

  it('duplicate active negotiation is blocked', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.startNegotiationFromPostMatch('pm-confirmed')

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('Active negotiation')),
    )
    assert.equal(stack.negotiationRepository.getAll().length, 1)
  })

  it('created negotiation includes postMatchId, needOpportunityId, offerOpportunityId', () => {
    const { negotiation } = service.startNegotiationFromPostMatch('pm-confirmed')

    assert.ok(negotiation)
    assert.equal(negotiation.postMatchId, 'pm-confirmed')
    assert.equal(negotiation.needOpportunityId, 'need-1')
    assert.equal(negotiation.offerOpportunityId, 'offer-1')
    assert.equal(negotiation.matchId, 'pm-confirmed')
  })

  it('negotiation status is active', () => {
    const { negotiation } = service.startNegotiationFromPostMatch('pm-confirmed')

    assert.ok(negotiation)
    assert.equal(negotiation.status, 'active')
  })

  it('no deal is created', () => {
    const dealsBefore = stack.dealRepository.getAll().length
    service.startNegotiationFromPostMatch('pm-confirmed')
    assert.equal(stack.dealRepository.getAll().length, dealsBefore)
  })

  it('created negotiation includes participants from PostMatch', () => {
    const { negotiation } = service.startNegotiationFromPostMatch('pm-confirmed')

    assert.ok(negotiation?.participants)
    assert.equal(negotiation.participants.length, 2)
    assert.ok(
      negotiation.participants.some((participant) => participant.userId === 'user-need'),
    )
    assert.ok(
      negotiation.participants.some((participant) => participant.userId === 'user-offer'),
    )
  })
})

describe('AgreeNegotiation', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createNegotiationCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
  })

  it('active negotiation can agree', () => {
    const { result, negotiation } = service.agreeNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'agreed')
  })

  it('countered negotiation can agree', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'countered' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.agreeNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'agreed')
  })

  it('already agreed negotiation is idempotent', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'agreed' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.agreeNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'agreed')
  })

  it('cancelled negotiation cannot agree', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'cancelled' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.agreeNegotiation('neg-existing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })

  it('missing negotiation fails', () => {
    const { result } = service.agreeNegotiation('neg-missing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })

  it('deduplicates AgreeNegotiation commands using the idempotency store', () => {
    const first = service.agreeNegotiation('neg-existing')
    assert.equal(first.result.success, true)

    const second = service.agreeNegotiation('neg-existing')
    assert.equal(second.result.success, true)
    assert.equal(
      stack.negotiationRepository.getById('neg-existing')?.status,
      'agreed',
    )
  })
})

describe('CancelNegotiation', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createNegotiationCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
  })

  it('active negotiation can cancel', () => {
    const { result, negotiation } = service.cancelNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'cancelled')
  })

  it('countered negotiation can cancel', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'countered' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.cancelNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'cancelled')
  })

  it('already cancelled negotiation is idempotent', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'cancelled' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.cancelNegotiation('neg-existing')

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'cancelled')
  })

  it('agreed negotiation cannot cancel', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'agreed' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.cancelNegotiation('neg-existing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })

  it('missing negotiation fails', () => {
    const { result } = service.cancelNegotiation('neg-missing')

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })
})

describe('TransitionNegotiationStatus', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createNegotiationCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
  })

  it('active to countered succeeds', () => {
    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'countered',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'countered')
  })

  it('countered to active succeeds', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'countered' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'active',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'active')
  })

  it('active to agreed succeeds', () => {
    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'agreed',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'agreed')
  })

  it('countered to agreed succeeds', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'countered' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'agreed',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'agreed')
  })

  it('active to expired succeeds', () => {
    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'expired',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'expired')
  })

  it('rejects invalid transition', () => {
    const { result } = service.transitionNegotiationStatus(
      'neg-existing',
      'draft',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not allowed')))
  })

  it('rejects transition from terminal state', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        activeNegotiationFixture('pm-confirmed', { status: 'agreed' }),
      ],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const { result } = service.transitionNegotiationStatus(
      'neg-existing',
      'active',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })

  it('missing negotiation fails', () => {
    const { result } = service.transitionNegotiationStatus(
      'neg-missing',
      'countered',
    )

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not found')))
  })

  it('same status is idempotent', () => {
    const { result, negotiation } = service.transitionNegotiationStatus(
      'neg-existing',
      'active',
    )

    assert.equal(result.success, true)
    assert.equal(negotiation?.status, 'active')
  })
})
