import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { withMatchingDefaults } from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { createCommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { publishOpportunityUiAction } from '@/lib/publish-opportunity-ui-actions.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import { setCommandPermissionActor, resetCommandPermissionActorForTests } from '@/domain/rbac/context/command-permission-context.ts'

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
})

const readyProfile = {
  name: 'Khalid Al-Harbi',
  title: 'Senior Architect',
  skills: ['BIM', 'Revit'],
  services: ['Architectural Design'],
  location: 'Riyadh, Saudi Arabia',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Riyadh Mixed-Use Tower' }],
  yearsExperience: 9,
  certifications: ['LEED AP BD+C'],
  previousProjects: [{ title: 'NEOM Pavilion' }],
}

const collab = {
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  acceptedExchangeModes: ['cash'],
} as const

function blankOwnerNeed(id: string, creatorId: string): Opportunity {
  return {
    id,
    creatorId,
    createdByUserId: creatorId,
    // Bug reproduction: blank strings used to block legacy ownership fallback.
    ownerPartyId: '',
    workspaceId: '',
    title: 'UAT Need — BIM Architect for Riyadh tower',
    description: 'Need a BIM-capable Architect',
    intent: 'need',
    status: 'draft',
    ...collab,
    location: 'sa/riyadh/riyadh-city',
    coverageAreas: ['sa/riyadh'],
    scope: {
      sectors: ['Construction'],
      requiredSkills: ['BIM', 'Revit'],
      coreSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-08-01',
      tenderDeadline: '2026-12-31',
    },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
    },
    exchangeData: {
      budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
    },
    value_exchange: { mode: 'cash', accepted_modes: ['cash'] },
  } as Opportunity
}

function blankOwnerOffer(id: string, creatorId: string): Opportunity {
  return {
    ...blankOwnerNeed(id, creatorId),
    title: 'UAT Offer — BIM Architect delivery',
    description: 'Offering BIM Architect services',
    intent: 'offer',
    status: 'published',
    scope: {
      sectors: ['Construction'],
      offeredSkills: ['BIM', 'Revit'],
      coreSkills: ['BIM', 'Revit'],
    },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
    },
  } as Opportunity
}

describe('blank ownership ids do not block publish auto-matching', () => {
  it('creates PostMatch + notifications when ownerPartyId/workspaceId are blank strings', () => {
    const users: PlatformUser[] = [
      {
        id: 'seed-user-001',
        email: 'khalid.alharbi@pmtwin.test',
        role: 'professional',
        status: 'active',
        profile: { ...readyProfile, name: 'Khalid Al-Harbi' },
      },
      {
        id: 'seed-user-002',
        email: 'sara.almutairi@pmtwin.test',
        role: 'professional',
        status: 'active',
        profile: { ...readyProfile, name: 'Sara Al-Mutairi' },
      },
    ]

    const need = blankOwnerNeed('need-blank-owner', 'seed-user-001')
    const offer = blankOwnerOffer('offer-blank-owner', 'seed-user-002')
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users,
    })

    setCommandPermissionActor({
      userId: 'seed-user-001',
      userRole: 'professional',
      // Simulate broken session recovery that previously wrote ''.
      activePartyId: '',
      activeWorkspaceId: undefined,
    })

    try {
      const postMatchService = createPostMatchCommandService({
        gateway: stack.gateway,
      })
      const matchingDeps = {
        getOpportunityById: (id: string) => stack.opportunityRepository.getById(id),
        listPublishedOpportunities: () =>
          stack.opportunityRepository
            .getAll()
            .filter((opp) => opp.status === 'published'),
        discoverPostMatch:
          postMatchService.discoverPostMatch.bind(postMatchService),
        findActiveDuplicateByStrongKey: (strongKey: string) =>
          stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
        getMatchingEngineContext: () => ({
          canonical: {},
          config: engineConfig,
        }),
      }
      const opportunityCommandService = createOpportunityCommandService({
        gateway: stack.gateway,
        runPublishMatching: (opportunityId: string) =>
          matchingService.runPublishMatchingForOpportunity(
            opportunityId,
            matchingDeps,
          ),
        runCircularMatching: (opportunityId: string) =>
          matchingService.runCircularMatchingForOpportunity(
            opportunityId,
            matchingDeps,
          ),
      })

      const result = publishOpportunityUiAction(
        need.id,
        {
          profile: readyProfile,
          profileKind: 'individual',
          opportunity: stack.opportunityRepository.getById(need.id),
        },
        {
          transitionToPublished: (id) =>
            opportunityCommandService.transitionToPublished(id),
        },
      )

      assert.equal(result.success, true, JSON.stringify(result))
      if (!result.success) return
      assert.ok(
        result.discoveredMatchesCount >= 1,
        `expected discoveries, got ${JSON.stringify(result)}`,
      )
      assert.ok(stack.postMatchRepository.getAll().length >= 1)

      const notifications = stack.notificationRepository.getAll()
      assert.ok(
        notifications.some(
          (n) =>
            n.type === 'new_match_found' && n.userId === 'seed-user-001',
        ),
      )
      assert.ok(
        notifications.some(
          (n) =>
            n.type === 'new_match_found' && n.userId === 'seed-user-002',
        ),
      )
    } finally {
      resetCommandPermissionActorForTests()
    }
  })
})
