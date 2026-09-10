import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { DiscoverPostMatchCommand } from '@pm-twin/commands'
import {
  isDiscoverCircularPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@pm-twin/commands'
import { partyIdForSource, workspaceIdForSource } from '@pm-twin/identity'
import { runMatchingForPost, withMatchingDefaults } from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import { createCommandGatewayTestStack } from '@/commands/test-helpers/command-gateway-test-stack.ts'
import {
  buildMatchingDiscoveryContext,
  type CompanyHumanParticipantLink,
} from '@/domain/identity/matching-discovery-context.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import {
  modelRunResultToDiscoverCommands,
} from '@/services/matching/model-run-discover-adapter.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
})

const COMPANY_A = 'co-a'
const COMPANY_B = 'co-b'
const COMPANY_C = 'co-c'
const HUMAN_A = 'human-a'
const HUMAN_B = 'human-b'
const HUMAN_C = 'human-c'
const INDIVIDUAL = 'user-individual'

const companyIds = [COMPANY_A, COMPANY_B, COMPANY_C]
const humanIds = [HUMAN_A, HUMAN_B, HUMAN_C, INDIVIDUAL]
const companyHumanLinks: CompanyHumanParticipantLink[] = [
  { companyId: COMPANY_A, userId: HUMAN_A, role: 'member' },
  { companyId: COMPANY_B, userId: HUMAN_B, role: 'member' },
  { companyId: COMPANY_C, userId: HUMAN_C, role: 'member' },
]

const ownershipContext = buildMatchingDiscoveryContext(humanIds, companyIds, {
  companyHumanLinks,
})

const cashCollab = {
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  acceptedExchangeModes: ['cash'],
} as const

const twoWayCollab = {
  mainCollaborationModel: 'service_exchange',
  modelType: 'project_based',
  subModelType: 'service_exchange',
  exchangeMode: 'barter',
  acceptedExchangeModes: ['barter'],
} as const

const readyProfile = {
  name: 'Test Professional',
  title: 'Senior Architect',
  skills: ['BIM', 'Revit', 'Project Management', 'Planning', 'Structural Analysis', 'SAP2000'],
  services: ['Architectural Design'],
  location: 'Riyadh, Saudi Arabia',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Riyadh Mixed-Use Tower' }],
  yearsExperience: 9,
  certifications: ['LEED AP BD+C'],
  previousProjects: [{ title: 'NEOM Pavilion' }],
}

function companyOwnership(companyId: string) {
  return {
    creatorId: companyId,
    createdByUserId: companyId,
    ownerPartyId: partyIdForSource(companyId, 'company'),
    workspaceId: workspaceIdForSource(companyId, 'company'),
  }
}

function individualOwnership(userId: string) {
  return {
    creatorId: userId,
    createdByUserId: userId,
    ownerPartyId: partyIdForSource(userId, 'individual'),
    workspaceId: workspaceIdForSource(userId, 'personal'),
  }
}

