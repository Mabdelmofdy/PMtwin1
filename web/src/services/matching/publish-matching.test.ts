import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { DiscoverPostMatchCommand } from '@pm-twin/commands'
import {
  isDiscoverCircularPostMatch,
  isDiscoverConsortiumPostMatch,
  isDiscoverOneWayPostMatch,
  isDiscoverTwoWayPostMatch,
} from '@pm-twin/commands'
import {
  withMatchingDefaults,
  runMatchingForPost,
} from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { buildOpportunityMatchesReadModel } from '@/lib/opportunity-matches-read-model.ts'
import { publishOpportunityUiAction } from '@/lib/publish-opportunity-ui-actions.ts'
import { PUBLISH_READINESS_BLOCKED_CODE } from '@/domain/publish-readiness/index.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createOpportunityCommandService } from '@/services/opportunity-command-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import {
  discoverInputStrongKey,
  modelRunResultToDiscoverCommands,
} from '@/services/matching/model-run-discover-adapter.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
})

const readyProfile = {
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

const canonicalCollaborationFields = {
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  acceptedExchangeModes: ['cash'],
} as const

function matchingNeed(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'published',
): Opportunity {
  return {
    id,
    creatorId,
    title: `Need ${id}`,
    description: 'Architectural delivery need with BIM scope.',
    intent: 'need',
    status,
    ...canonicalCollaborationFields,
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
    preferredPartnerType: 'company',
    attachments: [{ name: 'design-brief.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Concept design', dueDate: '2026-04-01' }],
  } as Opportunity
}

function matchingOffer(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'published',
): Opportunity {
  return {
    id,
    creatorId,
    title: `Offer ${id}`,
    description: 'Architectural offer with BIM capability.',
    intent: 'offer',
    status,
    ...canonicalCollaborationFields,
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
    preferredPartnerType: 'company',
    attachments: [{ name: 'portfolio.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Delivery kickoff', dueDate: '2026-04-15' }],
  } as Opportunity
}

const circularPublishUsers: PlatformUser[] = [
  {
    id: 'creator-a',
    email: 'a@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'creator-b',
    email: 'b@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'creator-c',
    email: 'c@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
]

function circularPublishNeed(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'published',
): Opportunity {
  const roleMap: Record<string, { role: string; skills: string[] }> = {
    'creator-a': { role: 'Architect', skills: ['BIM', 'Revit'] },
    'creator-b': { role: 'Civil Engineer', skills: ['Structural Analysis', 'SAP2000'] },
    'creator-c': { role: 'Architect', skills: ['Project Management', 'Planning'] },
  }
  const { role, skills } = roleMap[creatorId] ?? { role: 'Architect', skills: ['BIM', 'Revit'] }
  return {
    id,
    creatorId,
    title: `Need ${id}`,
    intent: 'need',
    status,
    ...canonicalCollaborationFields,
    location: 'remote',
    scope: { sectors: ['Construction'], requiredSkills: skills },
    attributes: {
      targetRole: role,
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: { role, requiredServices: skills, skills, location: 'remote', modelType: 'project_based' },
    exchangeData: { budgetRange: { min: 150_000, max: 400_000, currency: 'SAR' } },
    preferredPartnerType: 'company',
    attachments: [{ name: 'brief.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Kickoff', dueDate: '2026-04-01' }],
  } as Opportunity
}

function circularPublishOffer(
  id: string,
  creatorId: string,
  status: 'draft' | 'published' = 'published',
): Opportunity {
  const roleMap: Record<string, { role: string; skills: string[] }> = {
    'creator-a': { role: 'Architect', skills: ['Project Management', 'Planning'] },
    'creator-b': { role: 'Architect', skills: ['BIM', 'Revit'] },
    'creator-c': { role: 'Civil Engineer', skills: ['Structural Analysis', 'SAP2000'] },
  }
  const { role, skills } = roleMap[creatorId] ?? { role: 'Architect', skills: ['BIM', 'Revit'] }
  return {
    id,
    creatorId,
    title: `Offer ${id}`,
    intent: 'offer',
    status,
    ...canonicalCollaborationFields,
    location: 'remote',
    scope: { sectors: ['Construction'], requiredSkills: skills },
    attributes: {
      targetRole: role,
      startDate: '2026-03-01',
      tenderDeadline: '2026-06-01',
      locationRequirement: 'remote',
    },
    normalized: { role, offeredServices: skills, skills, location: 'remote', modelType: 'project_based' },
    exchangeData: { budgetRange: { min: 120_000, max: 350_000, currency: 'SAR' } },
    preferredPartnerType: 'company',
    attachments: [{ name: 'portfolio.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Delivery', dueDate: '2026-04-15' }],
  } as Opportunity
}

function buildPublishCircularCyclePool(): Opportunity[] {
  return [
    circularPublishNeed('pub-need-a', 'creator-a'),
    circularPublishOffer('pub-offer-a', 'creator-a'),
    circularPublishNeed('pub-need-b', 'creator-b'),
    circularPublishOffer('pub-offer-b', 'creator-b'),
    circularPublishNeed('pub-need-c', 'creator-c'),
    circularPublishOffer('pub-offer-c', 'creator-c'),
  ]
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
  {
    id: 'user-offer-a',
    email: 'offer-a@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'user-offer-b',
    email: 'offer-b@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
]

function createPublishStack(
  opportunities: Opportunity[],
  users: PlatformUser[] = testUsers,
): CommandGatewayTestStack {
  return createCommandGatewayTestStack({ opportunities, users })
}

function publishDeps(stack: CommandGatewayTestStack) {
  const opportunityCommandService = createOpportunityCommandService({
    gateway: stack.gateway,
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
    discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
    findActiveDuplicateByStrongKey: (strongKey: string) =>
      stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
    getMatchingEngineContext: () => ({
      canonical: {},
      config: engineConfig,
    }),
  }

  return {
    transitionOpportunityStatus: (id: string, status: string) =>
      opportunityCommandService.transitionOpportunityStatus(id, status),
    runPublishMatching: (opportunityId: string) =>
      matchingService.runPublishMatchingForOpportunity(opportunityId, matchingDeps),
    runCircularMatching: (opportunityId: string) =>
      matchingService.runCircularMatchingForOpportunity(opportunityId, matchingDeps),
  }
}

describe('publish matching wiring', () => {
  it('ready need publish creates one_way PostMatch', () => {
    const need = matchingNeed('need-publish-1', 'user-need', 'draft')
    const offer = matchingOffer('offer-publish-1', 'user-offer', 'published')
    const stack = createPublishStack([need, offer])
    const deps = publishDeps(stack)

    const result = publishOpportunityUiAction(
      need.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(need.id),
      },
      deps,
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.published, true)
    assert.ok(result.discoveredMatchesCount >= 1)

    const matches = stack.postMatchRepository.getByOpportunity(need.id)
    assert.ok(matches.some((match) => match.matchType === 'one_way'))
    assert.ok(
      matches.some(
        (match) =>
          match.needOpportunityId === need.id
          && match.offerOpportunityId === offer.id,
      ),
    )
  })

  it('ready offer publish creates one_way PostMatch', () => {
    const need = matchingNeed('need-publish-2', 'user-need', 'published')
    const offer = matchingOffer('offer-publish-2', 'user-offer', 'draft')
    const stack = createPublishStack([need, offer])
    const deps = publishDeps(stack)

    const result = publishOpportunityUiAction(
      offer.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(offer.id),
      },
      deps,
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.ok(result.discoveredMatchesCount >= 1)

    const matches = stack.postMatchRepository.getByOpportunity(offer.id)
    assert.ok(matches.some((match) => match.matchType === 'one_way'))
    assert.ok(
      matches.some(
        (match) =>
          match.needOpportunityId === need.id
          && match.offerOpportunityId === offer.id,
      ),
    )
  })

  it('duplicate match is skipped cleanly', () => {
    const need = matchingNeed('need-dup', 'user-need', 'published')
    const offer = matchingOffer('offer-dup', 'user-offer', 'published')
    const stack = createPublishStack([need, offer])
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })

    const matchingDeps = {
      getOpportunityById: (id: string) => stack.opportunityRepository.getById(id),
      listPublishedOpportunities: () =>
        stack.opportunityRepository.getAll().filter((opp) => opp.status === 'published'),
      discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
      findActiveDuplicateByStrongKey: (strongKey: string) =>
        stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
      getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
    }

    const first = matchingService.runPublishMatchingForOpportunity(need.id, matchingDeps)
    const second = matchingService.runPublishMatchingForOpportunity(need.id, matchingDeps)

    assert.ok(first.discoveredMatchesCount >= 1)
    assert.equal(second.discoveredMatchesCount, 0)
    assert.ok(second.skippedDuplicatesCount >= 1)
  })

  it('blocked readiness does not run matching', () => {
    const need = matchingNeed('need-blocked', 'user-need', 'draft')
    const stack = createPublishStack([need])
    let matchingCalls = 0

    const result = publishOpportunityUiAction(
      need.id,
      {
        profile: {},
        profileKind: 'individual',
        opportunity: need,
      },
      {
        transitionOpportunityStatus: () => ({
          success: true,
          aggregateId: need.id,
          commandType: 'TransitionOpportunityStatus',
        }),
        runPublishMatching: () => {
          matchingCalls += 1
          return {
            discoveredMatchesCount: 0,
            skippedDuplicatesCount: 0,
            matchingErrors: [],
            postMatchIds: [],
          }
        },
      },
    )

    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, PUBLISH_READINESS_BLOCKED_CODE)
    assert.equal(matchingCalls, 0)
  })

  it('partial command failure does not undo publish', () => {
    const need = matchingNeed('need-partial', 'user-need', 'draft')
    const offerA = matchingOffer('offer-partial-a', 'user-offer-a', 'published')
    const offerB = matchingOffer('offer-partial-b', 'user-offer-b', 'published')
    const stack = createPublishStack([need, offerA, offerB])
    const opportunityCommandService = createOpportunityCommandService({
      gateway: stack.gateway,
    })

    let discoverCalls = 0
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })

    const result = publishOpportunityUiAction(
      need.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(need.id),
      },
      {
        transitionOpportunityStatus: (id, status) =>
          opportunityCommandService.transitionOpportunityStatus(id, status),
        runPublishMatching: (opportunityId) =>
          matchingService.runPublishMatchingForOpportunity(opportunityId, {
            getOpportunityById: (id) => stack.opportunityRepository.getById(id),
            listPublishedOpportunities: () =>
              stack.opportunityRepository
                .getAll()
                .filter((opp) => opp.status === 'published'),
            discoverPostMatch: (command) => {
              discoverCalls += 1
              if (discoverCalls === 1) {
                return postMatchService.discoverPostMatch(command)
              }
              return {
                success: false,
                commandType: 'DiscoverPostMatch',
                aggregateId: command.aggregateId,
                errors: ['Injected discover failure'],
              }
            },
            findActiveDuplicateByStrongKey: (strongKey) =>
              stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
            getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
          }),
      },
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(
      stack.opportunityRepository.getById(need.id)?.status,
      'published',
    )
    assert.ok(result.discoveredMatchesCount >= 1)
    assert.ok(result.matchingErrors.length >= 1)
  })

  it('Related Matches read model sees new PostMatch after publish', () => {
    const need = matchingNeed('need-read-model', 'user-need', 'draft')
    const offer = matchingOffer('offer-read-model', 'user-offer', 'published')
    const stack = createPublishStack([need, offer])
    const deps = publishDeps(stack)

    const publishResult = publishOpportunityUiAction(
      need.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(need.id),
      },
      deps,
    )

    assert.equal(publishResult.success, true)
    if (!publishResult.success) return

    const readModel = buildOpportunityMatchesReadModel(need.id, {
      getPostMatchesByOpportunity: (id) => stack.postMatchRepository.getByOpportunity(id),
      getOpportunity: (id) => stack.opportunityRepository.getById(id),
      currentUserId: 'user-need',
    })

    assert.equal(readModel.isEmpty, false)
    assert.ok(readModel.matches.length >= 1)
    assert.ok(readModel.matches.some((card) => card.match.matchType === 'one_way'))
  })

  it('ready need publish also runs circular matching on publish orchestration', () => {
    const need = matchingNeed('need-circular-publish', 'user-need', 'draft')
    const stack = createPublishStack([need])
    let circularCalls = 0

    const result = publishOpportunityUiAction(
      need.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(need.id),
      },
      {
        transitionOpportunityStatus: () => ({
          success: true,
          aggregateId: need.id,
          commandType: 'TransitionOpportunityStatus',
        }),
        runPublishMatching: () => ({
          discoveredMatchesCount: 0,
          skippedDuplicatesCount: 0,
          matchingErrors: [],
          postMatchIds: [],
        }),
        runCircularMatching: () => {
          circularCalls += 1
          return {
            discoveredMatchesCount: 1,
            skippedDuplicatesCount: 0,
            matchingErrors: [],
            postMatchIds: ['pm-circular'],
          }
        },
      },
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(circularCalls, 1)
    assert.equal(result.discoveredMatchesCount, 1)
  })

  it('publish succeeds when circular matching throws', () => {
    const need = matchingNeed('need-circular-throw', 'user-need', 'draft')
    const stack = createPublishStack([need])

    const result = publishOpportunityUiAction(
      need.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(need.id),
      },
      {
        transitionOpportunityStatus: () => ({
          success: true,
          aggregateId: need.id,
          commandType: 'TransitionOpportunityStatus',
        }),
        runPublishMatching: () => ({
          discoveredMatchesCount: 2,
          skippedDuplicatesCount: 0,
          matchingErrors: [],
          postMatchIds: ['pm-1', 'pm-2'],
        }),
        runCircularMatching: () => {
          throw new Error('Circular engine failure')
        },
      },
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.equal(result.discoveredMatchesCount, 2)
    assert.ok(result.matchingErrors.some((error) => error.includes('Circular engine failure')))
  })

  it('runCircularMatchingForOpportunity discovers circular matches on publish with cycle pool', () => {
    const cyclePool = buildPublishCircularCyclePool()
    const anchor = circularPublishNeed('pub-anchor', 'creator-a', 'draft')
    const stack = createPublishStack([...cyclePool, anchor], [
      ...testUsers,
      ...circularPublishUsers,
    ])
    const deps = publishDeps(stack)
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })
    const matchingDeps = {
      getOpportunityById: (id: string) => stack.opportunityRepository.getById(id),
      listPublishedOpportunities: () =>
        stack.opportunityRepository.getAll().filter((opp) => opp.status === 'published'),
      discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
      findActiveDuplicateByStrongKey: (strongKey: string) =>
        stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
      getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
    }

    const result = publishOpportunityUiAction(
      anchor.id,
      {
        profile: readyProfile,
        profileKind: 'individual',
        opportunity: stack.opportunityRepository.getById(anchor.id),
      },
      deps,
    )

    assert.equal(result.success, true)
    if (!result.success) return

    const circularMatches = stack.postMatchRepository
      .getAll()
      .filter((match) => match.matchType === 'circular')
    assert.ok(circularMatches.length >= 1, 'expected circular match from publish')

    const second = matchingService.runCircularMatchingForOpportunity(anchor.id, matchingDeps)
    assert.equal(second.discoveredMatchesCount, 0)
    assert.ok(second.skippedDuplicatesCount >= 1)
  })
})

