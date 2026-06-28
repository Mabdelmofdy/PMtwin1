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
} from '@/lib/contract-detail-read-model.ts'
import { completeContractUiAction } from '@/lib/complete-contract-ui-actions.ts'
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

describe('completeContract UI actions', () => {
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
      completeContract: (id: string, reason?: string) =>
        contractService.completeContract(id, reason),
      getContract: (id: string) => stack.contractRepository.getById(id),
    }
  }

  it('complete button visible only for active contract', () => {
    const draft = stack.contractRepository.getById(contractId)
    assert.ok(draft)
    assert.equal(canCompleteContract(draft), false)

    const draftModel = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack),
    )
    assert.ok(draftModel)
    assert.equal(draftModel.canComplete, false)

    activateContract(contractService, contractId)
    const active = stack.contractRepository.getById(contractId)
    assert.ok(active)
    assert.equal(active.status, 'active')
    assert.equal(canCompleteContract(active), true)

    const activeModel = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack),
    )
    assert.ok(activeModel)
    assert.equal(activeModel.canComplete, true)
  })

  it('completes active contract', () => {
    activateContract(contractService, contractId)

    const result = completeContractUiAction(contractId, 'delivered', uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'completed')
    }
  })

  it('complete draft contract hidden and rejected', () => {
    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canCompleteContract(contract), false)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canComplete, false)

    const result = completeContractUiAction(contractId, 'too_early', uiDeps())
    assert.equal(result.success, false)
    if (!result.success) {
      assert.match(result.message, /not allowed/i)
    }
  })

  it('buttons hidden for completed contract', () => {
    activateContract(contractService, contractId)
    assert.equal(contractService.completeContract(contractId).success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'completed')
    assert.equal(canCompleteContract(contract), false)

    const model = buildContractDetailReadModel(contractId, createContractDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canComplete, false)
  })

  it('failure does not show success', () => {
    const result = completeContractUiAction(contractId, 'too_early', uiDeps())
    assert.equal(result.success, false)
  })

  it('completing active contract syncs deal to completed', () => {
    activateContract(contractService, contractId)
    const before = stack.dealRepository.getById('deal-draft-1')
    assert.ok(before)
    assert.equal(toCanonical('deal', before.status), 'executing')

    completeContractUiAction(contractId, 'delivered', uiDeps())

    const after = stack.dealRepository.getById('deal-draft-1')
    assert.ok(after)
    assert.equal(toCanonical('deal', after.status), 'completed')
  })

  it('complete syncs linked opportunities to completed', () => {
    activateContract(contractService, contractId)

    completeContractUiAction(contractId, 'delivered', uiDeps())

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
})
