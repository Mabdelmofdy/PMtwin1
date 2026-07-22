import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'node:test'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
  TEST_ADMIN_ACTOR,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import {
  CONTRACT_LIFECYCLE_DRAG_MESSAGE,
  pipelineOpportunityDrop,
} from '@/lib/pipeline-opportunity-drop.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { dealService } from '@/services/deal-service.ts'
import { LIFECYCLE_STATUS_BYPASS_ERROR } from '@/lib/lifecycle-status-guard.ts'
import { PUBLISH_READINESS_BLOCKED_CODE, PUBLISH_READINESS_BLOCKED_MESSAGE } from '@/domain/publish-readiness/index.ts'
import {
  publishOpportunityUiAction,
  saveOpportunityDraftFields,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'

const readyCreatorProfile = {
  name: 'Khalid Al-Harbi',
  title: 'Senior Architect',
  skills: ['BIM', 'Sustainable Design'],
  services: ['Architectural Design'],
  location: 'Riyadh, Saudi Arabia',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Riyadh Mixed-Use Tower' }],
  yearsExperience: 9,
  certifications: ['LEED AP BD+C'],
  previousProjects: [{ title: 'NEOM Pavilion' }],
}

const readyCreator: PlatformUser = {
  id: 'user-1',
  email: 'khalid.alharbi@pmtwin.test',
  role: 'professional',
  status: 'active',
  profile: readyCreatorProfile,
}

const readyDraftOpportunity = {
  id: 'opp-ready-draft',
  title: 'Architect need — sustainable tower',
  description: 'Seeking a senior architect for a mixed-use tower delivery.',
  creatorId: 'user-1',
  intent: 'need',
  status: 'draft',
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  acceptedExchangeModes: ['cash'],
  location: 'Riyadh, Saudi Arabia',
  scope: {
    sectors: ['Construction', 'Architecture'],
    requiredSkills: ['BIM', 'Sustainable Design', 'LEED Certification'],
  },
  attributes: {
    targetRole: 'Architect',
    startDate: '2026-03-01',
    tenderDeadline: '2026-06-01',
  },
  normalized: {
    requiredServices: ['Architectural Design', 'BIM Coordination'],
  },
  exchangeData: {
    budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
  },
  preferredPartnerType: 'company',
  attachments: [{ name: 'design-brief.pdf' }],
  complianceRequirements: ['Saudi Building Code'],
  deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-04-01' }],
} as Opportunity

function opportunityFixture(id: string, status: string): Opportunity {
  return {
    id,
    title: `Opportunity ${id}`,
    status,
    creatorId: 'user-1',
    intent: 'need',
    mainCollaborationModel: 'cash_subcontracting',
    modelType: 'project_based',
    subModelType: 'task_based',
    exchangeMode: 'cash',
  }
}

describe('OpportunityCommandHandler', () => {
  let stack: CommandGatewayTestStack

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [
        opportunityFixture('opp-draft', 'draft'),
        opportunityFixture('opp-published', 'published'),
        opportunityFixture('opp-completed', 'completed'),
        readyDraftOpportunity,
      ],
    })
  })

  it('blocks publish when profile and opportunity readiness are incomplete', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-draft',
      clientRequestId: 'req-opp-publish-blocked',
      targetStatus: 'published',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.[0]?.includes(PUBLISH_READINESS_BLOCKED_MESSAGE))
    assert.equal(
      stack.opportunityRepository.getById('opp-draft')?.status,
      'draft',
    )
  })

  it('allows publish when profile and opportunity readiness are ready_for_matching', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-ready-draft',
      clientRequestId: 'req-opp-publish-allowed',
      targetStatus: 'published',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.opportunityRepository.getById('opp-ready-draft')?.status,
      'published',
    )
  })

  it('owner can publish own opportunity', () => {
    const ownerStack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [readyDraftOpportunity],
      commandPermissionActor: {
        userId: 'user-1',
        userRole: 'professional',
      },
    })

    const result = ownerStack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-ready-draft',
      clientRequestId: 'req-owner-publish',
      targetStatus: 'published',
    })

    assert.equal(result.success, true)
    assert.equal(
      ownerStack.opportunityRepository.getById('opp-ready-draft')?.status,
      'published',
    )
  })

  it('non-owner cannot publish', () => {
    const ownerStack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [readyDraftOpportunity],
      commandPermissionActor: {
        userId: 'user-other',
        userRole: 'company_owner',
      },
    })

    const result = ownerStack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-ready-draft',
      clientRequestId: 'req-non-owner-publish',
      targetStatus: 'published',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) =>
        /Only the opportunity owner or an admin can publish/i.test(error),
      ),
    )
    assert.equal(
      ownerStack.opportunityRepository.getById('opp-ready-draft')?.status,
      'draft',
    )
  })

  it('admin can publish', () => {
    const adminStack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [readyDraftOpportunity],
      commandPermissionActor: TEST_ADMIN_ACTOR,
    })

    const result = adminStack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-ready-draft',
      clientRequestId: 'req-admin-publish',
      targetStatus: 'published',
    })

    assert.equal(result.success, true)
    assert.equal(
      adminStack.opportunityRepository.getById('opp-ready-draft')?.status,
      'published',
    )
  })

  it('denied publish does not transition status', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-draft',
      clientRequestId: 'req-denied-publish',
      targetStatus: 'published',
    })

    assert.equal(result.success, false)
    assert.equal(
      stack.opportunityRepository.getById('opp-draft')?.status,
      'draft',
    )
  })

  it('non-publish transitions follow existing rules without publish RBAC', () => {
    const ownerStack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [
        {
          ...readyDraftOpportunity,
          id: 'opp-published-transition',
          status: 'published',
        },
      ],
      commandPermissionActor: {
        userId: 'user-other',
        userRole: 'professional',
      },
    })

    const result = ownerStack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-published-transition',
      clientRequestId: 'req-non-publish-transition',
      targetStatus: 'matched',
    })

    assert.equal(result.success, true)
    assert.equal(
      ownerStack.opportunityRepository.getById('opp-published-transition')?.status,
      'matched',
    )
  })

  it('invalid transition rejects', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-published',
      clientRequestId: 'req-opp-invalid',
      targetStatus: 'draft',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('not allowed')))
  })

  it('terminal opportunity transition rejects', () => {
    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-completed',
      clientRequestId: 'req-opp-terminal',
      targetStatus: 'published',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => error.includes('terminal')))
  })
})

