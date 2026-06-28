import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createNegotiationCommandService } from '@/services/negotiation-command-service.ts'
import {
  agreeNegotiationUiAction,
  cancelNegotiationUiAction,
  canShowAgreeNegotiation,
  canShowCancelNegotiation,
  canShowNegotiationTransition,
  getNegotiationTransitionOptions,
  transitionNegotiationStatusUiAction,
} from '@/lib/negotiation-ui-actions.ts'

function negotiationFixture(
  status: string,
  overrides: Partial<Negotiation> = {},
): Negotiation {
  return {
    id: 'neg-1',
    postMatchId: 'pm-confirmed',
    matchId: 'pm-confirmed',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [
      { userId: 'user-need', role: 'need_owner', opportunityId: 'need-1' },
      { userId: 'user-offer', role: 'offer_provider', opportunityId: 'offer-1' },
    ],
    status,
    ...overrides,
  }
}

describe('negotiation UI actions', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createNegotiationCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      negotiations: [negotiationFixture('active')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
  })

  function uiDeps() {
    return {
      agreeNegotiation: (negotiationId: string) =>
        service.agreeNegotiation(negotiationId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
      cancelNegotiation: (negotiationId: string) =>
        service.cancelNegotiation(negotiationId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
      readNegotiationStatus: (negotiationId: string) =>
        stack.negotiationRepository.getById(negotiationId)?.status,
      transitionNegotiationStatus: (negotiationId: string, targetStatus: string) =>
        service.transitionNegotiationStatus(negotiationId, targetStatus, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
    }
  }

  it('shows agree and cancel for active negotiation', () => {
    const negotiation = negotiationFixture('active')
    assert.equal(canShowAgreeNegotiation(negotiation), true)
    assert.equal(canShowCancelNegotiation(negotiation), true)
  })

  it('hides agree and cancel for agreed negotiation', () => {
    const negotiation = negotiationFixture('agreed')
    assert.equal(canShowAgreeNegotiation(negotiation), false)
    assert.equal(canShowCancelNegotiation(negotiation), false)
  })

  it('agree calls command service', () => {
    const result = agreeNegotiationUiAction('neg-1', uiDeps())

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.status, 'agreed')
  })

  it('cancel calls command service', () => {
    const result = cancelNegotiationUiAction('neg-1', uiDeps())

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.status, 'cancelled')
  })

  it('surfaces agree command failure', () => {
    const result = agreeNegotiationUiAction('neg-missing', uiDeps())

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.includes('not found'))
  })

  it('surfaces cancel command failure for terminal negotiation', () => {
    stack = createCommandGatewayTestStack({
      negotiations: [negotiationFixture('agreed')],
    })
    service = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })

    const result = cancelNegotiationUiAction('neg-1', {
      cancelNegotiation: (negotiationId) =>
        service.cancelNegotiation(negotiationId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.length > 0)
  })

  it('lists counter-proposal transitions for active negotiation', () => {
    const options = getNegotiationTransitionOptions(negotiationFixture('active'))
    assert.deepEqual(
      options.map((option) => option.targetStatus).sort(),
      ['countered', 'expired'],
    )
    assert.equal(canShowNegotiationTransition(negotiationFixture('active'), 'countered'), true)
    assert.equal(canShowNegotiationTransition(negotiationFixture('active'), 'agreed'), false)
  })

  it('lists accept-updated transition for countered negotiation', () => {
    const options = getNegotiationTransitionOptions(negotiationFixture('countered'))
    assert.deepEqual(
      options.map((option) => option.targetStatus).sort(),
      ['active', 'expired'],
    )
  })

  it('transition calls command service', () => {
    const result = transitionNegotiationStatusUiAction(
      'neg-1',
      'countered',
      uiDeps(),
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.status, 'countered')
  })

  it('surfaces invalid transition failure', () => {
    const result = transitionNegotiationStatusUiAction(
      'neg-1',
      'draft',
      uiDeps(),
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.includes('not allowed'))
  })

  it('surfaces missing negotiation failure', () => {
    const result = transitionNegotiationStatusUiAction(
      'neg-missing',
      'countered',
      uiDeps(),
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.includes('not found'))
  })
})
