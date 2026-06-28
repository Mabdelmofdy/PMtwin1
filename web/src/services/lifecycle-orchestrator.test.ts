import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { allowedTransitions, toCanonical } from '@pm-twin/lifecycle'
import type { Contract, Deal, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { resolveDealSyncTarget } from '@/services/contract-deal-sync-rules.ts'
import { resolveOpportunitySyncTarget } from '@/services/deal-opportunity-sync-rules.ts'
import { createLifecycleOrchestrator } from '@/services/lifecycle-orchestrator.ts'

const participants = [
  {
    userId: 'user-need',
    role: 'need_owner',
    opportunityId: 'need-1',
    participantStatus: 'accepted',
  },
] as const

function draftDealFixture(status = 'draft'): Deal {
  const now = new Date().toISOString()
  return {
    id: 'deal-draft-1',
    negotiationId: 'neg-1',
    postMatchId: 'pm-1',
    matchId: 'pm-1',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    title: 'Deal – pm-1',
    status,
    participants: [...participants],
    createdAt: now,
    updatedAt: now,
  }
}

function opportunityFixtures(): Opportunity[] {
  return [
    {
      id: 'need-1',
      title: 'Need opportunity',
      status: 'negotiating',
      intent: 'need',
    },
    {
      id: 'offer-1',
      title: 'Offer opportunity',
      status: 'contracted',
      intent: 'offer',
    },
  ]
}

function postMatchFixture(): PostMatch {
  const now = new Date().toISOString()
  return {
    id: 'pm-1',
    matchType: 'two_way',
    status: 'confirmed',
    matchScore: 0.9,
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    participants: [...participants],
    createdAt: now,
    updatedAt: now,
  }
}
function contractFixture(
  status: Contract['status'],
  dealId = 'deal-draft-1',
): Contract {
  const now = new Date().toISOString()
  return {
    id: 'contract-1',
    dealId,
    participants: [...participants],
    status,
    createdAt: now,
    updatedAt: now,
  }
}

describe('deal-opportunity sync rules', () => {
  it('maps deal executing to opportunity executing', () => {
    assert.equal(resolveOpportunitySyncTarget('executing'), 'executing')
  })

  it('maps deal completed to opportunity completed', () => {
    assert.equal(resolveOpportunitySyncTarget('completed'), 'completed')
  })

  it('maps deal cancelled to opportunity cancelled', () => {
    assert.equal(resolveOpportunitySyncTarget('cancelled'), 'cancelled')
  })

  it('does not map draft review or signing', () => {
    assert.equal(resolveOpportunitySyncTarget('draft'), null)
    assert.equal(resolveOpportunitySyncTarget('review'), null)
    assert.equal(resolveOpportunitySyncTarget('signing'), null)
  })
})

describe('contract-deal sync rules', () => {
  it('maps contract active to deal executing', () => {
    assert.equal(resolveDealSyncTarget('active'), 'executing')
  })

  it('maps contract completed to deal completed', () => {
    assert.equal(resolveDealSyncTarget('completed'), 'completed')
  })

  it('maps contract terminated to deal cancelled', () => {
    assert.equal(resolveDealSyncTarget('terminated'), 'cancelled')
  })

  it('does not map draft or pending_signature', () => {
    assert.equal(resolveDealSyncTarget('draft'), null)
    assert.equal(resolveDealSyncTarget('pending_signature'), null)
    assert.equal(resolveDealSyncTarget('pending'), null)
  })
})

describe('LifecycleOrchestrator contract → deal sync', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
    })
  })

  function orchestrator() {
    return createLifecycleOrchestrator({
      dealRepository: stack.dealRepository,
    })
  }

  it('syncs deal to executing when contract becomes active', () => {
    const result = orchestrator().syncDealFromContract(
      contractFixture('active'),
    )
    assert.equal(result.synced, true)
    assert.deepEqual(result.appliedStatuses, [
      'review',
      'signing',
      'executing',
    ])

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.ok(deal)
    assert.equal(toCanonical('deal', deal.status), 'executing')
  })

  it('syncs deal to completed when contract becomes completed', () => {
    stack.dealRepository.update('deal-draft-1', { status: 'executing' })

    const result = orchestrator().syncDealFromContract(
      contractFixture('completed'),
    )
    assert.equal(result.synced, true)
    assert.deepEqual(result.appliedStatuses, ['completed'])

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.equal(toCanonical('deal', deal?.status), 'completed')
  })

  it('syncs deal to cancelled when contract becomes terminated', () => {
    const result = orchestrator().syncDealFromContract(
      contractFixture('terminated'),
    )
    assert.equal(result.synced, true)
    assert.deepEqual(result.appliedStatuses, ['cancelled'])

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.equal(toCanonical('deal', deal?.status), 'cancelled')
  })

  it('skips sync for draft contract', () => {
    const result = orchestrator().syncDealFromContract(
      contractFixture('draft'),
    )
    assert.equal(result.skipped, true)
    assert.equal(result.synced, false)

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.equal(deal?.status, 'draft')
  })

  it('skips when deal already at target status', () => {
    stack.dealRepository.update('deal-draft-1', { status: 'executing' })

    const result = orchestrator().syncDealFromContract(
      contractFixture('active'),
    )
    assert.equal(result.skipped, true)
    assert.equal(result.synced, false)
    assert.deepEqual(result.appliedStatuses, [])
  })

  it('reports error when deal is missing', () => {
    const result = orchestrator().syncDealFromContract(
      contractFixture('active', 'missing-deal'),
    )
    assert.equal(result.synced, false)
    assert.match(result.errors.join(' '), /not found/i)
  })
})

