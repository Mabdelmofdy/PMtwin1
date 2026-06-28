import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { toCanonical } from '@pm-twin/lifecycle'
import type { Deal, Opportunity } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { buildContractDetailReadModel } from '@/lib/contract-detail-read-model.ts'
import { buildDealDetailReadModel } from '@/lib/deal-detail-read-model.ts'
import {
  createContractDetailReadModelDepsFromStack,
  createDealDetailReadModelDepsFromStack,
} from '@/lib/read-model-repository-deps.ts'
import { formatCanonicalStatusLabel, opportunityPipelineBucket } from '@/lib/status-display.ts'
import { createContractCommandService } from '@/services/contract-command-service.ts'
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

function draftDealFixture(): Deal {
  const now = new Date().toISOString()
  return {
    id: 'deal-draft-1',
    negotiationId: 'neg-1',
    postMatchId: 'pm-1',
    matchId: 'pm-1',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    opportunityId: 'need-1',
    opportunityIds: ['need-1', 'offer-1'],
    title: 'Deal – pm-1',
    status: 'draft',
    participants: [...participants],
    parties: [...participants],
    scope: 'PM delivery scope',
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
      creatorId: 'user-need',
    },
    {
      id: 'offer-1',
      title: 'Offer opportunity',
      status: 'contracted',
      intent: 'offer',
      creatorId: 'user-offer',
    },
  ]
}

describe('read model orchestration sync', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createContractCommandService>
  let contractId: string

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
      opportunities: opportunityFixtures(),
    })
    service = createContractCommandService({
      gateway: stack.gateway,
      contractRepository: stack.contractRepository,
    })

    const { result, contract } = service.createContractFromDeal('deal-draft-1')
    assert.equal(result.success, true)
    assert.ok(contract)
    contractId = contract.id
  })

  function contractModel() {
    return buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack),
      { currentUserId: 'user-need' },
    )
  }

  function dealModel() {
    return buildDealDetailReadModel(
      'deal-draft-1',
      createDealDetailReadModelDepsFromStack(stack),
    )
  }

  it('reflects executing after contract activation', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)

    const contract = contractModel()
    const deal = dealModel()
    assert.ok(contract)
    assert.ok(deal)

    assert.equal(contract.canonicalStatus, 'active')
    assert.equal(deal.canonicalStatus, 'executing')
    assert.equal(contract.dealCanonicalStatus, 'executing')
    assert.equal(deal.needOpportunityCanonicalStatus, 'executing')
    assert.equal(deal.offerOpportunityCanonicalStatus, 'executing')
    assert.equal(contract.needOpportunityCanonicalStatus, 'executing')
    assert.equal(contract.offerOpportunityCanonicalStatus, 'executing')
  })

  it('reflects completed after contract completion', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)
    assert.equal(service.completeContract(contractId).success, true)

    const contract = contractModel()
    const deal = dealModel()
    assert.ok(contract)
    assert.ok(deal)

    assert.equal(contract.canonicalStatus, 'completed')
    assert.equal(deal.canonicalStatus, 'completed')
    assert.equal(deal.needOpportunityCanonicalStatus, 'completed')
    assert.equal(deal.offerOpportunityCanonicalStatus, 'completed')
  })

  it('reflects cancelled after contract termination', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)
    assert.equal(service.terminateContract(contractId).success, true)

    const contract = contractModel()
    const deal = dealModel()
    assert.ok(contract)
    assert.ok(deal)

    assert.equal(contract.canonicalStatus, 'terminated')
    assert.equal(deal.canonicalStatus, 'cancelled')
    assert.equal(deal.needOpportunityCanonicalStatus, 'cancelled')
    assert.equal(deal.offerOpportunityCanonicalStatus, 'cancelled')
  })

  it('does not let stale seed override repository opportunity status', () => {
    stack.opportunityRepository.update('need-1', { status: 'executing' })

    const staleDeps = createDealDetailReadModelDepsFromStack(stack)
    const model = buildDealDetailReadModel('deal-draft-1', staleDeps)
    assert.ok(model)
    assert.equal(model.needOpportunityCanonicalStatus, 'executing')
    assert.notEqual(model.needOpportunityCanonicalStatus, 'negotiating')
  })

  it('pipeline buckets use canonical orchestrated status', () => {
    stack.opportunityRepository.update('need-1', { status: 'executing' })
    stack.opportunityRepository.update('offer-1', { status: 'executing' })

    const dealService = createDealService({
      dealRepository: stack.dealRepository,
    })
    const buckets = dealService.bucketOpportunitiesForPipeline(
      stack.opportunityRepository.getAll(),
      'user-need',
    )

    assert.equal(opportunityPipelineBucket('executing'), 'in_progress')
    assert.ok(
      buckets.in_progress.some((opportunity) => opportunity.id === 'need-1'),
    )
    assert.equal(buckets.closed.length, 0)
  })

  it('status badges display canonical labels', () => {
    assert.equal(
      formatCanonicalStatusLabel('contract', 'active'),
      'Active',
    )
    assert.equal(
      formatCanonicalStatusLabel('deal', 'executing'),
      'Executing',
    )
    assert.equal(
      formatCanonicalStatusLabel('opportunity', 'completed'),
      'Completed',
    )
    assert.equal(
      formatCanonicalStatusLabel('contract', 'pending_signature'),
      'Pending signature',
    )
    assert.equal(toCanonical('opportunity', 'in_execution'), 'executing')
    assert.equal(toCanonical('contract', 'terminated'), 'terminated')
  })
})
