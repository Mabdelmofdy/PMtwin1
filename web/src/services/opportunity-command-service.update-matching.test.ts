import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { CommandResult } from '@pm-twin/commands'
import type { Negotiation, Opportunity, PlatformUser, PostMatch } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import {
  createOpportunityCommandService,
} from '@/services/opportunity-command-service.ts'
import { matchingService, type PublishMatchingResult } from '@/services/matching-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import { withMatchingDefaults } from '@pm-twin/matching'
import { hasMatchingInputChanged } from '@/services/matching/matching-fingerprint.ts'

const emptyMatching: PublishMatchingResult = {
  discoveredMatchesCount: 0,
  skippedDuplicatesCount: 0,
  matchingErrors: [],
  postMatchIds: [],
}

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
})

const fingerprintContext = { canonical: {}, config: engineConfig }

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

function publishedNeed(
  id: string,
  creatorId: string,
  requiredSkills: string[],
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    id,
    creatorId,
    createdByUserId: creatorId,
    ownerPartyId: `party-individual-${creatorId}`,
    workspaceId: `ws-personal-${creatorId}`,
    title: `Need ${id}`,
    description: 'Architectural delivery need with BIM scope.',
    intent: 'need',
    status: 'published',
    ...collab,
    location: 'remote',
    scope: {
      sectors: ['Construction', 'Architecture'],
      requiredSkills,
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role: 'Architect',
      requiredServices: requiredSkills,
      skills: requiredSkills,
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: {
      budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
    },
    ...overrides,
  } as Opportunity
}