describe('LifecycleOrchestrator deal → opportunity sync', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture('executing')],
      opportunities: opportunityFixtures(),
      postMatches: [postMatchFixture()],
    })
  })

  function orchestrator() {
    return createLifecycleOrchestrator({
      dealRepository: stack.dealRepository,
      opportunityRepository: stack.opportunityRepository,
      postMatchRepository: stack.postMatchRepository,
    })
  }

  it('syncs need and offer to executing when deal is executing', () => {
    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.equal(result.targetStatus, 'executing')
    assert.equal(result.items.length, 2)

    const needItem = result.items.find((item) => item.role === 'need')
    const offerItem = result.items.find((item) => item.role === 'offer')
    assert.equal(needItem?.synced, true)
    assert.equal(offerItem?.synced, true)
    assert.deepEqual(needItem?.appliedStatuses, ['contracted', 'executing'])
    assert.deepEqual(offerItem?.appliedStatuses, ['executing'])

    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('need-1')?.status,
      ),
      'executing',
    )
    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('offer-1')?.status,
      ),
      'executing',
    )
  })

  it('syncs need and offer to completed when deal is completed', () => {
    stack.dealRepository.update('deal-draft-1', { status: 'completed' })
    stack.opportunityRepository.update('need-1', { status: 'executing' })
    stack.opportunityRepository.update('offer-1', { status: 'executing' })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.equal(result.targetStatus, 'completed')
    assert.ok(result.items.every((item) => item.synced))
    assert.ok(
      result.items.every((item) =>
        item.appliedStatuses.every((status) =>
          allowedTransitions('opportunity', status).length >= 0,
        ),
      ),
    )

    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('need-1')?.status,
      ),
      'completed',
    )
    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('offer-1')?.status,
      ),
      'completed',
    )
  })

  it('syncs need and offer to cancelled when deal is cancelled', () => {
    stack.dealRepository.update('deal-draft-1', { status: 'cancelled' })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.equal(result.targetStatus, 'cancelled')
    assert.ok(result.items.every((item) => item.synced))

    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('need-1')?.status,
      ),
      'cancelled',
    )
    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('offer-1')?.status,
      ),
      'cancelled',
    )
  })

  it('logs sync failure when linked opportunity is missing', () => {
    stack.dealRepository.update('deal-draft-1', {
      needOpportunityId: 'missing-need',
      offerOpportunityId: 'missing-offer',
    })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.ok(result.items.every((item) => item.errors.length > 0))
    assert.match(result.items[0]?.errors.join(' ') ?? '', /not found/i)
  })

  it('does not downgrade terminal opportunities', () => {
    stack.opportunityRepository.update('offer-1', { status: 'completed' })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    const offerItem = result.items.find((item) => item.role === 'offer')
    assert.equal(offerItem?.skipped, true)
    assert.equal(offerItem?.synced, false)
    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('offer-1')?.status,
      ),
      'completed',
    )
  })

  it('skips when opportunity already at target status', () => {
    stack.opportunityRepository.update('need-1', { status: 'executing' })
    stack.opportunityRepository.update('offer-1', { status: 'executing' })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.ok(result.items.every((item) => item.skipped))
    assert.ok(result.items.every((item) => !item.synced))
  })

  it('resolves opportunity ids from postMatch when deal omits them', () => {
    stack.dealRepository.update('deal-draft-1', {
      needOpportunityId: undefined,
      offerOpportunityId: undefined,
    })

    const result = orchestrator().syncOpportunitiesFromDeal(
      stack.dealRepository.getById('deal-draft-1')!,
    )
    assert.ok(result.items.every((item) => item.synced))
  })
})

describe('LifecycleOrchestrator contract → deal → opportunity chain', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
      opportunities: opportunityFixtures(),
      postMatches: [postMatchFixture()],
    })
  })

  function orchestrator() {
    return createLifecycleOrchestrator({
      dealRepository: stack.dealRepository,
      opportunityRepository: stack.opportunityRepository,
      postMatchRepository: stack.postMatchRepository,
    })
  }

  it('contract active syncs deal executing then need and offer executing', () => {
    const orch = orchestrator()
    const dealResult = orch.syncDealFromContract(contractFixture('active'))
    assert.equal(dealResult.synced, true)

    const deal = stack.dealRepository.getById('deal-draft-1')!
    const oppResult = orch.syncOpportunitiesFromDeal(deal)
    assert.equal(oppResult.targetStatus, 'executing')
    assert.ok(oppResult.items.every((item) => item.synced))
  })

  it('contract completed syncs deal completed then need and offer completed', () => {
    const orch = orchestrator()
    stack.dealRepository.update('deal-draft-1', { status: 'executing' })
    stack.opportunityRepository.update('need-1', { status: 'executing' })
    stack.opportunityRepository.update('offer-1', { status: 'executing' })

    const dealResult = orch.syncDealFromContract(contractFixture('completed'))
    assert.equal(dealResult.synced, true)

    const deal = stack.dealRepository.getById('deal-draft-1')!
    const oppResult = orch.syncOpportunitiesFromDeal(deal)
    assert.equal(oppResult.targetStatus, 'completed')
    assert.ok(oppResult.items.every((item) => item.synced))
  })

  it('contract terminated syncs deal cancelled then need and offer cancelled', () => {
    const orch = orchestrator()
    const dealResult = orch.syncDealFromContract(contractFixture('terminated'))
    assert.equal(dealResult.synced, true)

    const deal = stack.dealRepository.getById('deal-draft-1')!
    const oppResult = orch.syncOpportunitiesFromDeal(deal)
    assert.equal(oppResult.targetStatus, 'cancelled')
    assert.ok(oppResult.items.every((item) => item.synced))
  })
})