describe('pipelineOpportunityDrop command routing', () => {
  let stack: CommandGatewayTestStack
  let commandService: ReturnType<typeof createOpportunityCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [
        readyDraftOpportunity,
        {
          id: 'opp-exec',
          title: 'Executing opp',
          status: 'executing',
          creatorId: 'user-1',
          intent: 'need',
        },
      ],
    })
    commandService = createOpportunityCommandService({ gateway: stack.gateway })
  })

  it('pipeline drag uses opportunity command service and triggers matching when readiness passes', () => {
    let matchingCalled = false
    const commandServiceWithMatching = createOpportunityCommandService({
      gateway: stack.gateway,
      runPublishMatching: () => {
        matchingCalled = true
        return {
          discoveredMatchesCount: 1,
          skippedDuplicatesCount: 0,
          matchingErrors: [],
          postMatchIds: ['pm-test'],
        }
      },
      runCircularMatching: () => ({
        discoveredMatchesCount: 0,
        skippedDuplicatesCount: 0,
        matchingErrors: [],
        postMatchIds: [],
      }),
    })
    const result = pipelineOpportunityDrop('opp-ready-draft', 'published', {
      readOpportunity: (id) => stack.opportunityRepository.getById(id),
      resolvePublishReadinessContext: (opportunity) => ({
        profile: readyCreator.profile,
        profileKind: 'individual',
        opportunity,
      }),
      transitionToPublished: (id) =>
        commandServiceWithMatching.transitionToPublished(id),
    })

    assert.equal(result.success, true)
    assert.equal(matchingCalled, true)
    assert.equal(
      stack.opportunityRepository.getById('opp-ready-draft')?.status,
      'published',
    )
    if (result.success) {
      assert.equal(result.matching?.discoveredMatchesCount, 1)
    }
  })

  it('pipeline drag blocks publish when readiness fails', () => {
    const blockedStack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [opportunityFixture('opp-1', 'draft')],
      commandPermissionActor: {
        userId: 'user-1',
        userRole: 'company_owner',
      },
    })
    const blockedService = createOpportunityCommandService({
      gateway: blockedStack.gateway,
    })

    const result = pipelineOpportunityDrop('opp-1', 'published', {
      readOpportunity: (id) => blockedStack.opportunityRepository.getById(id),
      resolvePublishReadinessContext: (opportunity) => ({
        profile: readyCreator.profile,
        profileKind: 'individual',
        opportunity,
      }),
      transitionOpportunityStatus: (id, status) =>
        blockedService.transitionOpportunityStatus(id, status),
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.ok(result.message.includes(PUBLISH_READINESS_BLOCKED_MESSAGE))
    }
    assert.equal(
      blockedStack.opportunityRepository.getById('opp-1')?.status,
      'draft',
    )
  })

  it('pipeline drag does not call dealService.updateOpportunityStatus', () => {
    assert.throws(() => dealService.updateOpportunityStatus('opp-ready-draft', 'published'), {
      message: LIFECYCLE_STATUS_BYPASS_ERROR,
    })
  })

  it('executing/completed/cancelled guard still works', () => {
    const result = pipelineOpportunityDrop('opp-exec', 'in_progress', {
      readOpportunity: (id) => stack.opportunityRepository.getById(id),
      transitionOpportunityStatus: (id, status) =>
        commandService.transitionOpportunityStatus(id, status),
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(result.message, CONTRACT_LIFECYCLE_DRAG_MESSAGE)
    }
  })
})