describe('modelRunResult → DiscoverPostMatch adapter', () => {
  const runId = 'run-adapter-test'
  let aggregateCounter = 0

  function createContext(anchor: Opportunity, pool: Opportunity[]) {
    const opportunityById = new Map(pool.map((opp) => [opp.id, opp]))
    const posts = pool.map(opportunityToPost)
    const postById = new Map(
      posts.filter((post) => post.id).map((post) => [post.id as string, post]),
    )
    return {
      anchorOpportunity: anchor,
      opportunityById,
      postById,
      runId,
      createAggregateId: () => `pm-adapter-${++aggregateCounter}`,
    }
  }

  beforeEach(() => {
    aggregateCounter = 0
  })

  it('maps one_way result to DiscoverOneWayPostMatchCommand', () => {
    const need = matchingNeed('need-map', 'user-need')
    const offer = matchingOffer('offer-map', 'user-offer')
    const [result] = runMatchingForPost({
      anchorPost: opportunityToPost(need),
      opportunities: [need, offer].map(opportunityToPost),
      config: engineConfig,
      options: { model: 'one_way' },
    })

    const [command] = modelRunResultToDiscoverCommands(
      result,
      createContext(need, [need, offer]),
      [need, offer].map(opportunityToPost),
    )
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...command,
    } as DiscoverPostMatchCommand

    assert.ok(isDiscoverOneWayPostMatch(probe))
    assert.equal(probe.needOpportunityId, need.id)
    assert.equal(probe.offerOpportunityId, offer.id)
    assert.ok(discoverInputStrongKey(command))
  })

  it('maps two_way result to DiscoverTwoWayPostMatchCommand', () => {
    const needA = matchingNeed('need-a', 'creator-a')
    const offerA = matchingOffer('offer-a', 'creator-a')
    const needB = matchingNeed('need-b', 'creator-b')
    const offerB = matchingOffer('offer-b', 'creator-b')
    const pool = [needA, offerA, needB, offerB]

    const [result] = runMatchingForPost({
      anchorPost: opportunityToPost(needA),
      opportunities: pool.map(opportunityToPost),
      config: engineConfig,
      options: { model: 'two_way' },
    })

    const commands = modelRunResultToDiscoverCommands(
      result,
      createContext(needA, pool),
      pool.map(opportunityToPost),
    )
    assert.ok(commands.length >= 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverTwoWayPostMatch(probe))
    assert.ok(probe.sideA.needId)
    assert.ok(probe.sideB.needId)
  })

  it('maps consortium result to DiscoverConsortiumPostMatchCommand', () => {
    const leadNeed = {
      ...matchingNeed('lead-need', 'lead-creator'),
      attributes: {
        targetRole: 'Architect',
        memberRoles: [
          { role: 'Architect', scope: 'BIM' },
          { role: 'Structural Engineer', scope: 'Bridge Design' },
        ],
      },
    } as Opportunity
    const offer = matchingOffer('offer-consortium', 'arch-only')
    const pool = [leadNeed, offer]

    const [result] = runMatchingForPost({
      anchorPost: opportunityToPost(leadNeed),
      opportunities: pool.map(opportunityToPost),
      config: engineConfig,
      options: { model: 'consortium', includeIncompleteConsortium: true },
    })

    const commands = modelRunResultToDiscoverCommands(
      result,
      createContext(leadNeed, pool),
      pool.map(opportunityToPost),
    )
    assert.ok(commands.length >= 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverConsortiumPostMatch(probe))
    assert.equal(probe.leadNeedId, leadNeed.id)
    assert.ok(probe.roles.length >= 1)
  })

  it('maps circular result to DiscoverCircularPostMatchCommand', () => {
    const needA = matchingNeed('need-c-a', 'creator-a')
    const offerA = matchingOffer('offer-c-a', 'creator-a')
    const needB = matchingNeed('need-c-b', 'creator-b')
    const offerB = matchingOffer('offer-c-b', 'creator-b')
    const needC = matchingNeed('need-c-c', 'creator-c')
    const offerC = matchingOffer('offer-c-c', 'creator-c')
    const pool = [needA, offerA, needB, offerB, needC, offerC]

    const [result] = runMatchingForPost({
      anchorPost: opportunityToPost(needA),
      opportunities: pool.map(opportunityToPost),
      config: engineConfig,
      options: { model: 'circular', minCycleLength: 3 },
    })

    const commands = modelRunResultToDiscoverCommands(
      result,
      createContext(needA, pool),
      pool.map(opportunityToPost),
    )
    assert.ok(commands.length >= 1)
    const probe = {
      commandType: 'DiscoverPostMatch',
      clientRequestId: 'probe',
      ...commands[0],
    } as DiscoverPostMatchCommand
    assert.ok(isDiscoverCircularPostMatch(probe))
    assert.ok(probe.cycle.length >= 3)
    assert.ok(probe.links.length >= 3)
  })
})
