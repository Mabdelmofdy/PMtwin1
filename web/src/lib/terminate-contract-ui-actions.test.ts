import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { toCanonical } from '@pm-twin/lifecycle'
import type { Deal, Opportunity } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import {
  buildContractDetailReadModel,
  canCompleteContract,
  canTerminateContract,
} from '@/lib/contract-detail-read-model.ts'
import { terminateContractUiAction } from '@/lib/terminate-contract-ui-actions.ts'
import { createContractCommandService } from '@/services/contract-command-service.ts'
import { createContractDetailReadModelDepsFromStack } from '@/lib/read-model-repository-deps.ts'

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
    milestones: [],
    createdAt: now,
    updatedAt: now,
  }
}

function opportunityFixtures(): Opportunity[] {
  return [
    {
      id: 'need-1',
      title: 'Need: PM for NEOM',
      status: 'negotiating',
      intent: 'need',
    },
    {
      id: 'offer-1',
      title: 'Offer: Senior PM',
      status: 'contracted',
      intent: 'offer',
    },
  ]
}

function activateContract(
  service: ReturnType<typeof createContractCommandService>,
  contractId: string,
): void {
  assert.equal(service.signContract(contractId, 'user-need').success, true)
  assert.equal(service.signContract(contractId, 'user-offer').success, true)
}

describe('terminateContract UI actions', () => {
  let stack: CommandGatewayTestStack
  let contractId: string
  let contractService: ReturnType<typeof createContractCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
      opportunities: opportunityFixtures(),
    })

    contractService = createContractCommandService({
      gateway: stack.gateway,
      contractRepository: stack.contractRepository,
    })

    const { result, contract } = contractService.createContractFromDeal('deal-draft-1')
    assert.equal(result.success, true)
    assert.ok(contract)
    contractId = contract.id
  })

  function uiDeps() {
    return {
      terminateContract: (id: string, reason?: string) =>
        contractService.terminateContract(id, reason),
      getContract: (id: string) => stack.contractRepository.getById(id),
    }
  }

  it('terminate button visible for draft', () => {
    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canTerminateContract(contract), true)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canTerminate, true)
  })

  it('terminate button visible for pending_signature', () => {
    assert.equal(contractService.signContract(contractId, 'user-need').success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'pending_signature')
    assert.equal(canTerminateContract(contract), true)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canTerminate, true)
  })

  it('terminate button visible for active contract', () => {
    activateContract(contractService, contractId)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'active')
    assert.equal(canTerminateContract(contract), true)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canTerminate, true)
  })

  it('terminates active contract', () => {
    activateContract(contractService, contractId)

    const result = terminateContractUiAction(contractId, 'mutual_exit', uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'terminated')
    }
  })

  it('buttons hidden for completed contract', () => {
    activateContract(contractService, contractId)
    assert.equal(contractService.completeContract(contractId).success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canTerminateContract(contract), false)
    assert.equal(canCompleteContract(contract), false)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canTerminate, false)
    assert.equal(model.canComplete, false)
  })

  it('buttons hidden for terminated contract', () => {
    activateContract(contractService, contractId)
    assert.equal(contractService.terminateContract(contractId).success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canTerminateContract(contract), false)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canTerminate, false)
  })

  it('failure does not show success', () => {
    activateContract(contractService, contractId)
    assert.equal(contractService.completeContract(contractId).success, true)

    const result = terminateContractUiAction(contractId, 'retry', uiDeps())
    assert.equal(result.success, false)
  })

  it('terminating contract syncs deal to cancelled', () => {
    const before = stack.dealRepository.getById('deal-draft-1')
    assert.ok(before)

    terminateContractUiAction(contractId, 'cancelled_early', uiDeps())

    const after = stack.dealRepository.getById('deal-draft-1')
    assert.ok(after)
    assert.equal(toCanonical('deal', after.status), 'cancelled')
  })

  it('terminate syncs linked opportunities to cancelled', () => {
    terminateContractUiAction(contractId, 'cancelled_early', uiDeps())

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
})