function publishedOffer(
  id: string,
  creatorId: string,
  offeredSkills: string[],
): Opportunity {
  return {
    id,
    creatorId,
    createdByUserId: creatorId,
    ownerPartyId: `party-individual-${creatorId}`,
    workspaceId: `ws-personal-${creatorId}`,
    title: `Offer ${id}`,
    description: 'Architectural offer with BIM capability.',
    intent: 'offer',
    status: 'published',
    ...collab,
    location: 'remote',
    scope: {
      sectors: ['Construction', 'Architecture'],
      offeredSkills,
      requiredSkills: offeredSkills,
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role: 'Architect',
      offeredServices: offeredSkills,
      requiredServices: offeredSkills,
      skills: offeredSkills,
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: {
      budgetRange: { min: 120_000, max: 350_000, currency: 'SAR' },
    },
  } as Opportunity
}

const testUsers: PlatformUser[] = [
  {
    id: 'user-need',
    email: 'need@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'user-offer',
    email: 'offer@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
]

function successCommand(aggregateId: string): CommandResult {
  return {
    success: true,
    aggregateId,
    commandType: 'UpdateOpportunity',
  }
}

function spyUpdateService(input: {
  readonly before: Opportunity
  readonly after: Opportunity
  readonly commandSuccess?: boolean
}) {
  let stored = input.before
  let publishCalls = 0
  let circularCalls = 0
  const service = createOpportunityCommandService({
    gateway: {
      execute: () => {
        if (input.commandSuccess === false) {
          return {
            success: false,
            aggregateId: input.before.id,
            commandType: 'UpdateOpportunity',
            errors: ['blocked'],
          }
        }
        stored = input.after
        return successCommand(input.before.id)
      },
    } as never,
    getOpportunityById: () => stored,
    runPublishMatching: () => {
      publishCalls += 1
      return emptyMatching
    },
    runCircularMatching: () => {
      circularCalls += 1
      return emptyMatching
    },
  })
  return {
    service,
    calls: () => ({ publishCalls, circularCalls }),
  }
}

function matchingDeps(stack: CommandGatewayTestStack) {
  const postMatchService = createPostMatchCommandService({
    gateway: stack.gateway,
  })
  return {
    getOpportunityById: (id: string) => stack.opportunityRepository.getById(id),
    listPublishedOpportunities: () =>
      stack.opportunityRepository
        .getAll()
        .filter((opp) => opp.status === 'published'),
    discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
    findActiveDuplicateByStrongKey: (strongKey: string) =>
      stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
    getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
  }
}

function createUpdateService(stack: CommandGatewayTestStack) {
  const deps = matchingDeps(stack)
  return createOpportunityCommandService({
    gateway: stack.gateway,
    getOpportunityById: (id) => stack.opportunityRepository.getById(id),
    runPublishMatching: (id) =>
      matchingService.runPublishMatchingForOpportunity(id, deps),
    runCircularMatching: (id) =>
      matchingService.runCircularMatchingForOpportunity(id, deps),
  })
}

function toUpdatePayload(
  existing: Opportunity,
  patch: Partial<Opportunity> = {},
) {
  return {
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
    intent: (patch.intent ?? existing.intent) as 'need' | 'offer' | 'hybrid' | 'request',
    location: patch.location ?? existing.location,
    coverageAreas: patch.coverageAreas ?? existing.coverageAreas,
    mainCollaborationModel:
      patch.mainCollaborationModel ?? existing.mainCollaborationModel ?? collab.mainCollaborationModel,
    modelType: patch.modelType ?? existing.modelType ?? collab.modelType,
    subModelType: patch.subModelType ?? existing.subModelType ?? collab.subModelType,
    exchangeMode: patch.exchangeMode ?? existing.exchangeMode ?? collab.exchangeMode,
    acceptedExchangeModes:
      patch.acceptedExchangeModes ?? existing.acceptedExchangeModes ?? collab.acceptedExchangeModes,
    collaborationAttributes:
      patch.collaborationAttributes ?? existing.collaborationAttributes,
    scope: patch.scope ?? existing.scope,
    attributes: patch.attributes ?? existing.attributes,
    exchangeData: patch.exchangeData ?? existing.exchangeData,
    normalized: patch.normalized ?? existing.normalized,
  }
}

describe('updateOpportunity matching re-evaluation', () => {
  it('runs matching when a published matching-related field changes', () => {
    const before = publishedNeed('need-changed', 'user-need', ['BIM', 'Revit'])
    const after = publishedNeed('need-changed', 'user-need', ['BIM', 'Revit', 'Navisworks'])
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
    })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 1)
    assert.equal(spy.calls().circularCalls, 1)
  })

  it('does not run matching for a title-only change', () => {
    const before = publishedNeed('need-title', 'user-need', ['BIM', 'Revit'])
    const after = { ...before, title: 'Marketing title only' }
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, { title: after.title })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 0)
    assert.equal(spy.calls().circularCalls, 0)
  })

  it('does not run matching for a draft opportunity', () => {
    const before = publishedNeed('need-draft', 'user-need', ['SAP2000'], {
      status: 'draft',
    })
    const after = publishedNeed('need-draft', 'user-need', ['BIM', 'Revit'], {
      status: 'draft',
    })
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
      normalized: after.normalized,
    })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 0)
  })

  it('does not run matching for a closed opportunity', () => {
    const before = publishedNeed('need-closed', 'user-need', ['SAP2000'], {
      visibilityStatus: 'closed',
    })
    const after = publishedNeed('need-closed', 'user-need', ['BIM', 'Revit'], {
      visibilityStatus: 'closed',
    })
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
      normalized: after.normalized,
    })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 0)
  })

  it('does not run matching for an archived opportunity', () => {
    const before = publishedNeed('need-archived', 'user-need', ['SAP2000'], {
      visibilityStatus: 'archived',
    })
    const after = publishedNeed('need-archived', 'user-need', ['BIM', 'Revit'], {
      visibilityStatus: 'archived',
    })
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
      normalized: after.normalized,
    })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 0)
  })

  it('does not rerun matching for a semantic no-op skill reorder', () => {
    const before = publishedNeed('need-reorder', 'user-need', ['BIM', 'Revit'], {
      normalized: undefined,
    })
    const after = publishedNeed('need-reorder', 'user-need', ['Revit', 'BIM'], {
      normalized: undefined,
    })
    assert.equal(hasMatchingInputChanged(before, after, fingerprintContext), false)
    const spy = spyUpdateService({ before, after })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
    })

    assert.equal(result.success, true)
    assert.equal(spy.calls().publishCalls, 0)
  })

  it('still succeeds when the update command fails without running matching', () => {
    const before = publishedNeed('need-fail', 'user-need', ['BIM', 'Revit'])
    const after = publishedNeed('need-fail', 'user-need', ['Navisworks'])
    const spy = spyUpdateService({ before, after, commandSuccess: false })

    const result = spy.service.updateOpportunity(before.id, {
      title: after.title,
      scope: after.scope,
    })

    assert.equal(result.success, false)
    assert.equal(spy.calls().publishCalls, 0)
  })
})

