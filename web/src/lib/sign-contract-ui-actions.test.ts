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
  canSignContract,
} from '@/lib/contract-detail-read-model.ts'
import { signContractUiAction } from '@/lib/sign-contract-ui-actions.ts'
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
    milestones: [
      {
        id: 'ms-1',
        title: 'Kickoff',
        dueDate: '2026-07-01',
        status: 'pending',
      },
    ],
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

describe('signContract UI actions', () => {
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
      signContract: (id: string, userId: string) =>
        contractService.signContract(id, userId),
      getContract: (id: string) => stack.contractRepository.getById(id),
    }
  }

  it('sign button visible for eligible party', () => {
    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canSignContract(contract, 'user-need'), true)

    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
      { currentUserId: 'user-need' },
    )
    assert.ok(model)
    assert.equal(model.canSign, true)
  })

  it('hidden for non-party', () => {
    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canSignContract(contract, 'user-outsider'), false)

    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
      { currentUserId: 'user-outsider' },
    )
    assert.ok(model)
    assert.equal(model.canSign, false)
  })

  it('hidden for already signed party', () => {
    assert.equal(contractService.signContract(contractId, 'user-need').success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(canSignContract(contract, 'user-need'), false)

    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
      { currentUserId: 'user-need' },
    )
    assert.ok(model)
    assert.equal(model.canSign, false)
  })

  it('hidden for terminal contract', () => {
    assert.equal(contractService.signContract(contractId, 'user-need').success, true)
    assert.equal(contractService.signContract(contractId, 'user-offer').success, true)
    assert.equal(contractService.completeContract(contractId).success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'completed')
    assert.equal(canSignContract(contract, 'user-need'), false)
  })

  it('first sign moves draft to pending_signature', () => {
    const result = signContractUiAction(contractId, 'user-need', uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'pending_signature')
    }
  })

  it('final sign moves pending_signature to active', () => {
    assert.equal(contractService.signContract(contractId, 'user-need').success, true)

    const result = signContractUiAction(contractId, 'user-offer', uiDeps())
    assert.equal(result.success, true)
    if (result.success) {
      assert.equal(result.contract.status, 'active')
    }
  })

  it('failure does not show success', () => {
    const result = signContractUiAction(contractId, 'user-outsider', uiDeps())
    assert.equal(result.success, false)
    if (!result.success) {
      assert.match(result.message, /not a contract party/i)
    }
  })

  it('partial sign does not sync deal status', () => {
    const before = stack.dealRepository.getById('deal-draft-1')
    assert.ok(before)

    signContractUiAction(contractId, 'user-need', uiDeps())

    const after = stack.dealRepository.getById('deal-draft-1')
    assert.ok(after)
    assert.equal(after.status, before.status)
  })

  it('full sign syncs deal to executing', () => {
    signContractUiAction(contractId, 'user-need', uiDeps())
    signContractUiAction(contractId, 'user-offer', uiDeps())

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.ok(deal)
    assert.equal(toCanonical('deal', deal.status), 'executing')
  })

  it('full sign syncs linked opportunities to executing', () => {
    signContractUiAction(contractId, 'user-need', uiDeps())
    signContractUiAction(contractId, 'user-offer', uiDeps())

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
})
