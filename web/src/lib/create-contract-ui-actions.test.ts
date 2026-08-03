import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { canCreateContractFromDeal } from '@/lib/deal-detail-read-model.ts'
import { createContractFromDealUiAction } from '@/lib/create-contract-ui-actions.ts'
import { createContractCommandService } from '@/services/contract-command-service.ts'
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

function postMatchFixture(id: string): PostMatch {
  return {
    id,
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

function opportunityFixtures(): Opportunity[] {
  return [
    { id: 'need-1', title: 'Need', status: 'negotiating', intent: 'need' },
    { id: 'offer-1', title: 'Offer', status: 'published', intent: 'offer' },
  ]
}

describe('createContractFromDeal UI actions', () => {
  let stack: CommandGatewayTestStack
  let dealId: string
  let contractService: ReturnType<typeof createContractCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed')],
      negotiations: [agreedNegotiation('pm-confirmed')],
      opportunities: opportunityFixtures(),
    })

    const dealService = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
    const { deal } = dealService.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )
    assert.ok(deal)
    dealId = deal.id

    contractService = createContractCommandService({
      gateway: stack.gateway,
      contractRepository: stack.contractRepository,
    })
  })

  function uiDeps() {
    return {
      createContractFromDeal: (id: string) =>
        contractService.createContractFromDeal(id),
    }
  }

  it('create contract button visible for eligible deal', () => {
    const deal = stack.dealRepository.getById(dealId)
    assert.equal(
      canCreateContractFromDeal(deal, stack.contractRepository.findByDealId(dealId)),
      true,
    )
  })

  it('hidden when existing non-terminal contract exists', () => {
    contractService.createContractFromDeal(dealId)
    const deal = stack.dealRepository.getById(dealId)
    assert.equal(
      canCreateContractFromDeal(deal, stack.contractRepository.findByDealId(dealId)),
      false,
    )
  })

  it('hidden for completed deal', () => {
    stack.dealRepository.update(dealId, { status: 'completed' })
    const deal = stack.dealRepository.getById(dealId)
    assert.equal(canCreateContractFromDeal(deal, []), false)
  })

  it('click creates draft contract', () => {
    const result = createContractFromDealUiAction(dealId, uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'draft')
      assert.equal(result.contract.dealId, dealId)
    }
  })

  it('command failure shows error', () => {
    contractService.createContractFromDeal(dealId)
    const result = createContractFromDealUiAction(dealId, uiDeps())
    assert.equal(result.success, false)
    if (!result.success) {
      assert.match(result.message, /already exists/i)
    }
  })

  it('no deal status change', () => {
    const before = stack.dealRepository.getById(dealId)
    assert.ok(before)
    createContractFromDealUiAction(dealId, uiDeps())
    const after = stack.dealRepository.getById(dealId)
    assert.ok(after)
    assert.equal(after.status, before.status)
  })

  it('no opportunity status change', () => {
    const needBefore = stack.opportunityRepository.getById('need-1')
    const offerBefore = stack.opportunityRepository.getById('offer-1')
    assert.ok(needBefore)
    assert.ok(offerBefore)

    createContractFromDealUiAction(dealId, uiDeps())

    const needAfter = stack.opportunityRepository.getById('need-1')
    const offerAfter = stack.opportunityRepository.getById('offer-1')
    assert.ok(needAfter)
    assert.ok(offerAfter)
    assert.equal(needAfter.status, needBefore.status)
    assert.equal(offerAfter.status, offerBefore.status)
  })

  it('no signing or activation happens', () => {
    const result = createContractFromDealUiAction(dealId, uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'draft')
      assert.notEqual(result.contract.status, 'active')
      assert.notEqual(result.contract.status, 'pending_signature')
      assert.ok(
        result.contract.participants.every(
          (participant) => !participant.signedAt,
        ),
      )
    }
  })
})