describe('updateOpportunity matching persistence', () => {
  it('discovers a new match when a previously ineligible candidate becomes eligible', () => {
    const need = publishedNeed('need-become-eligible', 'user-need', ['SAP2000'])
    const offer = publishedOffer('offer-become-eligible', 'user-offer', ['BIM', 'Revit'])
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users: testUsers,
    })
    const service = createUpdateService(stack)

    const beforeMatches = stack.postMatchRepository.getByOpportunity(need.id)
    assert.equal(beforeMatches.length, 0)

    const updatedSkills = ['BIM', 'Revit']
    const result = service.updateOpportunity(
      need.id,
      toUpdatePayload(need, {
        scope: { ...need.scope, requiredSkills: updatedSkills },
        normalized: {
          ...need.normalized,
          requiredServices: updatedSkills,
          skills: updatedSkills,
        },
      }),
    )

    assert.equal(result.success, true)
    const matches = stack.postMatchRepository
      .getAll()
      .filter((match) => match.matchType === 'one_way')
    assert.ok(matches.length >= 1, 'expected a newly discovered match')
    assert.ok(
      matches.some(
        (match) =>
          match.needOpportunityId === need.id
          && match.offerOpportunityId === offer.id,
      ),
    )
  })

  it('does not create a duplicate discovered match for an existing pair', () => {
    const need = publishedNeed('need-dup-update', 'user-need', ['BIM', 'Revit'])
    const offer = publishedOffer('offer-dup-update', 'user-offer', ['BIM', 'Revit'])
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users: testUsers,
    })
    const service = createUpdateService(stack)
    const deps = matchingDeps(stack)

    const first = matchingService.runPublishMatchingForOpportunity(need.id, deps)
    assert.ok(first.discoveredMatchesCount >= 1)
    const idsAfterFirst = stack.postMatchRepository.getAll().map((match) => match.id)

    const result = service.updateOpportunity(
      need.id,
      toUpdatePayload(need, {
        scope: {
          ...need.scope,
          requiredSkills: ['BIM', 'Revit', 'Navisworks'],
        },
        normalized: {
          ...need.normalized,
          requiredServices: ['BIM', 'Revit', 'Navisworks'],
          skills: ['BIM', 'Revit', 'Navisworks'],
        },
      }),
    )

    assert.equal(result.success, true)
    const after = stack.postMatchRepository.getAll()
    const newIds = after.map((match) => match.id).filter((id) => !idsAfterFirst.includes(id))
    const duplicatePair = after.filter(
      (match) =>
        match.matchType === 'one_way'
        && match.needOpportunityId === need.id
        && match.offerOpportunityId === offer.id,
    )
    assert.equal(duplicatePair.length, 1)
    assert.equal(newIds.length, 0)
  })

  it('leaves a Confirmed match unchanged after a matching-field edit', () => {
    const need = publishedNeed('need-confirmed', 'user-need', ['BIM', 'Revit'])
    const offer = publishedOffer('offer-confirmed', 'user-offer', ['BIM', 'Revit'])
    const confirmed: PostMatch = {
      id: 'pm-confirmed',
      matchType: 'one_way',
      status: 'confirmed',
      matchScore: 0.91,
      needOpportunityId: need.id,
      offerOpportunityId: offer.id,
      participants: [
        { userId: 'user-need', role: 'need_owner', opportunityId: need.id },
        { userId: 'user-offer', role: 'offer_provider', opportunityId: offer.id },
      ],
    }
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users: testUsers,
      postMatches: [confirmed],
    })
    const service = createUpdateService(stack)

    const result = service.updateOpportunity(
      need.id,
      toUpdatePayload(need, {
        scope: {
          ...need.scope,
          requiredSkills: ['BIM', 'Revit', 'Navisworks'],
        },
        normalized: {
          ...need.normalized,
          requiredServices: ['BIM', 'Revit', 'Navisworks'],
          skills: ['BIM', 'Revit', 'Navisworks'],
        },
      }),
    )

    assert.equal(result.success, true)
    const still = stack.postMatchRepository.getById('pm-confirmed')
    assert.ok(still)
    assert.equal(still?.status, 'confirmed')
    assert.equal(still?.matchScore, 0.91)
    assert.equal(still?.needOpportunityId, need.id)
    assert.equal(still?.offerOpportunityId, offer.id)
    assert.notEqual(still?.status, 'expired')
    assert.notEqual(still?.status, 'superseded')
  })

  it('leaves an Accepted match unchanged and does not add a review state', () => {
    const need = publishedNeed('need-accepted', 'user-need', ['BIM', 'Revit'])
    const offer = publishedOffer('offer-accepted', 'user-offer', ['BIM', 'Revit'])
    const accepted: PostMatch = {
      id: 'pm-accepted',
      matchType: 'one_way',
      status: 'accepted',
      matchScore: 0.88,
      needOpportunityId: need.id,
      offerOpportunityId: offer.id,
      participants: [
        { userId: 'user-need', role: 'need_owner', opportunityId: need.id },
        { userId: 'user-offer', role: 'offer_provider', opportunityId: offer.id },
      ],
    }
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users: testUsers,
      postMatches: [accepted],
    })
    const service = createUpdateService(stack)

    const result = service.updateOpportunity(
      need.id,
      toUpdatePayload(need, {
        scope: {
          ...need.scope,
          requiredSkills: ['BIM', 'Revit', 'Navisworks'],
        },
        normalized: {
          ...need.normalized,
          requiredServices: ['BIM', 'Revit', 'Navisworks'],
          skills: ['BIM', 'Revit', 'Navisworks'],
        },
      }),
    )

    assert.equal(result.success, true)
    const still = stack.postMatchRepository.getById('pm-accepted')
    assert.equal(still?.status, 'accepted')
    assert.equal(still?.matchScore, 0.88)
    const reviewLike = stack.postMatchRepository
      .getAll()
      .filter((match) => /review/i.test(match.status))
    assert.equal(reviewLike.length, 0)
  })

  it('does not modify an existing Negotiation record', () => {
    const need = publishedNeed('need-nego', 'user-need', ['BIM', 'Revit'])
    const offer = publishedOffer('offer-nego', 'user-offer', ['BIM', 'Revit'])
    const negotiation: Negotiation = {
      id: 'neg-1',
      postMatchId: 'pm-nego',
      needOpportunityId: need.id,
      offerOpportunityId: offer.id,
      status: 'active',
      participants: [
        { userId: 'user-need', role: 'need_owner', opportunityId: need.id },
        { userId: 'user-offer', role: 'offer_provider', opportunityId: offer.id },
      ],
    }
    const stack = createCommandGatewayTestStack({
      opportunities: [need, offer],
      users: testUsers,
      postMatches: [
        {
          id: 'pm-nego',
          matchType: 'one_way',
          status: 'accepted',
          matchScore: 0.9,
          needOpportunityId: need.id,
          offerOpportunityId: offer.id,
          participants: negotiation.participants ?? [],
        },
      ],
      negotiations: [negotiation],
    })
    const before = structuredClone(stack.negotiationRepository.getById('neg-1'))
    const service = createUpdateService(stack)

    const result = service.updateOpportunity(
      need.id,
      toUpdatePayload(need, {
        scope: {
          ...need.scope,
          requiredSkills: ['BIM', 'Revit', 'Navisworks'],
        },
        normalized: {
          ...need.normalized,
          requiredServices: ['BIM', 'Revit', 'Navisworks'],
          skills: ['BIM', 'Revit', 'Navisworks'],
        },
      }),
    )

    assert.equal(result.success, true)
    const after = stack.negotiationRepository.getById('neg-1')
    assert.deepEqual(after, before)
  })
})
