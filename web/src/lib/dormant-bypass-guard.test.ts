import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Opportunity } from '@/types/domain.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import {
  createCommandGatewayTestStack,
  MemoryStorageAdapter,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { dataStore } from '@/lib/data-store.ts'
import { LIFECYCLE_STATUS_BYPASS_ERROR } from '@/lib/lifecycle-status-guard.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import {
  normalizedApplicationRepository,
  normalizedDealRepository,
  normalizedOpportunityRepository,
} from '@/repositories/normalized/index.ts'
import { createLifecycleOrchestrator } from '@/services/lifecycle-orchestrator.ts'
import { dealService } from '@/services/deal-service.ts'

function assertBypassRejected(fn: () => void): void {
  assert.throws(fn, (error: Error) => {
    assert.equal(error.message, LIFECYCLE_STATUS_BYPASS_ERROR)
    return true
  })
}

const opportunitySeed: Opportunity[] = [
  {
    id: 'opp-guard-test',
    title: 'Before title',
    status: 'draft',
    creatorId: 'user-1',
    intent: 'need',
  },
]

describe('dormant bypass API guards', () => {
  it('dealsApi.updateStatus rejects', () => {
    assertBypassRejected(() => dealsApi.updateStatus('deal-1', 'executing'))
  })

  it('dealsApi.update({ status }) rejects', () => {
    assertBypassRejected(() => dealsApi.update('deal-1', { status: 'executing' }))
  })

  it('dealService.updateDealStatus rejects', () => {
    assertBypassRejected(() => dealService.updateDealStatus('deal-1', 'executing'))
  })

  it('opportunitiesApi.update({ status }) rejects', () => {
    assertBypassRejected(() =>
      opportunitiesApi.update('opp-guard-test', { status: 'published' }),
    )
  })

  it('dataStore.updateOpportunity({ status }) rejects', () => {
    assertBypassRejected(() =>
      dataStore.updateOpportunity('opp-guard-test', { status: 'published' }),
    )
  })

  it('dataStore.updateApplication({ status }) rejects', () => {
    assertBypassRejected(() =>
      dataStore.updateApplication('app-1', { status: 'reviewing' }),
    )
  })

  it('negotiationsApi.update({ status }) rejects', () => {
    assertBypassRejected(() =>
      negotiationsApi.update('neg-1', { status: 'agreed' }),
    )
  })

  it('normalizedOpportunityRepository.update({ status }) rejects', () => {
    assertBypassRejected(() =>
      normalizedOpportunityRepository.update('opp-guard-test', {
        status: 'published',
      }),
    )
  })

  it('normalizedApplicationRepository.update({ status }) rejects', () => {
    assertBypassRejected(() =>
      normalizedApplicationRepository.update('app-1', { status: 'reviewing' }),
    )
  })

  it('normalizedDealRepository.update({ status }) rejects', () => {
    assertBypassRejected(() =>
      normalizedDealRepository.update('deal-1', { status: 'executing' }),
    )
  })

  it('non-status opportunity update still works', () => {
    const storage = new MemoryStorageAdapter()
    const repository = new OpportunityRepository(storage, () => opportunitySeed)

    repository.update('opp-guard-test', { title: 'After title' })

    assert.equal(repository.getById('opp-guard-test')?.title, 'After title')
    assert.equal(repository.getById('opp-guard-test')?.status, 'draft')
  })
})

describe('dormant bypass guards preserve orchestrated writes', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      applications: [
        {
          id: 'app-reviewing',
          opportunityId: 'opp-1',
          applicantId: 'user-1',
          status: 'reviewing',
        },
      ],
      opportunities: [
        {
          id: 'need-1',
          title: 'Need',
          status: 'contracted',
          intent: 'need',
        },
        {
          id: 'offer-1',
          title: 'Offer',
          status: 'contracted',
          intent: 'offer',
        },
      ],
      deals: [
        {
          id: 'deal-1',
          negotiationId: 'neg-1',
          postMatchId: 'pm-1',
          needOpportunityId: 'need-1',
          offerOpportunityId: 'offer-1',
          opportunityId: 'need-1',
          title: 'Deal',
          status: 'executing',
        },
      ],
    })
  })

  it('command handler status writes still work', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionApplicationStatus',
      aggregateId: 'app-reviewing',
      clientRequestId: 'req-bypass-guard-smoke',
      targetStatus: 'shortlisted',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.applicationRepository.getById('app-reviewing')?.status,
      'shortlisted',
    )
  })

  it('orchestrator status writes still work', () => {
    const orchestrator = createLifecycleOrchestrator({
      dealRepository: stack.dealRepository,
      opportunityRepository: stack.opportunityRepository,
    })

    stack.dealRepository.update('deal-1', { status: 'completed' })
    stack.opportunityRepository.update('need-1', { status: 'executing' })
    stack.opportunityRepository.update('offer-1', { status: 'executing' })

    const deal = stack.dealRepository.getById('deal-1')
    assert.ok(deal)
    orchestrator.syncOpportunitiesFromDeal(deal)

    assert.equal(
      stack.opportunityRepository.getById('need-1')?.status,
      'completed',
    )
    assert.equal(
      stack.opportunityRepository.getById('offer-1')?.status,
      'completed',
    )
  })
})
