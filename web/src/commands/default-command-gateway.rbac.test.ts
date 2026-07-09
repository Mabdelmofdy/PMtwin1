import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createCommandGatewayTestStack,
  TEST_ADMIN_ACTOR,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'

const acceptedMatch = {
  id: 'pm-accepted',
  matchType: 'one_way',
  status: 'accepted',
  matchScore: 0.9,
  needOpportunityId: 'need-1',
  offerOpportunityId: 'offer-1',
  participants: [
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
  ],
  payload: {
    needOpportunityId: 'need-1',
    offerOpportunityId: 'offer-1',
  },
} as const

describe('DefaultCommandGateway RBAC', () => {
  it('blocks guarded mutation command for pending user', () => {
    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'user-pending',
          email: 'pending@test',
          role: 'company_owner',
          status: 'pending',
        },
      ],
      commandPermissionActor: {
        userId: 'user-pending',
        userRole: 'company_owner',
      },
    })

    const result = stack.gateway.execute({
      commandType: 'CreateOpportunity',
      aggregateId: 'opp-pending',
      clientRequestId: 'req-pending-create-opp',
      payload: {
        title: 'Pending should fail',
        mainCollaborationModel: 'project',
        modelType: 'project_based',
        subModelType: 'design',
        exchangeMode: 'cash',
      },
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) =>
        /Account pending review\. You can browse but cannot perform this action until approved\./i.test(
          error,
        ),
      ),
    )
  })

  it('allows guarded mutation command for active vetted user', () => {
    const discovered = {
      ...acceptedMatch,
      id: 'pm-active-accept',
      status: 'discovered',
      participants: acceptedMatch.participants.map((participant) => ({
        ...participant,
        participantStatus: 'pending',
      })),
    }

    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'user-need',
          email: 'need@test',
          role: 'professional',
          status: 'active',
        },
      ],
      postMatches: [discovered],
      commandPermissionActor: {
        userId: 'user-need',
        userRole: 'professional',
      },
    })

    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-active-accept',
      clientRequestId: 'req-active-accept',
      userId: 'user-need',
    })

    assert.equal(result.success, true)
  })

  it('rejected admin command does not mutate repository', () => {
    const stack = createCommandGatewayTestStack({
      postMatches: [acceptedMatch],
      commandPermissionActor: {
        userId: 'user-company',
        userRole: 'company_owner',
      },
    })

    const before = stack.postMatchRepository.getById('pm-accepted')?.status

    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-rbac-deny',
    })

    assert.equal(result.success, false)
    assert.ok(result.errors?.some((error) => /Admin permission required/i.test(error)))
    assert.equal(stack.postMatchRepository.getById('pm-accepted')?.status, before)
  })

  it('allowed admin command succeeds', () => {
    const stack = createCommandGatewayTestStack({
      postMatches: [acceptedMatch],
      commandPermissionActor: TEST_ADMIN_ACTOR,
    })

    const result = stack.gateway.execute({
      commandType: 'ConfirmPostMatch',
      aggregateId: 'pm-accepted',
      clientRequestId: 'req-rbac-allow',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-accepted')?.status,
      'confirmed',
    )
  })

  it('participant accept command still succeeds for non-admin actor', () => {
    const discovered = {
      ...acceptedMatch,
      id: 'pm-discovered',
      status: 'discovered',
      participants: acceptedMatch.participants.map((participant) => ({
        ...participant,
        participantStatus: 'pending',
      })),
    }

    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'user-need',
          email: 'need@test',
          role: 'professional',
          status: 'active',
        },
      ],
      postMatches: [discovered],
      commandPermissionActor: {
        userId: 'user-need',
        userRole: 'professional',
      },
    })

    const result = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-discovered',
      clientRequestId: 'req-participant-accept',
      userId: 'user-need',
    })

    assert.equal(result.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-discovered')?.status,
      'accepted',
    )
  })

  it('denied publish command does not mutate opportunity repository', () => {
    const readyDraftOpportunity = {
      id: 'opp-ready-draft',
      title: 'Architect need',
      description: 'Seeking a senior architect for a mixed-use tower delivery.',
      creatorId: 'user-1',
      intent: 'need',
      status: 'draft',
      modelType: 'project_based',
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
    }

    const stack = createCommandGatewayTestStack({
      users: [
        {
          id: 'user-1',
          email: 'owner@pmtwin.test',
          role: 'professional',
          status: 'active',
          profile: {
            name: 'Owner',
            title: 'Architect',
            skills: ['BIM'],
            services: ['Design'],
            location: 'Riyadh',
            preferredWorkMode: 'On-Site',
            caseStudies: [{ title: 'Tower' }],
            yearsExperience: 8,
            certifications: ['LEED AP BD+C'],
            previousProjects: [{ title: 'Project' }],
          },
        },
      ],
      opportunities: [readyDraftOpportunity],
      commandPermissionActor: {
        userId: 'user-other',
        userRole: 'company_owner',
      },
    })

    const result = stack.gateway.execute({
      commandType: 'TransitionOpportunityStatus',
      aggregateId: 'opp-ready-draft',
      clientRequestId: 'req-rbac-publish-deny',
      targetStatus: 'published',
    })

    assert.equal(result.success, false)
    assert.ok(
      result.errors?.some((error) =>
        /Only the opportunity owner or an admin can publish/i.test(error),
      ),
    )
    assert.equal(
      stack.opportunityRepository.getById('opp-ready-draft')?.status,
      'draft',
    )
  })
})
