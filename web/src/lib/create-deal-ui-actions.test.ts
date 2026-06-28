import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import {
  canShowCreateDealFromNegotiation,
  createDealFromNegotiationUiAction,
} from '@/lib/create-deal-ui-actions.ts'

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

function agreedNegotiation(postMatchId: string): Negotiation {
  return {
    id: 'neg-agreed',
    postMatchId,
    matchId: postMatchId,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [...participants],
    status: 'agreed',
  }
}

function activeNegotiation(postMatchId: string): Negotiation {
  return {
    ...agreedNegotiation(postMatchId),
    id: 'neg-active',
    status: 'active',
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

describe('createDealFromNegotiation UI actions', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [agreedNegotiation('pm-confirmed')],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  function uiDeps() {
    return {
      createDealFromNegotiation: (negotiationId: string) =>
        service.createDealFromNegotiation(negotiationId, {
          gateway: stack.gateway,
          dealRepository: stack.dealRepository,
        }),
      findDealByNegotiationId: () => undefined,
    }
  }

  it('shows Create Deal for agreed PostMatch negotiation', () => {
    assert.equal(
      canShowCreateDealFromNegotiation(agreedNegotiation('pm-confirmed'), {
        findDealByNegotiationId: () => undefined,
      }),
      true,
    )
  })

  it('hides Create Deal for active negotiation', () => {
    assert.equal(
      canShowCreateDealFromNegotiation(activeNegotiation('pm-confirmed')),
      false,
    )
  })

  it('hides Create Deal for countered negotiation', () => {
    assert.equal(
      canShowCreateDealFromNegotiation({
        ...agreedNegotiation('pm-confirmed'),
        status: 'countered',
      }),
      false,
    )
  })

  it('click path calls command service', () => {
    let calledWith: string | null = null
    const result = createDealFromNegotiationUiAction('neg-agreed', {
      ...uiDeps(),
      createDealFromNegotiation: (negotiationId) => {
        calledWith = negotiationId
        return service.createDealFromNegotiation(negotiationId, {
          gateway: stack.gateway,
          dealRepository: stack.dealRepository,
        })
      },
    })

    assert.equal(calledWith, 'neg-agreed')
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.deal.status, 'draft')
      assert.equal(result.deal.postMatchId, 'pm-confirmed')
      assert.equal(result.deal.negotiationId, 'neg-agreed')
    }
  })

  it('creates draft deal, not active', () => {
    const result = createDealFromNegotiationUiAction('neg-agreed', uiDeps())

    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.deal.status, 'draft')
      assert.notEqual(result.deal.status, 'active')
    }
  })

  it('command failure shows error and does not report success', () => {
    const result = createDealFromNegotiationUiAction('neg-agreed', {
      createDealFromNegotiation: () => ({
        result: {
          success: false,
          aggregateId: 'neg-agreed',
          commandType: 'CreateDealFromNegotiation',
          errors: ['Deal can only be created from a confirmed PostMatch'],
        },
        deal: null,
      }),
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.match(result.message, /confirmed PostMatch/i)
    }
  })

  it('no contract created through UI action', () => {
    createDealFromNegotiationUiAction('neg-agreed', uiDeps())
    const contracts = stack.storage.get<unknown[]>('contracts') ?? []
    assert.equal(contracts.length, 0)
  })

  it('application path without postMatchId is rejected', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [applicationNegotiation()],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    assert.equal(
      canShowCreateDealFromNegotiation(applicationNegotiation()),
      true,
    )

    const result = createDealFromNegotiationUiAction('neg-app', {
      createDealFromNegotiation: (negotiationId) =>
        service.createDealFromNegotiation(negotiationId, {
          gateway: stack.gateway,
          dealRepository: stack.dealRepository,
        }),
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.ok(result.message.includes('postMatchId'))
    }
  })
})
