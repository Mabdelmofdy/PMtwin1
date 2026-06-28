import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Deal } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import {
  canShowDealTransition,
  listDealTransitionOptions,
  transitionDealStatusUiAction,
} from '@/lib/deal-transition-ui-actions.ts'

function draftDealFixture(id = 'deal-draft'): Deal {
  const now = new Date().toISOString()
  return {
    id,
    negotiationId: 'neg-agreed',
    postMatchId: 'pm-confirmed',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    title: 'Draft deal',
    status: 'draft',
    participants: [
      { userId: 'user-need', role: 'need_owner', opportunityId: 'need-1' },
      { userId: 'user-offer', role: 'offer_provider', opportunityId: 'offer-1' },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

describe('deal transition UI actions', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createDealCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
    })
    service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  function uiDeps() {
    return {
      transitionDealStatus: (dealId: string, targetStatus: string) =>
        service.transitionDealStatus(dealId, targetStatus, {
          gateway: stack.gateway,
          dealRepository: stack.dealRepository,
        }),
      readDealStatus: (dealId: string) =>
        stack.dealRepository.getById(dealId)?.status,
    }
  }

  it('lists FSM-allowed transitions for draft deal', () => {
    const options = listDealTransitionOptions(draftDealFixture())
    assert.deepEqual(
      options.map((option) => option.targetStatus).sort(),
      ['cancelled', 'review'],
    )
    assert.equal(canShowDealTransition(draftDealFixture(), 'review'), true)
    assert.equal(canShowDealTransition(draftDealFixture(), 'executing'), false)
  })

  it('calls command service for valid transition', () => {
    const result = transitionDealStatusUiAction('deal-draft', 'review', uiDeps())

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.status, 'review')
  })

  it('surfaces invalid transition failure', () => {
    const result = transitionDealStatusUiAction(
      'deal-draft',
      'executing',
      uiDeps(),
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.includes('not allowed'))
  })

  it('surfaces missing deal failure', () => {
    const result = transitionDealStatusUiAction('deal-missing', 'review', uiDeps())

    assert.equal(result.success, false)
    if (result.success) return
    assert.ok(result.message.includes('not found'))
  })
})
