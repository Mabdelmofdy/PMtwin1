import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  findWorkflowAction,
  getWorkflowNextActions,
  isWorkflowActionAvailable,
  validateWorkflowTransition,
} from '../dist/index.js'

function marketplaceContext(overrides = {}) {
  return {
    primaryWorkflow: 'marketplace',
    user: {
      userId: 'user-need',
      isParticipant: true,
      canMutate: true,
    },
    postMatch: {
      id: 'pm-1',
      status: 'confirmed',
      matchType: 'one_way',
      participants: [
        {
          userId: 'user-need',
          role: 'need_owner',
          participantStatus: 'accepted',
        },
        {
          userId: 'user-offer',
          role: 'offer_provider',
          participantStatus: 'accepted',
        },
      ],
    },
    collaboration: {
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
    },
    linkage: {
      negotiationsForPostMatch: [],
      dealForNegotiation: null,
    },
    ...overrides,
  }
}

function hiringContext(overrides = {}) {
  return {
    primaryWorkflow: 'hiring',
    collaborationWorkflow: 'hiring_engagement',
    user: {
      userId: 'user-hiring',
      isOpportunityOwner: true,
      canMutate: true,
    },
    application: {
      id: 'app-1',
      status: 'accepted',
      opportunityId: 'opp-hire',
      applicantId: 'user-applicant',
    },
    collaboration: {
      mainCollaborationModel: 'hiring',
      modelType: 'hiring',
      subModelType: 'professional_hiring',
      exchangeMode: 'cash',
      collaborationAttributes: {
        jobTitle: 'PM',
        requiredExperience: '5 years',
        salaryRange: { min: 10000, max: 15000, currency: 'SAR' },
        startDate: '2026-09-01',
      },
      exchangeData: {
        budgetRange: { min: 10000, max: 15000, currency: 'SAR' },
        paymentSchedule: 'Monthly',
      },
    },
    linkage: {
      legacyApplicationsEnabled: true,
      negotiationsForApplication: [],
      dealForApplication: null,
    },
    ...overrides,
  }
}

describe('MarketplaceWorkflow', () => {
  it('exposes start negotiation for confirmed PostMatch without blocking negotiation', () => {
    const action = findWorkflowAction(
      marketplaceContext(),
      'start_negotiation_from_post_match',
    )
    assert.ok(action)
    assert.equal(action.enabled, true)
    assert.equal(action.commandType, 'StartNegotiationFromPostMatch')
  })

  it('hides start negotiation when blocking negotiation exists', () => {
    const action = findWorkflowAction(
      marketplaceContext({
        linkage: {
          negotiationsForPostMatch: [{ id: 'neg-1', status: 'active' }],
        },
      }),
      'start_negotiation_from_post_match',
    )
    assert.ok(action)
    assert.equal(action.enabled, false)
    assert.equal(isWorkflowActionAvailable(
      marketplaceContext({
        linkage: {
          negotiationsForPostMatch: [{ id: 'neg-1', status: 'active' }],
        },
      }),
      'start_negotiation_from_post_match',
    ), false)
  })

  it('blocks create deal before negotiation is agreed', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext({
        negotiation: { id: 'neg-1', status: 'active', postMatchId: 'pm-1' },
      }),
      'create_deal_from_negotiation',
    )
    assert.equal(validation.valid, false)
    assert.ok(validation.errors.some((error) => error.includes('agreed')))
  })

  it('allows create deal when negotiation is agreed', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext({
        negotiation: { id: 'neg-1', status: 'agreed', postMatchId: 'pm-1' },
        linkage: { dealForNegotiation: null },
      }),
      'create_deal_from_negotiation',
    )
    assert.equal(validation.valid, true)
  })

  it('blocks create contract before deal exists', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext(),
      'create_contract_from_deal',
    )
    assert.equal(validation.valid, false)
    assert.ok(validation.errors.some((error) => error.includes('Deal')))
  })
})

describe('HiringWorkflow', () => {
  it('exposes start hiring negotiation for accepted application', () => {
    const action = findWorkflowAction(
      hiringContext(),
      'start_negotiation_from_application',
    )
    assert.ok(action)
    assert.equal(action.label, 'Start hiring negotiation')
    assert.equal(action.enabled, true)
  })

  it('blocks start hiring negotiation before application is accepted', () => {
    const validation = validateWorkflowTransition(
      hiringContext({
        application: { id: 'app-1', status: 'reviewing', opportunityId: 'opp-hire', applicantId: 'user-applicant' },
      }),
      'start_negotiation_from_application',
    )
    assert.equal(validation.valid, false)
  })

  it('exposes create hiring deal when negotiation is agreed', () => {
    const action = findWorkflowAction(
      hiringContext({
        linkage: {
          legacyApplicationsEnabled: true,
          negotiationsForApplication: [{ id: 'neg-hire', status: 'agreed', applicationId: 'app-1' }],
        },
      }),
      'create_deal_from_application',
    )
    assert.ok(action)
    assert.equal(action.label, 'Create hiring deal')
    assert.equal(action.enabled, true)
  })
})

