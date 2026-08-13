import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractAndNormalize, timelineFit, withMatchingDefaults } from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { createCommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { publishOpportunityUiAction } from '@/lib/publish-opportunity-ui-actions.ts'
import { buildMatchDetailReadModel } from '@/lib/match-detail-read-model.ts'
import { formatPercent } from '@/lib/format.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

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

const users: PlatformUser[] = [
  {
    id: 'seed-user-need',
    email: 'need@pmtwin.test',
    role: 'professional',
    status: 'active',
    profile: { ...readyProfile, name: 'Need Owner' },
  },
  {
    id: 'seed-user-offer',
    email: 'offer@pmtwin.test',
    role: 'professional',
    status: 'active',
    profile: { ...readyProfile, name: 'Offer Owner' },
  },
]

function timelineNeed(): Opportunity {
  return {
    id: 'need-avail-end',
    creatorId: 'seed-user-need',
    createdByUserId: 'seed-user-need',
    ownerPartyId: 'party-seed-user-need',
    workspaceId: 'ws-seed-user-need',
    title: 'Need BIM Architect',
    description: 'Need a BIM-capable Architect',
    intent: 'need',
    status: 'draft',
    ...collab,
    location: 'remote',
    scope: {
      sectors: ['Construction'],
      requiredSkills: ['BIM', 'Revit'],
      coreSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-01-01',
      tenderDeadline: '2026-06-01',
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
    deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-02-01' }],
  } as Opportunity
}

function timelineOffer(availabilityEndDate: string): Opportunity {
  return {
    id: `offer-avail-end-${availabilityEndDate}`,
    creatorId: 'seed-user-offer',
    createdByUserId: 'seed-user-offer',
    ownerPartyId: 'party-seed-user-offer',
    workspaceId: 'ws-seed-user-offer',
    title: 'Offer BIM Architect',
    description: 'Offering BIM Architect services',
    intent: 'offer',
    status: 'published',
    ...collab,
    location: 'remote',
    scope: {
      sectors: ['Construction'],
      offeredSkills: ['BIM', 'Revit'],
      coreSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-01-01',
    },
    collaborationAttributes: {
      availabilityEndDate,
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
    deliveryMilestones: [{ title: 'Kickoff', dueDate: '2026-02-01' }],
  } as Opportunity
}

function expectedTimelineFit(need: Opportunity, offer: Opportunity): number {
  const needNorm = extractAndNormalize(opportunityToPost(need), {}, {
    config: engineConfig,
  })
  const offerNorm = extractAndNormalize(opportunityToPost(offer), {}, {
    config: engineConfig,
  })
  return timelineFit(needNorm, offerNorm).score
}

describe('live matching — Offer availabilityEndDate', () => {
  it('persists Timeline Fit from collaborationAttributes.availabilityEndDate and Match Details reads it', () => {
    const need = timelineNeed()
    const offer = timelineOffer('2026-06-01')
    const expectedFit = expectedTimelineFit(need, offer)
    assert.equal(expectedFit, 1)

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
    assert.ok(result.discoveredMatchesCount >= 1)

    const persisted = stack.postMatchRepository
      .getAll()
      .find(
        (match) =>
          match.needOpportunityId === need.id &&
          match.offerOpportunityId === offer.id,
      )
    assert.ok(persisted, 'expected persisted PostMatch')
    assert.equal(persisted.matchCriteria?.timelineFit, expectedFit)

    const model = buildMatchDetailReadModel(persisted, {
      getOpportunity: (id) => stack.opportunityRepository.getById(id),
    })
    assert.equal(model.scoreFactors.timelineFit, formatPercent(expectedFit))

    const storedOffer = stack.opportunityRepository.getById(offer.id)
    if (storedOffer?.collaborationAttributes) {
      storedOffer.collaborationAttributes.availabilityEndDate = '2026-03-01'
    }
    const reread = buildMatchDetailReadModel(persisted, {
      getOpportunity: (id) => stack.opportunityRepository.getById(id),
    })
    assert.equal(reread.scoreFactors.timelineFit, formatPercent(expectedFit))
  })
})
