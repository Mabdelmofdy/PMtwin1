import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Application, Opportunity, PostMatch } from '@/types/domain.ts'
import {
  buildWorkflowContext,
  findWorkflowAction,
  getWorkflowNextActions,
  isWorkflowActionAvailable,
  validateWorkflowTransition,
} from '@/domain/workflows/workflow-bridge.ts'
import { canShowStartHiringNegotiation } from '@/lib/application-hiring-ui-actions.ts'
import { canShowPublishOpportunity } from '@/lib/publish-opportunity-ui-actions.ts'
import { buildMatchCardActions } from '@/lib/opportunity-matches-read-model.ts'
import { canShowStartNegotiationFromPostMatch } from '@/lib/start-negotiation-ui-actions.ts'
import { canCreateContractFromDeal } from '@/lib/deal-detail-read-model.ts'

const confirmedMatch: PostMatch = {
  id: 'pm-1',
  status: 'confirmed',
  matchType: 'one_way',
  participants: [
    { userId: 'user-a', role: 'need_owner', participantStatus: 'accepted' },
    { userId: 'user-b', role: 'offer_provider', participantStatus: 'accepted' },
  ],
}

const acceptedApplication: Application = {
  id: 'app-1',
  opportunityId: 'opp-1',
  applicantId: 'user-applicant',
  status: 'accepted',
}

const draftOpportunity = {
  id: 'opp-draft',
  title: 'Draft need',
  status: 'draft',
  creatorId: 'user-owner',
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  collaborationAttributes: {
    detailedScope: 'Scope',
    requiredSkills: ['PM'],
    duration: 30,
    startDate: '2026-08-01',
  },
  exchangeData: {
    budgetRange: { min: 1000, max: 2000, currency: 'SAR' },
    paymentSchedule: 'Milestone',
  },
} as Opportunity