describe('collaboration workflow requirements', () => {
  it('blocks publish with invalid collaboration taxonomy', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext({
        opportunity: { id: 'opp-1', status: 'draft', creatorId: 'user-need' },
        user: { userId: 'user-need', isOpportunityOwner: true, canMutate: true },
        collaboration: {
          mainCollaborationModel: 'cash_subcontracting',
          subModelType: 'one_way',
          exchangeMode: 'cash',
        },
      }),
      'publish_opportunity',
    )
    assert.equal(validation.valid, false)
  })

  it('blocks barter publish without barter exchange data', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext({
        opportunity: { id: 'opp-1', status: 'draft', creatorId: 'user-need' },
        user: { userId: 'user-need', isOpportunityOwner: true, canMutate: true },
        collaboration: {
          mainCollaborationModel: 'service_exchange',
          modelType: 'strategic_partnership',
          subModelType: 'strategic_alliance',
          exchangeMode: 'barter',
          collaborationAttributes: {
            scopeOfCollaboration: 'Design exchange',
            duration: 30,
            financialTerms: 'Barter only',
          },
          exchangeData: {},
        },
      }),
      'publish_opportunity',
    )
    assert.equal(validation.valid, false)
    assert.ok(validation.errors.length > 0)
  })

  it('blocks joint venture publish without commercial terms', () => {
    const validation = validateWorkflowTransition(
      marketplaceContext({
        opportunity: { id: 'opp-1', status: 'draft', creatorId: 'user-need' },
        user: { userId: 'user-need', isOpportunityOwner: true, canMutate: true },
        collaboration: {
          mainCollaborationModel: 'joint_venture',
          modelType: 'project_based',
          subModelType: 'consortium',
          exchangeMode: 'equity',
          collaborationAttributes: {
            memberRoles: [{ role: 'Lead' }],
            requiredMembers: 3,
            minimumRequirements: [{ skill: 'PM' }],
          },
          exchangeData: {},
        },
      }),
      'publish_opportunity',
    )
    assert.equal(validation.valid, false)
    assert.ok(
      validation.errors.some((error) => error.toLowerCase().includes('equity')),
    )
  })
})

describe('getWorkflowNextActions', () => {
  it('returns visible actions with disabled reasons when needed', () => {
    const actions = getWorkflowNextActions(
      marketplaceContext({
        postMatch: {
          id: 'pm-1',
          status: 'discovered',
          participants: [{ userId: 'user-need', participantStatus: 'pending' }],
        },
      }),
    )
    assert.ok(actions.length > 0)
    assert.ok(actions.every((action) => action.visibilityReason.length > 0))
  })

  it('reports disabled publish when taxonomy is incomplete', () => {
    const action = findWorkflowAction(
      marketplaceContext({
        opportunity: { id: 'opp-1', status: 'draft', creatorId: 'user-need' },
        user: { userId: 'user-need', isOpportunityOwner: true, canMutate: true },
        collaboration: {
          mainCollaborationModel: 'cash_subcontracting',
          subModelType: 'task_based',
          exchangeMode: 'cash',
        },
      }),
      'publish_opportunity',
    )
    assert.ok(action)
    assert.equal(action.enabled, false)
    assert.ok(action.disabledReason)
  })

  it('isWorkflowActionAvailable reflects enabled actions only', () => {
    assert.equal(
      isWorkflowActionAvailable(marketplaceContext(), 'start_negotiation_from_post_match'),
      true,
    )
    assert.equal(
      isWorkflowActionAvailable(
        hiringContext({ application: { id: 'app-1', status: 'reviewing', opportunityId: 'opp', applicantId: 'u' } }),
        'start_negotiation_from_application',
      ),
      false,
    )
  })
})

describe('activate_contract decision', () => {
  it('is not exposed in the orchestrator because signing auto-activates contracts', async () => {
    const workflows = await import('@pm-twin/workflows')
    assert.equal('activate_contract' in workflows.WORKFLOW_ACTION_REGISTRY, false)
  })
})

describe('WorkflowActionHook metadata', () => {
  it('builds audit and notification metadata without side effects', async () => {
    const { buildWorkflowActionHook } = await import('../dist/index.js')
    const action = findWorkflowAction(
      hiringContext(),
      'start_negotiation_from_application',
    )
    assert.ok(action)
    const hook = buildWorkflowActionHook({
      context: hiringContext(),
      action,
      actorId: 'user-hiring',
    })
    assert.equal(hook.actionKey, 'start_negotiation_from_application')
    assert.equal(hook.commandType, 'StartNegotiationFromApplication')
    assert.equal(hook.entityType, 'application')
    assert.equal(hook.auditAction, 'negotiation.started_from_application')
    assert.equal(hook.notificationType, 'hiring.negotiation.started')
    assert.equal(hook.actorId, 'user-hiring')
  })
})
