import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Contract, Deal, Opportunity } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import {
  buildContractDetailReadModel,
  canSignContract,
  contractDetailLinkFallbackLabel,
  contractDetailShowsMutationActions,
  resolveContractMilestones,
  resolveContractNeedOpportunityId,
  resolveContractPostMatchId,
} from '@/lib/contract-detail-read-model.ts'
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
      status: 'published',
      intent: 'offer',
    },
  ]
}

describe('contract detail read model', () => {
  let stack: CommandGatewayTestStack
  let contractId: string

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
      opportunities: opportunityFixtures(),
    })

    const service = createContractCommandService({
      gateway: stack.gateway,
      contractRepository: stack.contractRepository,
    })
    const { result, contract } = service.createContractFromDeal('deal-draft-1')
    assert.equal(result.success, true)
    assert.ok(contract)
    contractId = contract.id
  })

  it('loads contract detail by id', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.contractId, contractId)
  })

  it('shows draft status', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.status, 'draft')
  })

  it('shows dealId and linked deal status', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.dealId, 'deal-draft-1')
    assert.equal(model.dealTitle, 'Deal – pm-1')
    assert.equal(model.dealStatus, 'draft')
    assert.equal(model.links.deal?.path, '/commercial-agreements/deal-draft-1')
  })

  it('shows PostMatch and Negotiation IDs', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.postMatchId, 'pm-1')
    assert.equal(model.negotiationId, 'neg-1')
    assert.equal(model.links.match?.path, '/matches/pm-1')
    assert.equal(model.links.negotiation?.path, '/negotiations/neg-1')
  })

  it('shows Need and Offer titles when available', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.needOpportunityId, 'need-1')
    assert.equal(model.offerOpportunityId, 'offer-1')
    assert.equal(model.needTitle, 'Need: PM for NEOM')
    assert.equal(model.offerTitle, 'Offer: Senior PM')
  })

  it('shows parties and signature state', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.parties.length, 2)
    assert.ok(model.parties.every((party) => party.signatureState === 'pending'))
    assert.ok(model.parties.every((party) => !party.signedAt))
    assert.equal(model.parties[0]?.displayName, 'Need Owner')
  })

  it('shows scope and milestones snapshot', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.scope, 'PM delivery scope')
    assert.equal(model.milestones.length, 1)
    assert.equal(model.milestones[0]?.title, 'Kickoff')
  })

  it('missing linked records show fallback', () => {
    const isolated = createCommandGatewayTestStack()
    const created = isolated.contractRepository.create({
      dealId: 'missing-deal',
      matchId: null,
      negotiationId: null,
      opportunityId: 'missing-need',
      opportunityIds: ['missing-need', 'missing-offer'],
      participants: [],
      status: 'draft',
    })

    const model = buildContractDetailReadModel(
      created.id,
      createContractDetailReadModelDepsFromStack(isolated),
    )
    assert.ok(model)
    assert.equal(model.dealTitle, 'Linked record unavailable')
    assert.equal(model.dealStatus, null)
    assert.equal(model.needTitle, 'Linked record unavailable')
    assert.equal(model.offerTitle, 'Linked record unavailable')
    assert.equal(model.links.match, null)
    assert.equal(model.links.negotiation, null)
    assert.equal(
      contractDetailLinkFallbackLabel('Back to Match'),
      'Back to Match (Unavailable)',
    )
  })

  it('does not expose mutation actions without eligible contract state', () => {
    assert.equal(contractDetailShowsMutationActions({}), false)
  })

  it('canSign is false without current user', () => {
    const model = buildContractDetailReadModel(
      contractId,
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.ok(model)
    assert.equal(model.canSign, false)
  })

  it('canSign is true for unsigned party on draft contract', () => {
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
    assert.equal(contractDetailShowsMutationActions({ canSign: model.canSign }), true)
  })

  it('returns null when contract id is missing', () => {
    const model = buildContractDetailReadModel(
      'missing-contract',
      createContractDetailReadModelDepsFromStack(stack, {
        getPersonName: (userId) =>
          userId === 'user-need' ? 'Need Owner' : undefined,
      }),
    )
    assert.equal(model, null)
  })

  it('resolveContractPostMatchId reads matchId', () => {
    const contract: Contract = {
      id: 'contract-1',
      dealId: 'deal-1',
      matchId: 'pm-1',
      participants: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    assert.equal(resolveContractPostMatchId(contract), 'pm-1')
  })

  it('resolveContractNeedOpportunityId prefers deal need id', () => {
    const contract: Contract = {
      id: 'contract-1',
      dealId: 'deal-1',
      opportunityId: 'opp-fallback',
      participants: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const deal: Deal = {
      id: 'deal-1',
      negotiationId: 'neg-1',
      opportunityId: 'need-1',
      needOpportunityId: 'need-from-deal',
      title: 'Deal',
      status: 'draft',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    assert.equal(resolveContractNeedOpportunityId(contract, deal), 'need-from-deal')
  })

  it('resolveContractMilestones parses snapshot array', () => {
    const milestones = resolveContractMilestones([
      { id: 'ms-1', title: 'Kickoff', dueDate: '2026-07-01', status: 'pending' },
    ])
    assert.equal(milestones.length, 1)
    assert.equal(milestones[0]?.title, 'Kickoff')
  })
})
