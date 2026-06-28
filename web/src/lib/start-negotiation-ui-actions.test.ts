import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createNegotiationCommandService } from '@/services/negotiation-command-service.ts'
import {
  canShowStartNegotiationFromPostMatch,
  startNegotiationFromPostMatchUiAction,
} from '@/lib/start-negotiation-ui-actions.ts'

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

function activeNegotiationFixture(postMatchId: string): Negotiation {
  return {
    id: 'neg-active',
    postMatchId,
    matchId: postMatchId,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    participants: [...participants],
    status: 'active',
  }
}

describe('startNegotiation UI actions', () => {
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

  function uiDeps() {
    return {
      startNegotiationFromPostMatch: (postMatchId: string) =>
        service.startNegotiationFromPostMatch(postMatchId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
      getNegotiationsForPostMatch: (postMatchId: string) =>
        stack.negotiationRepository.getByPostMatchId(postMatchId),
    }
  }

  it('shows start action for confirmed PostMatch without blocking negotiation', () => {
    const match = postMatchFixture('pm-confirmed', 'confirmed')
    assert.equal(canShowStartNegotiationFromPostMatch(match, uiDeps()), true)
  })

  it('hides start action when active negotiation exists', () => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed', 'confirmed')],
      negotiations: [activeNegotiationFixture('pm-confirmed')],
    })
    const match = postMatchFixture('pm-confirmed', 'confirmed')
    assert.equal(
      canShowStartNegotiationFromPostMatch(match, {
        getNegotiationsForPostMatch: (id) =>
          stack.negotiationRepository.getByPostMatchId(id),
      }),
      false,
    )
  })

  it('calls command service and returns negotiation id', () => {
    const result = startNegotiationFromPostMatchUiAction(
      'pm-confirmed',
      uiDeps(),
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.ok(result.negotiationId)
    assert.equal(
      stack.negotiationRepository.getById(result.negotiationId)?.status,
      'active',
    )
  })

  it('surfaces command failure', () => {
    const result = startNegotiationFromPostMatchUiAction('pm-discovered', {
      startNegotiationFromPostMatch: (postMatchId) =>
        service.startNegotiationFromPostMatch(postMatchId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
    })

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.length > 0)
  })
})
