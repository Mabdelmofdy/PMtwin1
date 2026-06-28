import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import { toCanonical } from '@pm-twin/lifecycle'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createContractCommandService } from '@/services/contract-command-service.ts'

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

function negotiationFixture(): Negotiation {
  const now = new Date().toISOString()
  return {
    id: 'neg-1',
    postMatchId: 'pm-1',
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
    status: 'agreed',
    createdAt: now,
    updatedAt: now,
  }
}

describe('ContractCommandHandler', () => {
  let stack: CommandGatewayTestStack
  let service: ReturnType<typeof createContractCommandService>
  let contractId: string

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      deals: [draftDealFixture()],
      opportunities: opportunityFixtures(),
      postMatches: [postMatchFixture()],
      negotiations: [negotiationFixture()],
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

  it('create contract from deal creates draft', () => {
    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'draft')
    assert.equal(contract.dealId, 'deal-draft-1')
    assert.equal(contract.matchId, 'pm-1')
    assert.equal(contract.negotiationId, 'neg-1')
    assert.equal(contract.opportunityId, 'need-1')
    assert.deepEqual(contract.opportunityIds, ['need-1', 'offer-1'])
    assert.equal(contract.scope, 'PM delivery scope')
    assert.ok(contract.milestonesSnapshot)
    assert.equal(contract.participants.length, 2)
  })

  it('duplicate contract for same deal blocked', () => {
    const { result } = service.createContractFromDeal('deal-draft-1')
    assert.equal(result.success, false)
    assert.match(result.errors?.join(' ') ?? '', /already exists/i)
  })

  it('sign by party updates signature', () => {
    const signResult = service.signContract(contractId, 'user-need')
    assert.equal(signResult.success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    const needParty = contract.participants.find(
      (participant) => participant.userId === 'user-need',
    )
    assert.ok(needParty?.signedAt)
    assert.equal(contract.status, 'pending_signature')
  })

  it('non-party cannot sign', () => {
    const signResult = service.signContract(contractId, 'user-outsider')
    assert.equal(signResult.success, false)
    assert.match(signResult.errors?.join(' ') ?? '', /not a contract party/i)
  })

  it('all parties signed activates contract and syncs deal to executing', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    const secondSign = service.signContract(contractId, 'user-offer')
    assert.equal(secondSign.success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.ok(contract)
    assert.equal(contract.status, 'active')
    assert.ok(contract.signedAt)
    assert.ok(
      contract.participants.every((participant) => participant.signedAt),
    )

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.ok(deal)
    assert.equal(toCanonical('deal', deal.status), 'executing')

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

  it('complete active contract syncs deal to completed', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)

    const completeResult = service.completeContract(contractId, 'delivered')
    assert.equal(completeResult.success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.equal(contract?.status, 'completed')

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.equal(toCanonical('deal', deal?.status), 'completed')

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

  it('cannot complete draft contract', () => {
    const completeResult = service.completeContract(contractId, 'too_early')
    assert.equal(completeResult.success, false)
    assert.match(completeResult.errors?.join(' ') ?? '', /not allowed/i)
  })

  it('terminate active contract syncs deal to cancelled', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)

    const terminateResult = service.terminateContract(
      contractId,
      'mutual_exit',
    )
    assert.equal(terminateResult.success, true)

    const contract = stack.contractRepository.getById(contractId)
    assert.equal(contract?.status, 'terminated')

    const deal = stack.dealRepository.getById('deal-draft-1')
    assert.equal(toCanonical('deal', deal?.status), 'cancelled')

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

  it('terminal contract rejects further transitions', () => {
    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)
    assert.equal(service.completeContract(contractId).success, true)

    const retryComplete = service.completeContract(contractId)
    assert.equal(retryComplete.success, false)
    assert.match(retryComplete.errors?.join(' ') ?? '', /terminal state/i)

    const retryTerminate = service.terminateContract(contractId)
    assert.equal(retryTerminate.success, false)
    assert.match(retryTerminate.errors?.join(' ') ?? '', /terminal state/i)
  })

  it('partial sign does not sync deal or opportunity status', () => {
    const dealBefore = stack.dealRepository.getById('deal-draft-1')
    const needBefore = stack.opportunityRepository.getById('need-1')
    const offerBefore = stack.opportunityRepository.getById('offer-1')
    assert.ok(dealBefore)
    assert.ok(needBefore)
    assert.ok(offerBefore)

    assert.equal(service.signContract(contractId, 'user-need').success, true)

    const dealAfter = stack.dealRepository.getById('deal-draft-1')
    const needAfter = stack.opportunityRepository.getById('need-1')
    const offerAfter = stack.opportunityRepository.getById('offer-1')
    assert.ok(dealAfter)
    assert.ok(needAfter)
    assert.ok(offerAfter)
    assert.equal(dealAfter.status, dealBefore.status)
    assert.equal(needAfter.status, needBefore.status)
    assert.equal(offerAfter.status, offerBefore.status)
  })

  it('logs opportunity sync failure when linked opportunity is missing', () => {
    stack.dealRepository.update('deal-draft-1', {
      offerOpportunityId: 'missing-offer',
    })

    assert.equal(service.signContract(contractId, 'user-need').success, true)
    const signResult = service.signContract(contractId, 'user-offer')
    assert.equal(signResult.success, true)

    const failures = stack.auditRepository
      .getAll()
      .filter((entry) => entry.action === 'lifecycle.opportunity_sync_failed')
    assert.ok(failures.length > 0)
    assert.match(
      JSON.stringify(failures[0]?.details ?? {}),
      /missing-offer/i,
    )
  })

  it('does not downgrade terminal opportunities during contract sync', () => {
    stack.opportunityRepository.update('offer-1', { status: 'completed' })

    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)

    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('offer-1')?.status,
      ),
      'completed',
    )
    assert.equal(
      toCanonical(
        'opportunity',
        stack.opportunityRepository.getById('need-1')?.status,
      ),
      'executing',
    )
  })

  it('does not change postMatch negotiation or application records', () => {
    const postMatchBefore = stack.postMatchRepository.getById('pm-1')
    const negotiationBefore = stack.negotiationRepository.getById('neg-1')
    assert.ok(postMatchBefore)
    assert.ok(negotiationBefore)

    assert.equal(service.signContract(contractId, 'user-need').success, true)
    assert.equal(service.signContract(contractId, 'user-offer').success, true)
    assert.equal(service.completeContract(contractId).success, true)

    const postMatchAfter = stack.postMatchRepository.getById('pm-1')
    const negotiationAfter = stack.negotiationRepository.getById('neg-1')
    assert.equal(postMatchAfter?.status, postMatchBefore.status)
    assert.equal(negotiationAfter?.status, negotiationBefore.status)
    assert.equal(stack.applicationRepository.getAll().length, 0)
  })
})