describe('publish opportunity UI actions', () => {
  let stack: CommandGatewayTestStack
  let commandService: ReturnType<typeof createOpportunityCommandService>

  beforeEach(() => {
    stack = createCommandGatewayTestStack({
      users: [readyCreator],
      opportunities: [readyDraftOpportunity, opportunityFixture('opp-draft', 'draft')],
    })
    commandService = createOpportunityCommandService({ gateway: stack.gateway })
  })

  it('blocks publish UI action when readiness fails', () => {
    const result = publishOpportunityUiAction(
      'opp-draft',
      {
        profile: readyCreator.profile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById('opp-draft'),
      },
      {
        transitionOpportunityStatus: (id, status) =>
          commandService.transitionOpportunityStatus(id, status),
      },
    )

    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
      assert.equal(result.message, PUBLISH_READINESS_BLOCKED_MESSAGE)
      assert.ok(result.details?.some((line) => line.includes('Opportunity missing:')))
      assert.equal(result.opportunityReadiness?.status, 'incomplete')
    }
  })

  it('allows publish UI action when readiness passes', () => {
    const result = publishOpportunityUiAction(
      'opp-ready-draft',
      {
        profile: readyCreator.profile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById('opp-ready-draft'),
      },
      {
        transitionToPublished: (id) => commandService.transitionToPublished(id),
      },
    )

    assert.equal(result.success, true)
    assert.equal(
      stack.opportunityRepository.getById('opp-ready-draft')?.status,
      'published',
    )
  })

  it('save draft remains allowed without changing status', () => {
    const updates: Array<{ id: string; patch: Partial<Opportunity> }> = []
    saveOpportunityDraftFields(
      'opp-draft',
      {
        title: 'Updated draft title',
        description: 'Updated description',
        status: 'published',
      },
      {
        updateOpportunity: (id, patch) => {
          updates.push({ id, patch })
        },
      },
    )

    assert.equal(updates.length, 1)
    assert.equal(updates[0]?.id, 'opp-draft')
    assert.equal(updates[0]?.patch.title, 'Updated draft title')
    assert.equal(updates[0]?.patch.status, undefined)

    assert.doesNotThrow(() => {
      opportunitiesApi.update('opp-ready-draft', {
        title: 'Saved draft title only',
      })
    })
  })
})
