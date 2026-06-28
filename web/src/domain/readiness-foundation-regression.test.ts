import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card.tsx'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card.tsx'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT } from '@/domain/matching-readiness-adjustment/index.ts'
import {
  buildReadinessAnalytics,
  createCreatorProfileResolver,
} from '@/domain/readiness-analytics/index.ts'
import { PUBLISH_READINESS_BLOCKED_MESSAGE } from '@/domain/publish-readiness/index.ts'
import {
  publishOpportunityUiAction,
  saveOpportunityDraftFields,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { createDealCommandService } from '@/services/deal-command-service.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createNegotiationCommandService } from '@/services/negotiation-command-service.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'

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

const incompleteProfile = {
  name: 'Draft User',
}

const readyCreator: PlatformUser = {
  id: 'user-ready',
  email: 'khalid.alharbi@pmtwin.test',
  role: 'professional',
  status: 'active',
  profile: readyCreatorProfile,
}

const readyDraftOpportunity = {
  id: 'opp-ready-draft',
  title: 'Architect need — sustainable tower',
  description: 'Seeking a senior architect for a mixed-use tower delivery.',
  creatorId: 'user-ready',
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
} as Opportunity

const weakDraftOpportunity = {
  id: 'opp-weak-draft',
  title: 'Sparse draft',
  creatorId: 'user-ready',
  intent: 'need',
  status: 'draft',
} as Opportunity

const matchParticipants = [
  {
    userId: 'user-need',
    role: 'need_owner',
    opportunityId: 'need-published',
    participantStatus: 'pending',
  },
  {
    userId: 'user-offer',
    role: 'offer_provider',
    opportunityId: 'offer-published',
    participantStatus: 'pending',
  },
] as const

function createRegressionStack(): CommandGatewayTestStack {
  return createCommandGatewayTestStack({
    users: [readyCreator],
    opportunities: [readyDraftOpportunity, weakDraftOpportunity],
  })
}

describe('Matching Readiness Foundation — regression', () => {
  it('Scenario A — blocks weak publish, preserves draft, and does not create PostMatch', () => {
    const stack = createRegressionStack()
    const opportunityCommandService = createOpportunityCommandService({
      gateway: stack.gateway,
    })

    const profileReadiness = resolveProfileReadiness(incompleteProfile, 'individual')
    const opportunityReadiness = resolveOpportunityReadiness(weakDraftOpportunity)

    assert.notEqual(profileReadiness.status, 'ready_for_matching')
    assert.notEqual(opportunityReadiness.status, 'ready_for_matching')

    const publishResult = publishOpportunityUiAction(
      weakDraftOpportunity.id,
      {
        profile: incompleteProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(weakDraftOpportunity.id),
      },
      {
        transitionOpportunityStatus: (id, status) =>
          opportunityCommandService.transitionOpportunityStatus(id, status),
      },
    )

    assert.equal(publishResult.success, false)
    if (!publishResult.success) {
      assert.equal(publishResult.message, PUBLISH_READINESS_BLOCKED_MESSAGE)
      assert.ok(publishResult.details && publishResult.details.length > 0)
    }

    const draftUpdates: Array<{ id: string; patch: Partial<Opportunity> }> = []
    saveOpportunityDraftFields(
      weakDraftOpportunity.id,
      {
        title: 'Updated weak draft title',
        status: 'published',
      },
      {
        updateOpportunity: (id, patch) => {
          draftUpdates.push({ id, patch })
          stack.opportunityRepository.update(id, patch)
        },
      },
    )

    assert.equal(
      stack.opportunityRepository.getById(weakDraftOpportunity.id)?.status,
      'draft',
    )
    assert.equal(draftUpdates[0]?.patch.title, 'Updated weak draft title')
    assert.equal(draftUpdates[0]?.patch.status, undefined)
    assert.equal(stack.postMatchRepository.getAll().length, 0)
  })

  it('Scenario B — allows ready publish without readiness error', () => {
    const stack = createRegressionStack()
    const opportunityCommandService = createOpportunityCommandService({
      gateway: stack.gateway,
    })

    const profileReadiness = resolveProfileReadiness(
      readyCreator.profile,
      'individual',
    )
    const opportunityReadiness = resolveOpportunityReadiness(readyDraftOpportunity)

    assert.equal(profileReadiness.status, 'ready_for_matching')
    assert.equal(opportunityReadiness.status, 'ready_for_matching')

    const publishResult = publishOpportunityUiAction(
      readyDraftOpportunity.id,
      {
        profile: readyCreator.profile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(readyDraftOpportunity.id),
      },
      {
        transitionOpportunityStatus: (id, status) =>
          opportunityCommandService.transitionOpportunityStatus(id, status),
      },
    )

    assert.equal(publishResult.success, true)
    assert.equal(
      stack.opportunityRepository.getById(readyDraftOpportunity.id)?.status,
      'published',
    )
  })

  it('Scenario C — matching discover stores fractional score with adjustment disabled', () => {
    assert.equal(ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT, false)

    const stack = createRegressionStack()
    const postMatchService = createPostMatchCommandService({
      gateway: stack.gateway,
    })
    const baseScore = 0.91

    const discoverResult = matchingService.discoverNeedOfferMatch(
      {
        aggregateId: 'pm-regression-discover',
        needOpportunityId: 'need-published',
        offerOpportunityId: 'offer-published',
        matchScore: baseScore,
        matchCriteria: { skillMatch: 0.9, locationFit: 0.88 },
        participants: matchParticipants,
        sourceProfile: readyCreatorProfile,
        targetProfile: readyCreatorProfile,
        sourceOpportunity: readyDraftOpportunity,
        targetOpportunity: readyDraftOpportunity,
      },
      {
        discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
        readPostMatch: (id) => stack.postMatchRepository.getById(id),
      },
    )

    assert.equal(discoverResult.success, true)
    if (!discoverResult.success) return

    assert.equal(discoverResult.postMatch.matchScore, baseScore)
    assert.equal(discoverResult.postMatch.matchScore > 0, true)
    assert.equal(discoverResult.postMatch.matchScore <= 1, true)
    assert.equal(
      matchingService.resolveDiscoverMatchScore({
        matchScore: baseScore,
        sourceProfile: readyCreatorProfile,
        targetProfile: readyCreatorProfile,
        sourceOpportunity: readyDraftOpportunity,
        targetOpportunity: readyDraftOpportunity,
      }),
      baseScore,
    )
  })

  it('Scenario D — post-publish lifecycle accept → confirm → negotiate → deal', () => {
    const stack = createRegressionStack()
    const postMatchService = createPostMatchCommandService({
      gateway: stack.gateway,
    })
    const negotiationService = createNegotiationCommandService({
      gateway: stack.gateway,
      negotiationRepository: stack.negotiationRepository,
    })
    const dealService = createDealCommandService({
      gateway: stack.gateway,
      dealRepository: stack.dealRepository,
    })

    const discoverResult = matchingService.discoverNeedOfferMatch(
      {
        aggregateId: 'pm-lifecycle',
        needOpportunityId: 'need-published',
        offerOpportunityId: 'offer-published',
        matchScore: 0.89,
        matchCriteria: { skillMatch: 0.89 },
        participants: matchParticipants,
      },
      {
        discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
        readPostMatch: (id) => stack.postMatchRepository.getById(id),
      },
    )
    assert.equal(discoverResult.success, true)
    if (!discoverResult.success) return

    const acceptNeed = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-lifecycle',
      clientRequestId: 'req-regression-accept-need',
      userId: 'user-need',
    })
    assert.equal(acceptNeed.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-lifecycle')?.status,
      'accepted',
    )

    const acceptOffer = stack.gateway.execute({
      commandType: 'AcceptPostMatch',
      aggregateId: 'pm-lifecycle',
      clientRequestId: 'req-regression-accept-offer',
      userId: 'user-offer',
    })
    assert.equal(acceptOffer.success, true)
    assert.equal(
      stack.postMatchRepository.getById('pm-lifecycle')?.status,
      'confirmed',
    )

    const { result: negotiationResult, negotiation } =
      negotiationService.startNegotiationFromPostMatch('pm-lifecycle')
    assert.equal(negotiationResult.success, true)
    assert.ok(negotiation)

    const agreeResult = negotiationService.agreeNegotiation(negotiation!.id)
    assert.equal(agreeResult.result.success, true)
    assert.equal(agreeResult.negotiation?.status, 'agreed')

    const { result: dealResult, deal } = dealService.createDealFromPostMatch(
      'pm-lifecycle',
      negotiation!.id,
    )
    assert.equal(dealResult.success, true)
    assert.ok(deal)
    assert.equal(deal?.status, 'draft')
    assert.equal(
      stack.postMatchRepository.getById('pm-lifecycle')?.dealId,
      deal?.id,
    )
  })

  it('Scenario E — admin readiness and quality analytics handle empty seed safely', () => {
    const readiness = buildReadinessAnalytics({
      profiles: [],
      opportunities: [],
      resolveProfileForOpportunity: () => null,
    })
    const quality = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [],
      negotiations: [],
      deals: [],
    })

    assert.equal(readiness.profiles.total, 0)
    assert.equal(readiness.opportunities.total, 0)
    assert.equal(quality.totalMatches, 0)
    assert.equal(quality.averageMatchScore, 0)

    const seededReadiness = buildReadinessAnalytics({
      profiles: [{ profile: readyCreatorProfile, profileKind: 'individual' }],
      opportunities: [readyDraftOpportunity],
      resolveProfileForOpportunity: createCreatorProfileResolver((id) =>
        id === readyCreator.id ? readyCreator : undefined,
      ),
    })
    const seededQuality = buildMatchingQualityAnalytics({
      profiles: [{ profile: readyCreatorProfile, profileKind: 'individual' }],
      opportunities: [readyDraftOpportunity],
      matches: [{ status: 'discovered', matchScore: 0.9 }],
      negotiations: [],
      deals: [],
    })

    assert.ok(seededReadiness.profiles.total >= 1)
    assert.ok(seededQuality.averageMatchScore > 0)
  })
})