function matchingNeed(
  id: string,
  ownership: ReturnType<typeof companyOwnership>,
  collab: typeof cashCollab | typeof twoWayCollab = cashCollab,
): Opportunity {
  return {
    id,
    title: `Need ${id}`,
    description: 'Architectural delivery need with BIM scope.',
    intent: 'need',
    status: 'published',
    ...collab,
    ...ownership,
    location: 'remote',
    scope: {
      sectors: ['Construction', 'Architecture'],
      requiredSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: {
      budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' },
    },
  } as Opportunity
}

function matchingOffer(
  id: string,
  ownership: ReturnType<typeof companyOwnership>,
  collab: typeof cashCollab | typeof twoWayCollab = cashCollab,
): Opportunity {
  return {
    id,
    title: `Offer ${id}`,
    description: 'Architectural offer with BIM capability.',
    intent: 'offer',
    status: 'published',
    ...collab,
    ...ownership,
    location: 'remote',
    scope: {
      sectors: ['Construction', 'Architecture'],
      requiredSkills: ['BIM', 'Revit'],
    },
    attributes: {
      targetRole: 'Architect',
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role: 'Architect',
      offeredServices: ['BIM', 'Revit'],
      skills: ['BIM', 'Revit'],
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: {
      budgetRange: { min: 120_000, max: 350_000, currency: 'SAR' },
    },
  } as Opportunity
}

function circularNeed(
  id: string,
  ownership: ReturnType<typeof companyOwnership>,
  role: string,
  services: string[],
): Opportunity {
  return {
    id,
    title: `Need ${id}`,
    description: 'Circular chain need.',
    intent: 'need',
    status: 'published',
    modelType: 'project_based',
    ...ownership,
    location: 'remote',
    scope: { sectors: ['Construction'], requiredSkills: services },
    attributes: {
      targetRole: role,
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role,
      requiredServices: services,
      skills: services,
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: { budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' } },
  } as Opportunity
}

function circularOffer(
  id: string,
  ownership: ReturnType<typeof companyOwnership>,
  role: string,
  services: string[],
): Opportunity {
  return {
    id,
    title: `Offer ${id}`,
    description: 'Circular chain offer.',
    intent: 'offer',
    status: 'published',
    modelType: 'project_based',
    ...ownership,
    location: 'remote',
    scope: { sectors: ['Construction'], requiredSkills: services },
    attributes: {
      targetRole: role,
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: {
      role,
      offeredServices: services,
      skills: services,
      location: 'remote',
      modelType: 'project_based',
    },
    exchangeData: { budgetRange: { min: 120_000, max: 350_000, currency: 'SAR' } },
  } as Opportunity
}

function humanUser(id: string): PlatformUser {
  return {
    id,
    email: `${id}@test.pmtwin`,
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  }
}

function discoverCommands(
  model: 'one_way' | 'two_way' | 'circular',
  anchor: Opportunity,
  pool: Opportunity[],
) {
  const [result] = runMatchingForPost({
    anchorPost: opportunityToPost(anchor),
    opportunities: pool.map(opportunityToPost),
    config: engineConfig,
    options: { model, minCycleLength: model === 'circular' ? 3 : undefined },
  })
  const opportunityById = new Map(pool.map((opp) => [opp.id, opp]))
  const posts = pool.map(opportunityToPost)
  const postById = new Map(
    posts.filter((post) => post.id).map((post) => [post.id as string, post]),
  )
  const commands = modelRunResultToDiscoverCommands(
    result,
    {
      anchorOpportunity: anchor,
      opportunityById,
      postById,
      ownershipContext,
      runId: 'run-company-persist',
      createAggregateId: () => `pm-${model}-${anchor.id}`,
    },
    posts,
  )
  return { result, commands }
}

function assertHumanNotCompany(userId: string): void {
  assert.ok(humanIds.includes(userId), `expected human user id, got ${userId}`)
  assert.ok(!companyIds.includes(userId), `company id ${userId} used as user id`)
}

function assertCompanyParty(partyId: string | undefined, companyId: string): void {
  assert.equal(partyId, partyIdForSource(companyId, 'company'))
}

describe('company matching persistence / participant identity', () => {
  it('drops company one-way matches when no human participant can be resolved', () => {
    const need = matchingNeed('need-drop', companyOwnership(COMPANY_A))
    const offer = matchingOffer('offer-drop', companyOwnership(COMPANY_B))
    const pool = [need, offer]
    const [result] = runMatchingForPost({
      anchorPost: opportunityToPost(need),
      opportunities: pool.map(opportunityToPost),
      config: engineConfig,
      options: { model: 'one_way' },
    })
    assert.ok(result.matches.length >= 1, 'engine should still produce a company candidate')

    const emptyHumanContext = buildMatchingDiscoveryContext(humanIds, companyIds)
    const posts = pool.map(opportunityToPost)
    const commands = modelRunResultToDiscoverCommands(
      result,
      {
        anchorOpportunity: need,
        opportunityById: new Map(pool.map((opp) => [opp.id, opp])),
        postById: new Map(posts.map((post) => [post.id as string, post])),
        ownershipContext: emptyHumanContext,
        runId: 'run-drop',
        createAggregateId: () => 'pm-drop',
      },
      posts,
    )
    assert.equal(commands.length, 0)
  })

  it('persists Company → Company one-way with company ownerPartyId and human participants', () => {
    const need = matchingNeed('need-co-a', companyOwnership(COMPANY_A))
    const offer = matchingOffer('offer-co-b', companyOwnership(COMPANY_B))
    const { result, commands } = discoverCommands('one_way', need, [need, offer])

    assert.ok(result.matches.length >= 1, 'engine should produce a match')
    assert.equal(commands.length, 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverOneWayPostMatch(probe))
    assert.equal(probe.needOpportunityId, need.id)
    assert.equal(probe.offerOpportunityId, offer.id)

    const needParticipant = probe.participants.find((p) => p.role === 'need_owner')
    const offerParticipant = probe.participants.find((p) => p.role === 'offer_provider')
    assert.equal(needParticipant?.userId, HUMAN_A)
    assert.equal(offerParticipant?.userId, HUMAN_B)
    assertCompanyParty(needParticipant?.partyId, COMPANY_A)
    assertCompanyParty(offerParticipant?.partyId, COMPANY_B)
    assertHumanNotCompany(needParticipant!.userId)
    assertHumanNotCompany(offerParticipant!.userId)
  })

  it('persists Company → Individual one-way without converting company ownership', () => {
    const need = matchingNeed('need-co-ind', companyOwnership(COMPANY_A))
    const offer = matchingOffer('offer-ind', individualOwnership(INDIVIDUAL))
    const { commands } = discoverCommands('one_way', need, [need, offer])

    assert.equal(commands.length, 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverOneWayPostMatch(probe))

    const needParticipant = probe.participants.find((p) => p.role === 'need_owner')
    const offerParticipant = probe.participants.find((p) => p.role === 'offer_provider')
    assert.equal(needParticipant?.userId, HUMAN_A)
    assert.equal(offerParticipant?.userId, INDIVIDUAL)
    assertCompanyParty(needParticipant?.partyId, COMPANY_A)
    assert.equal(offerParticipant?.partyId, partyIdForSource(INDIVIDUAL, 'individual'))
    assertHumanNotCompany(needParticipant!.userId)
  })

  it('persists Individual → Company one-way with company ownerPartyId on the company side', () => {
    const need = matchingNeed('need-ind', individualOwnership(INDIVIDUAL))
    const offer = matchingOffer('offer-co', companyOwnership(COMPANY_B))
    const { commands } = discoverCommands('one_way', need, [need, offer])

    assert.equal(commands.length, 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverOneWayPostMatch(probe))

    const needParticipant = probe.participants.find((p) => p.role === 'need_owner')
    const offerParticipant = probe.participants.find((p) => p.role === 'offer_provider')
    assert.equal(needParticipant?.userId, INDIVIDUAL)
    assert.equal(offerParticipant?.userId, HUMAN_B)
    assert.equal(needParticipant?.partyId, partyIdForSource(INDIVIDUAL, 'individual'))
    assertCompanyParty(offerParticipant?.partyId, COMPANY_B)
  })

  it('persists Company Two-Way (service exchange / barter) with human participants', () => {
    const needA = matchingNeed('need-tw-a', companyOwnership(COMPANY_A), twoWayCollab)
    const offerA = matchingOffer('offer-tw-a', companyOwnership(COMPANY_A), twoWayCollab)
    const needB = matchingNeed('need-tw-b', companyOwnership(COMPANY_B), twoWayCollab)
    const offerB = matchingOffer('offer-tw-b', companyOwnership(COMPANY_B), twoWayCollab)
    const pool = [needA, offerA, needB, offerB]
    const { result, commands } = discoverCommands('two_way', needA, pool)

    assert.ok(result.matches.length >= 1, 'two-way engine should produce a match')
    assert.ok(commands.length >= 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverTwoWayPostMatch(probe))
    assert.equal(probe.sideA.userId, HUMAN_A)
    assert.equal(probe.sideB.userId, HUMAN_B)
    assertHumanNotCompany(probe.sideA.userId)
    assertHumanNotCompany(probe.sideB.userId)

    const partyIds = new Set(probe.participants.map((p) => p.partyId))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_A, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_B, 'company')))
    for (const participant of probe.participants) {
      assertHumanNotCompany(participant.userId)
    }
  })

  it('persists Circular company matching with company parties and human participants', () => {
    const pool = [
      circularNeed('need-circ-a', companyOwnership(COMPANY_A), 'Architect', ['BIM', 'Revit']),
      circularOffer('offer-circ-a', companyOwnership(COMPANY_A), 'Architect', ['Project Management', 'Planning']),
      circularNeed('need-circ-b', companyOwnership(COMPANY_B), 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
      circularOffer('offer-circ-b', companyOwnership(COMPANY_B), 'Architect', ['BIM', 'Revit']),
      circularNeed('need-circ-c', companyOwnership(COMPANY_C), 'Architect', ['Project Management', 'Planning']),
      circularOffer('offer-circ-c', companyOwnership(COMPANY_C), 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    ]
    const { result, commands } = discoverCommands('circular', pool[0]!, pool)

    assert.ok(result.matches.length >= 1, 'circular engine should produce a match')
    assert.ok(commands.length >= 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverCircularPostMatch(probe))
    assert.ok(probe.cycle.length >= 3)
    assert.ok(probe.participants.length >= 3)

    const partyIds = new Set(probe.participants.map((p) => p.partyId))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_A, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_B, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_C, 'company')))
    for (const participant of probe.participants) {
      assertHumanNotCompany(participant.userId)
    }
  })

  it('does not persist a same-company one-way match after human resolution', () => {
    const need = matchingNeed('need-same', companyOwnership(COMPANY_A))
    const offer = matchingOffer('offer-same', companyOwnership(COMPANY_A))
    const { result, commands } = discoverCommands('one_way', need, [need, offer])

    assert.equal(result.matches.length, 0)
    assert.equal(commands.length, 0)
  })
})

describe('company matching persistence through matching-service', () => {
  function persistDeps(
    opportunities: Opportunity[],
    model: 'one_way' | 'two_way' | 'circular',
  ) {
    const stack = createCommandGatewayTestStack({
      opportunities,
      users: humanIds.map(humanUser),
    })
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })
    const matchingDeps = {
      getOpportunityById: (id: string) => stack.opportunityRepository.getById(id),
      listPublishedOpportunities: () =>
        stack.opportunityRepository
          .getAll()
          .filter((opp) => opp.status === 'published'),
      discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
      findActiveDuplicateByStrongKey: (strongKey: string) =>
        stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
      getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
      ownershipContext,
      engineOptions: { model, minCycleLength: model === 'circular' ? 3 : undefined },
    }
    return { stack, matchingDeps }
  }

  it('writes DiscoverPostMatch for Company → Company one-way', () => {
    const need = matchingNeed('svc-need-a', companyOwnership(COMPANY_A))
    const offer = matchingOffer('svc-offer-b', companyOwnership(COMPANY_B))
    const { stack, matchingDeps } = persistDeps([need, offer], 'one_way')

    const result = matchingService.runPublishMatchingForOpportunity(need.id, matchingDeps)
    assert.ok(result.discoveredMatchesCount >= 1, result.matchingErrors.join('; '))
    assert.equal(result.matchingErrors.length, 0)

    const match = stack.postMatchRepository.getAll().find((entry) => entry.matchType === 'one_way')
    assert.ok(match)
    const needParticipant = match!.participants.find((p) => p.role === 'need_owner')
    const offerParticipant = match!.participants.find((p) => p.role === 'offer_provider')
    assert.equal(needParticipant?.userId, HUMAN_A)
    assert.equal(offerParticipant?.userId, HUMAN_B)
    assertCompanyParty(needParticipant?.partyId, COMPANY_A)
    assertCompanyParty(offerParticipant?.partyId, COMPANY_B)
  })

  it('writes DiscoverPostMatch for Company Two-Way', () => {
    const pool = [
      matchingNeed('svc-tw-need-a', companyOwnership(COMPANY_A), twoWayCollab),
      matchingOffer('svc-tw-offer-a', companyOwnership(COMPANY_A), twoWayCollab),
      matchingNeed('svc-tw-need-b', companyOwnership(COMPANY_B), twoWayCollab),
      matchingOffer('svc-tw-offer-b', companyOwnership(COMPANY_B), twoWayCollab),
    ]
    const { stack, matchingDeps } = persistDeps(pool, 'two_way')

    const result = matchingService.runPublishMatchingForOpportunity(pool[0]!.id, matchingDeps)
    assert.ok(result.discoveredMatchesCount >= 1, result.matchingErrors.join('; '))

    const match = stack.postMatchRepository.getAll().find((entry) => entry.matchType === 'two_way')
    assert.ok(match)
    assert.equal(match!.payload?.sideA?.userId, HUMAN_A)
    assert.equal(match!.payload?.sideB?.userId, HUMAN_B)
    const partyIds = new Set(match!.participants.map((p) => p.partyId))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_A, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_B, 'company')))
  })

  it('writes circular DiscoverPostMatch for three companies', () => {
    const pool = [
      circularNeed('svc-circ-need-a', companyOwnership(COMPANY_A), 'Architect', ['BIM', 'Revit']),
      circularOffer('svc-circ-offer-a', companyOwnership(COMPANY_A), 'Architect', ['Project Management', 'Planning']),
      circularNeed('svc-circ-need-b', companyOwnership(COMPANY_B), 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
      circularOffer('svc-circ-offer-b', companyOwnership(COMPANY_B), 'Architect', ['BIM', 'Revit']),
      circularNeed('svc-circ-need-c', companyOwnership(COMPANY_C), 'Architect', ['Project Management', 'Planning']),
      circularOffer('svc-circ-offer-c', companyOwnership(COMPANY_C), 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    ]
    const { stack, matchingDeps } = persistDeps(pool, 'circular')

    const result = matchingService.runCircularMatchingForOpportunity(pool[0]!.id, matchingDeps)
    assert.ok(result.discoveredMatchesCount >= 1, result.matchingErrors.join('; '))

    const match = stack.postMatchRepository.getAll().find((entry) => entry.matchType === 'circular')
    assert.ok(match)
    assert.ok((match!.payload?.cycle?.length ?? 0) >= 3)
    const partyIds = new Set(match!.participants.map((p) => p.partyId))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_A, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_B, 'company')))
    assert.ok(partyIds.has(partyIdForSource(COMPANY_C, 'company')))
    for (const participant of match!.participants) {
      assertHumanNotCompany(participant.userId)
    }
  })
})
