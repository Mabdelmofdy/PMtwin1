import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import {
  buildDealDetailReadModel,
  canCreateContractFromDeal,
  dealDetailLinkFallbackLabel,
  formatCommercialTermsLines,
  resolveDealCommercialTerms,
  resolveDealPostMatchId,
} from '@/lib/deal-detail-read-model.ts'
import { createContractCommandService } from '@/services/contract-command-service.ts'
import {
  createDealDetailReadModelDepsFromStack,
} from '@/lib/read-model-repository-deps.ts'

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
    commercialTerms: {
      amount: 120000,
      currency: 'SAR',
      duration: '6 months',
      paymentSchedule: 'monthly',
    },
  }
}

function opportunityFixture(
  id: string,
  title: string,
  intent: 'need' | 'offer',
): Opportunity {
  return {
    id,
    title,
    intent,
    status: 'published',
  }
}

describe('deal detail read model', () => {
  let stack: CommandGatewayTestStack
  let dealId: string

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      postMatches: [postMatchFixture('pm-confirmed')],
      negotiations: [agreedNegotiation('pm-confirmed')],
      opportunities: [
        opportunityFixture('need-1', 'Need: PM for NEOM', 'need'),
        opportunityFixture('offer-1', 'Offer: Senior PM', 'offer'),
      ],
    })

    const service = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
    const { result, deal } = service.createDealFromPostMatch(
      'pm-confirmed',
      'neg-agreed',
    )
    assert.equal(result.success, true)
    assert.ok(deal)
    dealId = deal.id
  })

  it('loads deal detail by id', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.deal.id, dealId)
  })

  it('shows draft status after CreateDealFromPostMatch', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.status, 'draft')
  })

  it('shows PostMatch link fields', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.postMatchId, 'pm-confirmed')
    assert.equal(model.negotiationId, 'neg-agreed')
    assert.equal(model.needOpportunityId, 'need-1')
    assert.equal(model.offerOpportunityId, 'offer-1')
    assert.equal(model.links.match?.path, '/matches/pm-confirmed')
    assert.equal(model.links.negotiation?.path, '/negotiations/neg-agreed')
    assert.equal(model.links.needOpportunity?.path, '/opportunities/need-1')
    assert.equal(model.links.offerOpportunity?.path, '/opportunities/offer-1')
  })

  it('shows Need and Offer titles when available', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.needTitle, 'Need: PM for NEOM')
    assert.equal(model.offerTitle, 'Offer: Senior PM')
  })

  it('shows negotiation status when available', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.negotiationStatus, 'agreed')
  })

  it('shows commercial terms when available', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.ok(model.commercialTerms)
    assert.equal(model.commercialTerms?.amount, 120000)
    assert.ok(model.commercialTermsLines.some((line) => line.includes('120,000 SAR')))
    assert.ok(model.commercialTermsLines.some((line) => line.includes('6 months')))
  })

  it('missing linked records show safe fallback', () => {
    const isolated = createCommandGatewayTestStack()
    const created = isolated.dealRepository.create({
      negotiationId: 'missing-neg',
      opportunityId: 'missing-need',
      needOpportunityId: 'missing-need',
      offerOpportunityId: 'missing-offer',
      title: 'Orphan deal',
      status: 'draft',
      participants: [],
    })

    const model = buildDealDetailReadModel(
      created.id,
      createDealDetailReadModelDepsFromStack(isolated),
    )
    assert.ok(model)
    assert.equal(model.needTitle, 'Linked record unavailable')
    assert.equal(model.offerTitle, 'Linked record unavailable')
    assert.equal(model.negotiationStatus, null)
    assert.equal(model.links.match, null)
    assert.equal(model.links.negotiation?.path, '/negotiations/missing-neg')
    assert.equal(
      dealDetailLinkFallbackLabel('Back to Match'),
      'Back to Match (Unavailable)',
    )
  })

  it('can create contract for eligible draft deal', () => {
    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canCreateContract, true)
    assert.equal(model.existingContract, null)
  })

  it('hides create contract when non-terminal contract exists', () => {
    const contractService = createContractCommandService({
      gateway: stack.gateway,
      contractRepository: stack.contractRepository,
    })
    const { result } = contractService.createContractFromDeal(dealId)
    assert.equal(result.success, true)

    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canCreateContract, false)
    assert.ok(model.existingContract)
    assert.equal(model.contractLink?.path, `/contracts/${model.existingContract.id}`)
  })

  it('hides create contract for completed deal', () => {
    stack.dealRepository.update(dealId, { status: 'completed' })
    const deal = stack.dealRepository.getById(dealId)
    assert.ok(deal)
    assert.equal(canCreateContractFromDeal(deal, []), false)

    const model = buildDealDetailReadModel(dealId, createDealDetailReadModelDepsFromStack(stack))
    assert.ok(model)
    assert.equal(model.canCreateContract, false)
  })

  it('returns null when deal id is missing', () => {
    const model = buildDealDetailReadModel('missing-deal', createDealDetailReadModelDepsFromStack(stack))
    assert.equal(model, null)
  })

  it('resolveDealPostMatchId prefers postMatchId over legacy matchId', () => {
    const deal: Deal = {
      id: 'deal-1',
      negotiationId: 'neg-1',
      opportunityId: 'need-1',
      postMatchId: 'pm-new',
      matchId: 'pm-legacy',
      title: 'Deal',
      status: 'draft',
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    assert.equal(resolveDealPostMatchId(deal), 'pm-new')
  })

  it('resolveDealCommercialTerms reads legacy terms fields', () => {
    const deal: Deal = {
      id: 'deal-1',
      negotiationId: 'neg-1',
      opportunityId: 'need-1',
      title: 'Deal',
      status: 'draft',
      participants: [],
      terms: { amount: 50000, currency: 'SAR' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const terms = resolveDealCommercialTerms(deal)
    assert.ok(terms)
    assert.equal(terms.amount, 50000)
    assert.deepEqual(formatCommercialTermsLines(terms), ['Amount: 50,000 SAR'])
  })
})
