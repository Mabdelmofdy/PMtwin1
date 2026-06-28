import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import { createDealService } from '@/services/deal-service.ts'

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

function postMatchFixture(id: string, status: string): PostMatch {
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
  }
}

function agreedNegotiation(
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

function applicationNegotiation(): Negotiation {
  return {
    id: 'neg-app',
    opportunityId: 'opp-app',
    applicationId: 'app-1',
    status: 'agreed',
    participants: [{ userId: 'user-applicant', role: 'applicant' }],
  }
}

function buildService(stack: CommandGatewayTestStack) {
  const commandService = createDealCommandService({
    gateway: stack.gateway,
    dealRepository: stack.dealRepository,
  })
  return createDealService({
    negotiationRepository: stack.negotiationRepository,
    dealRepository: stack.dealRepository,
    dealCommandService: commandService,
    dealCommandServiceDeps: {
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    },
  })
}

describe('dealService.createDealFromNegotiation legacy path guard', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiation('pm-confirmed')],
    })
    service = buildService(stack)
  })

  it('with postMatchId delegates to CreateDealFromNegotiation command path', () => {
    const deal = service.createDealFromNegotiation('neg-agreed')

    assert.ok(deal)
    assert.equal(deal.postMatchId, 'pm-confirmed')
    assert.equal(deal.negotiationId, 'neg-agreed')
    assert.equal(deal.needOpportunityId, 'need-1')
    assert.equal(deal.offerOpportunityId, 'offer-1')
    assert.equal(
      stack.postMatchRepository.getById('pm-confirmed')?.dealId,
      deal.id,
    )
  })

  it('PostMatch path creates draft deal, not active', () => {
    const deal = service.createDealFromNegotiation('neg-agreed')

    assert.ok(deal)
    assert.equal(deal.status, 'draft')
    assert.notEqual(deal.status, 'active')
  })

  it('without postMatchId rejects deal creation', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [applicationNegotiation()],
    })
    service = buildService(stack)

    assert.throws(
      () => service.createDealFromNegotiation('neg-app'),
      (error: Error) => error.message.includes('postMatchId'),
    )
    assert.equal(stack.dealRepository.getAll().length, 0)
  })

  it('command failure is not swallowed', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-accepted', 'accepted')],
      negotiations: [agreedNegotiation('pm-accepted')],
    })
    service = buildService(stack)

    assert.throws(
      () => service.createDealFromNegotiation('neg-agreed'),
      (error: Error) => error.message.includes('confirmed'),
    )
    assert.equal(stack.dealRepository.getAll().length, 0)
  })

  it('application/manual path without postMatchId rejects', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [
        {
          id: 'neg-match-only',
          opportunityId: 'opp-1',
          status: 'agreed',
          participants: [{ userId: 'user-1', role: 'owner' }],
        },
      ],
    })
    service = buildService(stack)

    assert.throws(
      () => service.createDealFromNegotiation('neg-match-only'),
      (error: Error) => error.message.includes('postMatchId'),
    )
    assert.equal(stack.dealRepository.getAll().length, 0)
  })

  it('returns existing deal without re-running command', () => {
    const first = service.createDealFromNegotiation('neg-agreed')
    const second = service.createDealFromNegotiation('neg-agreed')

    assert.ok(first)
    assert.equal(second?.id, first?.id)
    assert.equal(stack.dealRepository.getAll().length, 1)
  })
})
