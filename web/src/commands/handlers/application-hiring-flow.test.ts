import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Application, Opportunity } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { formatCommercialTermsDisplayLines } from '@/domain/collaboration/value-exchange-lifecycle.ts'
import { looksLikeRawTaxonomyId } from '@/lib/collaboration-taxonomy-display.ts'

const hiringOpportunity: Opportunity = {
  id: 'opp-hiring',
  title: 'Senior PM hire',
  status: 'published',
  creatorId: 'user-hiring',
  mainCollaborationModel: 'hiring',
  modelType: 'hiring',
  subModelType: 'professional_hiring',
  exchangeMode: 'cash',
  collaborationAttributes: {
    jobTitle: 'Senior PM',
    salaryRange: { min: 15000, max: 20000, currency: 'SAR' },
    startDate: '2026-08-01',
  },
  exchangeData: {
    exchangeMode: 'cash',
    budgetRange: { min: 15000, max: 20000, currency: 'SAR' },
  },
}

const acceptedApplication: Application = {
  id: 'app-accepted-hire',
  opportunityId: 'opp-hiring',
  applicantId: 'user-applicant',
  status: 'accepted',
}

describe('hiring application workflow', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      opportunities: [hiringOpportunity],
      applications: [acceptedApplication],
    })
  })

  it('StartNegotiationFromApplication seeds commercial terms from opportunity', () => {
    const result = stack.gateway.execute({
      commandType: 'StartNegotiationFromApplication',
      aggregateId: 'app-accepted-hire',
      clientRequestId: 'req-start-app-neg',
    })
    assert.equal(result.success, true)

    const negotiation = stack.negotiationRepository.getById(result.aggregateId)
    assert.ok(negotiation)
    assert.equal(negotiation.applicationId, 'app-accepted-hire')
    assert.equal(negotiation.opportunityId, 'opp-hiring')
    assert.ok(negotiation.commercialTerms?.exchangeMode === 'cash')

    const lines = formatCommercialTermsDisplayLines(negotiation.commercialTerms)
    assert.ok(lines.some((line) => line.startsWith('Exchange:')))
    for (const line of lines) {
      assert.ok(!looksLikeRawTaxonomyId(line))
    }

    const application = stack.applicationRepository.getById('app-accepted-hire')
    assert.equal(application?.negotiationId, negotiation.id)
  })

  it('CreateDealFromApplication completes hiring path without PostMatch', () => {
    const start = stack.gateway.execute({
      commandType: 'StartNegotiationFromApplication',
      aggregateId: 'app-accepted-hire',
      clientRequestId: 'req-start-app-neg-2',
    })
    assert.equal(start.success, true)
    const negotiationId = start.aggregateId

    const agree = stack.gateway.execute({
      commandType: 'AgreeNegotiation',
      aggregateId: negotiationId,
      clientRequestId: 'req-agree-app-neg',
    })
    assert.equal(agree.success, true)

    const dealResult = stack.gateway.execute({
      commandType: 'CreateDealFromApplication',
      aggregateId: 'app-accepted-hire',
      negotiationId,
      clientRequestId: 'req-deal-from-app',
    })
    assert.equal(dealResult.success, true)

    const deal = stack.dealRepository.getById(dealResult.aggregateId)
    assert.ok(deal)
    assert.equal(deal.applicationId, 'app-accepted-hire')
    assert.equal(deal.negotiationId, negotiationId)
    assert.equal(deal.opportunityId, 'opp-hiring')
    assert.ok(!deal.postMatchId)

    const application = stack.applicationRepository.getById('app-accepted-hire')
    assert.equal(application?.dealId, deal.id)
  })

  it('rejects negotiation start for non-accepted applications', () => {
    stack.applicationRepository.update('app-accepted-hire', { status: 'reviewing' })
    const result = stack.gateway.execute({
      commandType: 'StartNegotiationFromApplication',
      aggregateId: 'app-accepted-hire',
      clientRequestId: 'req-start-app-neg-fail',
    })
    assert.equal(result.success, false)
  })

  it('runs application hiring path through contract creation with audit trail', () => {
    const start = stack.gateway.execute({
      commandType: 'StartNegotiationFromApplication',
      aggregateId: 'app-accepted-hire',
      clientRequestId: 'req-e2e-start',
    })
    assert.equal(start.success, true)
    const negotiationId = start.aggregateId

    const negotiation = stack.negotiationRepository.getById(negotiationId)
    assert.ok(negotiation)
    assert.equal(negotiation.applicationId, 'app-accepted-hire')
    assert.equal(negotiation.commercialTerms?.exchangeMode, 'cash')
    assert.ok(
      negotiation.commercialTerms?.amount != null
      || negotiation.commercialTerms?.currency != null,
    )

    const agree = stack.gateway.execute({
      commandType: 'AgreeNegotiation',
      aggregateId: negotiationId,
      clientRequestId: 'req-e2e-agree',
    })
    assert.equal(agree.success, true)

    const dealResult = stack.gateway.execute({
      commandType: 'CreateDealFromApplication',
      aggregateId: 'app-accepted-hire',
      negotiationId,
      clientRequestId: 'req-e2e-deal',
    })
    assert.equal(dealResult.success, true)

    const deal = stack.dealRepository.getById(dealResult.aggregateId)
    assert.ok(deal)
    assert.equal(deal.applicationId, 'app-accepted-hire')
    assert.equal(deal.negotiationId, negotiationId)
    assert.equal(deal.commercialTerms?.exchangeMode, 'cash')

    const contractResult = stack.gateway.execute({
      commandType: 'CreateContractFromDeal',
      aggregateId: deal.id,
      dealId: deal.id,
      clientRequestId: 'req-e2e-contract',
    })
    assert.equal(contractResult.success, true)

    const contract = stack.contractRepository.getById(contractResult.aggregateId)
    assert.ok(contract)
    assert.equal(contract.dealId, deal.id)
    assert.equal(contract.negotiationId, negotiationId)
    assert.equal(contract.commercialTerms?.exchangeMode, 'cash')

    const auditActions = stack.auditRepository
      .getAll()
      .map((entry) => entry.action)
    assert.ok(auditActions.includes('negotiation.started_from_application'))
    assert.ok(auditActions.includes('negotiation.agreed'))
    assert.ok(auditActions.includes('deal.created_from_application'))
    assert.ok(auditActions.includes('contract.created_from_deal'))
  })
})
