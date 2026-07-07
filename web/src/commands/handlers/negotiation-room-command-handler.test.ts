import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, PlatformUser } from '@/types/domain.ts'
import type { CommercialTerms } from '@/types/commercial-terms.ts'
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

const auditorUser: PlatformUser = {
  id: 'user-auditor',
  role: 'auditor',
  status: 'active',
  profile: { type: 'individual', name: 'Auditor' },
}

function activeNegotiation(overrides: Partial<Negotiation> = {}): Negotiation {
  return {
    id: 'neg-room-1',
    postMatchId: 'pm-1',
    matchId: 'pm-1',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [...participants],
    status: 'active',
    commercialTerms: {
      exchangeMode: 'cash',
      currency: 'SAR',
      budget: 10000,
      paymentSchedule: 'Milestone',
      amount: 10000,
    },
    ...overrides,
  }
}

function cashTerms(amount = 12000): CommercialTerms {
  return {
    exchangeMode: 'cash',
    currency: 'SAR',
    budget: amount,
    paymentSchedule: 'Milestone',
    amount,
  }
}

function executeRoom(
  stack: CommandGatewayTestStack,
  command: Record<string, unknown>,
) {
  return stack.gateway.execute(command as never)
}

describe('Negotiation room commands', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      negotiations: [activeNegotiation()],
      postMatches: [
        {
          id: 'pm-1',
          matchType: 'one_way',
          status: 'confirmed',
          matchScore: 0.9,
          needOpportunityId: 'need-1',
          offerOpportunityId: 'offer-1',
          participants: [...participants],
          payload: {
            needOpportunityId: 'need-1',
            offerOpportunityId: 'offer-1',
            breakdown: { skillMatch: 1 },
          },
        },
      ],
      users: [auditorUser],
    })
  })

  it('participant can send message', () => {
    const result = executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-1',
      userId: 'user-need',
      body: 'Hello from need owner',
    })

    assert.equal(result.success, true)
    const messages = stack.negotiationMessageRepository.getByNegotiationId('neg-room-1')
    assert.equal(messages.length, 1)
    assert.equal(messages[0]?.body, 'Hello from need owner')
  })

  it('auditor cannot send message', () => {
    const result = executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-2',
      userId: 'user-auditor',
      body: 'Auditor note',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) => error.includes('read-only')),
    )
  })

  it('message creates transcript event', () => {
    executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-3',
      userId: 'user-offer',
      body: 'Offer discussion',
    })

    const events = stack.negotiationTranscriptRepository.getByNegotiationId('neg-room-1')
    assert.ok(events.some((event) => event.eventType === 'message.sent'))
  })

  it('messages blocked after agreed', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [activeNegotiation({ status: 'agreed' })],
      users: [auditorUser],
    })

    const result = executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-4',
      userId: 'user-need',
      body: 'Too late',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('read-only')))
  })

  it('submit initial offer', () => {
    const result = executeRoom(stack, {
      commandType: 'SubmitNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-5',
      userId: 'user-offer',
      terms: cashTerms(),
    })

    assert.equal(result.success, true)
    const offers = stack.negotiationOfferRepository.getByNegotiationId('neg-room-1')
    assert.equal(offers.length, 1)
    assert.equal(offers[0]?.version, 1)
    assert.equal(offers[0]?.status, 'submitted')
  })

  it('submit counter offer increments version and supersedes prior offer', () => {
    executeRoom(stack, {
      commandType: 'SubmitNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-6',
      userId: 'user-offer',
      terms: cashTerms(10000),
    })

    const counter = executeRoom(stack, {
      commandType: 'SubmitNegotiationCounterOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-7',
      userId: 'user-need',
      terms: cashTerms(15000),
    })

    assert.equal(counter.success, true)
    const offers = stack.negotiationOfferRepository.getByNegotiationId('neg-room-1')
    assert.equal(offers.length, 2)
    assert.equal(offers[0]?.status, 'superseded')
    assert.equal(offers[1]?.version, 2)
    assert.equal(offers[1]?.status, 'submitted')
  })

  it('accept offer sets negotiation agreed', () => {
    executeRoom(stack, {
      commandType: 'SubmitNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-8',
      userId: 'user-offer',
      terms: cashTerms(),
    })
    const offer = stack.negotiationOfferRepository.getByNegotiationId('neg-room-1')[0]

    const result = executeRoom(stack, {
      commandType: 'AcceptNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-9',
      userId: 'user-need',
      offerId: offer?.id,
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.negotiationRepository.getById('neg-room-1')?.status,
      'agreed',
    )
    assert.equal(
      stack.negotiationOfferRepository.getById(offer?.id ?? '')?.status,
      'accepted',
    )
  })

  it('create deal only from accepted/agreed offer', () => {
    executeRoom(stack, {
      commandType: 'SubmitNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-10',
      userId: 'user-offer',
      terms: cashTerms(),
    })
    const offer = stack.negotiationOfferRepository.getByNegotiationId('neg-room-1')[0]

    const dealService = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
      negotiationRepository: stack.negotiationRepository,
    })

    const blocked = dealService.createDealFromNegotiation('neg-room-1')
    assert.equal(blocked.result.success, false)

    executeRoom(stack, {
      commandType: 'AcceptNegotiationOffer',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-11',
      userId: 'user-need',
      offerId: offer?.id,
    })

    const created = dealService.createDealFromNegotiation('neg-room-1')
    assert.equal(created.result.success, true)
    assert.ok(created.deal?.id)
  })

  it('transcript events are append-only', () => {
    executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-12',
      userId: 'user-need',
      body: 'First',
    })
    executeRoom(stack, {
      commandType: 'SendNegotiationMessage',
      aggregateId: 'neg-room-1',
      clientRequestId: 'req-13',
      userId: 'user-offer',
      body: 'Second',
    })

    const events = stack.negotiationTranscriptRepository.getByNegotiationId('neg-room-1')
    assert.equal(events.length, 2)
    assert.equal(events[0]?.summary, 'Negotiation message sent')
  })
})
