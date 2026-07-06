import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Application, Negotiation, Opportunity } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import { createNegotiationCommandService } from '@/services/negotiation-command-service.ts'
import {
  canShowCreateHiringDeal,
  canShowStartHiringNegotiation,
  createHiringDealFromApplicationUiAction,
  startHiringNegotiationFromApplicationUiAction,
} from '@/lib/application-hiring-ui-actions.ts'

const hiringOpportunity: Opportunity = {
  id: 'opp-hiring',
  title: 'Senior PM hire',
  status: 'published',
  creatorId: 'user-hiring',
  mainCollaborationModel: 'hiring',
  modelType: 'hiring',
  subModelType: 'professional_hiring',
  exchangeMode: 'cash',
}

const acceptedApplication: Application = {
  id: 'app-accepted-hire',
  opportunityId: 'opp-hiring',
  applicantId: 'user-applicant',
  status: 'accepted',
}

describe('application hiring UI actions', () => {
  let stack: CommandGatewayTestStack
  let negotiationService: ReturnType<typeof createNegotiationCommandService>
  let dealService: ReturnType<typeof createDealCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      opportunities: [hiringOpportunity],
      applications: [acceptedApplication],
    })
    negotiationService = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
    dealService = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })
  })

  function uiDeps() {
    return {
      legacyApplicationsEnabled: true,
      startNegotiationFromApplication: (applicationId: string) =>
        negotiationService.startNegotiationFromApplication(applicationId, {
          gateway: stack.gateway,
          negotiationRepository: stack.negotiationRepository,
        }),
      createDealFromApplication: (
        applicationId: string,
        negotiationId: string,
      ) =>
        dealService.createDealFromApplication(applicationId, negotiationId, {
          gateway: stack.gateway,
          dealRepository: stack.dealRepository,
        }),
      getNegotiationsForApplication: (applicationId: string) =>
        stack.negotiationRepository.getByApplicationId(applicationId),
      findDealByApplicationId: (applicationId: string) =>
        stack.dealRepository.findByApplicationId(applicationId),
      getApplication: (applicationId: string) =>
        stack.applicationRepository.getById(applicationId),
      getOpportunity: (opportunityId: string) =>
        stack.opportunityRepository.getById(opportunityId),
    }
  }

  it('shows start hiring negotiation for accepted application without active negotiation', () => {
    assert.equal(
      canShowStartHiringNegotiation(acceptedApplication, uiDeps()),
      true,
    )
  })

  it('hides start hiring negotiation when active negotiation exists', () => {
    const negotiation: Negotiation = {
      id: 'neg-active-app',
      applicationId: 'app-accepted-hire',
      opportunityId: 'opp-hiring',
      status: 'active',
      participants: [],
    }
    stack = createCommandGatewayTestStack({
      opportunities: [hiringOpportunity],
      applications: [acceptedApplication],
      negotiations: [negotiation],
    })
    assert.equal(
      canShowStartHiringNegotiation(acceptedApplication, {
        getNegotiationsForApplication: (id) =>
          stack.negotiationRepository.getByApplicationId(id),
        findDealByApplicationId: (id) =>
          stack.dealRepository.findByApplicationId(id),
        legacyApplicationsEnabled: true,
      }),
      false,
    )
  })

  it('hides start hiring negotiation when agreed negotiation exists', () => {
    const negotiation: Negotiation = {
      id: 'neg-agreed-app',
      applicationId: 'app-accepted-hire',
      opportunityId: 'opp-hiring',
      status: 'agreed',
      participants: [],
    }
    assert.equal(
      canShowStartHiringNegotiation(acceptedApplication, {
        getNegotiationsForApplication: () => [negotiation],
        findDealByApplicationId: () => undefined,
        legacyApplicationsEnabled: true,
      }),
      false,
    )
  })

  it('shows create hiring deal when negotiation is agreed and no deal exists', () => {
    const negotiation: Negotiation = {
      id: 'neg-agreed-app',
      applicationId: 'app-accepted-hire',
      opportunityId: 'opp-hiring',
      status: 'agreed',
      participants: [],
    }
    stack = createCommandGatewayTestStack({
      opportunities: [hiringOpportunity],
      applications: [{ ...acceptedApplication, negotiationId: negotiation.id }],
      negotiations: [negotiation],
    })
    assert.equal(
      canShowCreateHiringDeal(
        { ...acceptedApplication, negotiationId: negotiation.id },
        {
          getNegotiationsForApplication: (id) =>
            stack.negotiationRepository.getByApplicationId(id),
          findDealByApplicationId: (id) =>
            stack.dealRepository.findByApplicationId(id),
          legacyApplicationsEnabled: true,
        },
      ),
      true,
    )
  })

  it('starts hiring negotiation through command service', () => {
    const result = startHiringNegotiationFromApplicationUiAction(
      'app-accepted-hire',
      uiDeps(),
    )
    assert.equal(result.success, true)
    if (!result.success) return
    assert.ok(result.negotiationId)
  })

  it('creates hiring deal through command service', () => {
    const start = startHiringNegotiationFromApplicationUiAction(
      'app-accepted-hire',
      uiDeps(),
    )
    assert.equal(start.success, true)
    if (!start.success) return

    stack.gateway.execute({
      commandType: 'AgreeNegotiation',
      aggregateId: start.negotiationId,
      clientRequestId: 'req-agree-ui',
    })

    const result = createHiringDealFromApplicationUiAction(
      'app-accepted-hire',
      start.negotiationId,
      uiDeps(),
    )
    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.deal.applicationId, 'app-accepted-hire')
  })
})
