import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { withMatchingDefaults } from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { createCommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { publishOpportunityUiAction } from '@/lib/publish-opportunity-ui-actions.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
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

/** Legacy wizard shape (role+skills, location only on top-level). */
function wizardNeed(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'draft',
): Opportunity {
  return {
    id,
    creatorId,
    createdByUserId: creatorId,
    ownerPartyId: `party-${creatorId}`,
    workspaceId: `ws-${creatorId}`,
    title: 'UAT Need — BIM Architect for Riyadh tower',
    description: 'Need a BIM-capable Architect',
    intent: 'need',
    status,
    ...collab,
    location: 'Riyadh',
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
    preferredPartnerType: 'company',
    attachments: [{ name: 'design-brief.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-09-01' }],
  } as Opportunity
}

function wizardOffer(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'published',
): Opportunity {
  return {
    id,
    creatorId,
    createdByUserId: creatorId,
    ownerPartyId: `party-${creatorId}`,
    workspaceId: `ws-${creatorId}`,
    title: 'UAT Offer — BIM Architect delivery (Revit)',
    description: 'Offering BIM Architect services',
    intent: 'offer',
    status,
    ...collab,
    location: 'Riyadh',
    scope: {
      sectors: ['Construction'],
      offeredSkills: ['BIM', 'Revit'],
      coreSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-08-01',
      tenderDeadline: '2026-12-31',
    },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
    },
    exchangeData: {
      budgetRange: { min: 120_000, max: 350_000, currency: 'SAR' },
    },
    preferredPartnerType: 'company',
    attachments: [{ name: 'portfolio.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Kickoff', dueDate: '2026-09-01' }],
  } as Opportunity
}

describe('wizard-shaped Khalid/Sara publish matching', () => {
  it('creates one_way PostMatch when Offer already published and Need publishes', () => {
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

    const need = wizardNeed('need-khalid', 'seed-user-001', 'draft')
    const offer = wizardOffer('offer-sara', 'seed-user-002', 'published')
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users,
    })

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
  })

  it('creates one_way PostMatch when Need already published and Offer publishes', () => {
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

    const need = wizardNeed('need-khalid-2', 'seed-user-001', 'published')
    const offer = wizardOffer('offer-sara-2', 'seed-user-002', 'draft')
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users,
    })

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
      offer.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(offer.id),
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
  })
})