describe('workflow UI bridge', () => {
  it('delegates marketplace start negotiation visibility to orchestrator', () => {
    assert.equal(
      canShowStartNegotiationFromPostMatch(confirmedMatch, {
        getNegotiationsForPostMatch: () => [],
      }),
      true,
    )
  })

  it('delegates hiring start negotiation visibility to orchestrator', () => {
    assert.equal(
      canShowStartHiringNegotiation(acceptedApplication, {
        getNegotiationsForApplication: () => [],
        findDealByApplicationId: () => undefined,
        legacyApplicationsEnabled: true,
      }),
      true,
    )
  })

  it('exposes orchestrator labels for hiring actions', () => {
    const action = findWorkflowAction(
      buildWorkflowContext({
        primaryWorkflow: 'hiring',
        application: acceptedApplication,
        user: { userId: 'owner', canMutate: true, isOpportunityOwner: true },
        linkage: { legacyApplicationsEnabled: true, negotiationsForApplication: [] },
      }),
      'start_negotiation_from_application',
    )
    assert.equal(action?.label, 'Start hiring negotiation')
    assert.equal(action?.commandType, 'StartNegotiationFromApplication')
  })

  it('uses orchestrator for create contract visibility on deals', () => {
    assert.equal(
      canCreateContractFromDeal(
        {
          id: 'deal-1',
          status: 'draft',
          negotiationId: 'neg-1',
          title: 'Deal',
        },
        [],
        { canMutate: true },
      ),
      true,
    )
  })

  it('blocks create contract when active contract exists', () => {
    assert.equal(
      canCreateContractFromDeal(
        {
          id: 'deal-1',
          status: 'draft',
          negotiationId: 'neg-1',
          title: 'Deal',
        },
        [{ id: 'contract-1', status: 'draft', dealId: 'deal-1' }],
        { canMutate: true },
      ),
      false,
    )
  })

  it('walks marketplace workflow actions from publish through deal creation', () => {
    const publishContext = buildWorkflowContext({
      opportunity: draftOpportunity,
      user: {
        userId: 'user-owner',
        canMutate: true,
        isOpportunityOwner: true,
      },
    })
    assert.equal(
      Boolean(findWorkflowAction(publishContext, 'publish_opportunity')),
      true,
    )

    const matchContext = buildWorkflowContext({
      postMatch: confirmedMatch,
      user: { userId: 'user-a', canMutate: true, isParticipant: true },
      linkage: { negotiationsForPostMatch: [] },
    })
    const marketplaceActions = getWorkflowNextActions(matchContext).map((a) => a.key)
    assert.ok(marketplaceActions.includes('start_negotiation_from_post_match'))

    const dealContext = buildWorkflowContext({
      negotiation: {
        id: 'neg-1',
        status: 'agreed',
        postMatchId: 'pm-1',
        opportunityId: 'opp-1',
        participants: [],
      },
      postMatch: confirmedMatch,
      user: { userId: 'user-a', canMutate: true, isParticipant: true },
      linkage: { dealForNegotiation: null },
    })
    assert.equal(
      isWorkflowActionAvailable(dealContext, 'create_deal_from_negotiation'),
      true,
    )
  })

  it('walks hiring workflow from accepted application to deal creation', () => {
    const startContext = buildWorkflowContext({
      primaryWorkflow: 'hiring',
      application: acceptedApplication,
      user: { userId: 'owner', canMutate: true, isOpportunityOwner: true },
      linkage: { legacyApplicationsEnabled: true, negotiationsForApplication: [] },
    })
    assert.equal(
      isWorkflowActionAvailable(startContext, 'start_negotiation_from_application'),
      true,
    )

    const dealContext = buildWorkflowContext({
      primaryWorkflow: 'hiring',
      application: acceptedApplication,
      negotiation: {
        id: 'neg-hire',
        status: 'agreed',
        applicationId: 'app-1',
        opportunityId: 'opp-1',
        participants: [],
      },
      user: { userId: 'owner', canMutate: true, isOpportunityOwner: true },
      linkage: {
        legacyApplicationsEnabled: true,
        negotiationsForApplication: [
          { id: 'neg-hire', status: 'agreed', applicationId: 'app-1' },
        ],
      },
    })
    assert.equal(
      isWorkflowActionAvailable(dealContext, 'create_deal_from_application'),
      true,
    )
  })

  it('blocks invalid transitions such as deal before agreed negotiation', () => {
    const result = validateWorkflowTransition(
      buildWorkflowContext({
        negotiation: {
          id: 'neg-active',
          status: 'active',
          postMatchId: 'pm-1',
          opportunityId: 'opp-1',
          participants: [],
        },
        user: { userId: 'user-a', canMutate: true },
        linkage: { dealForNegotiation: null },
      }),
      'create_deal_from_negotiation',
    )
    assert.equal(result.valid, false)
    assert.match(result.errors.join(' '), /agreed/i)
  })

  it('delegates publish visibility to orchestrator for draft owner opportunities', () => {
    assert.equal(
      canShowPublishOpportunity(draftOpportunity, {
        userId: 'user-owner',
        canMutate: true,
        isOpportunityOwner: true,
      }),
      true,
    )
    assert.equal(
      canShowPublishOpportunity(
        { ...draftOpportunity, status: 'published' },
        {
          userId: 'user-owner',
          canMutate: true,
          isOpportunityOwner: true,
        },
      ),
      false,
    )
  })

  it('builds match card actions from orchestrator without duplicate helpers', () => {
    const actions = buildMatchCardActions(confirmedMatch, {
      currentUserId: 'user-a',
      canMutate: true,
      getNegotiationsForPostMatch: () => [],
    })
    assert.equal(actions.showStartNegotiation, true)
    assert.equal(
      actions.showStartNegotiation,
      canShowStartNegotiationFromPostMatch(confirmedMatch, {
        getNegotiationsForPostMatch: () => [],
        userId: 'user-a',
      }),
    )
  })
})
