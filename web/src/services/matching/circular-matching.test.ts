import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isDiscoverCircularPostMatch } from '@pm-twin/commands'
import { withMatchingDefaults } from '@pm-twin/matching'
import type { Opportunity, PlatformUser } from '@/types/domain.ts'
import {
  createCommandGatewayTestStack,
  type CommandGatewayTestStack,
} from '@/commands/test-helpers/command-gateway-test-stack.ts'
import { runCircularMatchingUiAction } from '@/lib/run-circular-matching-ui-action.ts'
import { matchingService } from '@/services/matching-service.ts'
import { createPostMatchCommandService } from '@/services/post-match-command-service.ts'
import {
  isMatchingRunAuditEntry,
  parseMatchingRunAuditDetails,
  recordMatchingRunAudit,
} from '@/services/matching/matching-run-audit.ts'

const engineConfig = withMatchingDefaults({
  POST_TO_POST_THRESHOLD: 0.5,
  MIN_SKILL_SCORE_FOR_MATCH: 0.5,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.5,
})

const readyProfile = {
  name: 'Khalid Al-Harbi',
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

function circularNeed(
  id: string,
  creatorId: string,
  role: string,
  services: string[],
): Opportunity {
  return {
    id,
    creatorId,
    title: `Need ${id}`,
    description: 'Circular chain need.',
    intent: 'need',
    status: 'published',
    modelType: 'project_based',
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
    preferredPartnerType: 'company',
    attachments: [{ name: 'brief.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Kickoff', dueDate: '2026-04-01' }],
  } as Opportunity
}

function circularOffer(
  id: string,
  creatorId: string,
  role: string,
  services: string[],
): Opportunity {
  return {
    id,
    creatorId,
    title: `Offer ${id}`,
    description: 'Circular chain offer.',
    intent: 'offer',
    status: 'published',
    modelType: 'project_based',
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
    preferredPartnerType: 'company',
    attachments: [{ name: 'portfolio.pdf' }],
    complianceRequirements: ['Saudi Building Code'],
    deliveryMilestones: [{ title: 'Delivery', dueDate: '2026-04-15' }],
  } as Opportunity
}

function buildCircularCyclePool(prefix = ''): Opportunity[] {
  const p = prefix ? `${prefix}-` : ''
  return [
    circularNeed(`${p}need-a`, `${prefix || ''}creator-a`, 'Architect', ['BIM', 'Revit']),
    circularOffer(`${p}offer-a`, `${prefix || ''}creator-a`, 'Architect', ['Project Management', 'Planning']),
    circularNeed(`${p}need-b`, `${prefix || ''}creator-b`, 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
    circularOffer(`${p}offer-b`, `${prefix || ''}creator-b`, 'Architect', ['BIM', 'Revit']),
    circularNeed(`${p}need-c`, `${prefix || ''}creator-c`, 'Architect', ['Project Management', 'Planning']),
    circularOffer(`${p}offer-c`, `${prefix || ''}creator-c`, 'Civil Engineer', ['Structural Analysis', 'SAP2000']),
  ]
}

function buildDualCircularCyclePool(): Opportunity[] {
  return [...buildCircularCyclePool(), ...buildCircularCyclePool('cycle2')]
}

const testUsers: PlatformUser[] = [
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
  {
    id: 'cycle2-creator-a',
    email: 'd@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'cycle2-creator-b',
    email: 'e@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
  {
    id: 'cycle2-creator-c',
    email: 'f@test.pmtwin',
    role: 'professional',
    status: 'active',
    profile: readyProfile,
  },
]

function createCircularStack(opportunities: Opportunity[]): CommandGatewayTestStack {
  return createCommandGatewayTestStack({ opportunities, users: testUsers })
}

function circularMatchingDeps(
  stack: CommandGatewayTestStack,
  actor: { actorId?: string; actorRole?: string } = {},
) {
  const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })

  return {
    actorId: actor.actorId ?? 'test-admin',
    actorRole: actor.actorRole ?? 'admin',
    listPublishedOpportunities: () =>
      stack.opportunityRepository.getAll().filter((opp) => opp.status === 'published'),
    discoverPostMatch: postMatchService.discoverPostMatch.bind(postMatchService),
    findActiveDuplicateByStrongKey: (strongKey: string) =>
      stack.postMatchRepository.findActiveDuplicateByStrongKey(strongKey),
    getMatchingEngineContext: () => ({ canonical: {}, config: engineConfig }),
    recordMatchingRunAudit: (input: Parameters<typeof recordMatchingRunAudit>[1]) => {
      recordMatchingRunAudit(stack.auditRepository, input)
    },
  }
}

function getMatchingRunAudits(stack: CommandGatewayTestStack) {
  return stack.auditRepository
    .getAll()
    .filter(isMatchingRunAuditEntry)
    .map((entry) => parseMatchingRunAuditDetails(entry))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

describe('runCircularMatchingForPublishedOpportunities', () => {
  it('creates circular PostMatch from published pool', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const deps = circularMatchingDeps(stack)

    const result = matchingService.runCircularMatchingForPublishedOpportunities(deps)

    assert.ok(result.runId.startsWith('run-'))
    assert.equal(result.status, 'completed')
    assert.ok(result.discoveredMatchesCount >= 1)
    assert.equal(result.matchingErrors.length, 0)

    const circularMatches = stack.postMatchRepository
      .getAll()
      .filter((match) => match.matchType === 'circular')
    assert.ok(circularMatches.length >= 1)
    assert.ok(
      circularMatches.some(
        (match) => match.payload?.cycle && match.payload.cycle.length >= 3,
      ),
    )
  })

  it('skips duplicate circular matches on second run', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const deps = circularMatchingDeps(stack)

    const first = matchingService.runCircularMatchingForPublishedOpportunities(deps)
    const second = matchingService.runCircularMatchingForPublishedOpportunities(deps)

    assert.ok(first.discoveredMatchesCount >= 1)
    assert.equal(second.discoveredMatchesCount, 0)
    assert.ok(second.skippedDuplicatesCount >= 1)
  })

  it('returns zero when no circular chain exists', () => {
    const need = circularNeed('solo-need', 'solo-user', 'Architect', ['BIM', 'Revit'])
    const offer = circularOffer('solo-offer', 'solo-user-2', 'Architect', ['BIM', 'Revit'])
    const stack = createCircularStack([need, offer])
    const deps = circularMatchingDeps(stack)

    const result = matchingService.runCircularMatchingForPublishedOpportunities(deps)

    assert.equal(result.discoveredMatchesCount, 0)
    assert.equal(result.skippedDuplicatesCount, 0)
    assert.equal(result.matchingErrors.length, 0)
    assert.equal(
      stack.postMatchRepository.getAll().filter((match) => match.matchType === 'circular').length,
      0,
    )
  })

  it('continues run when a discover command fails', () => {
    const stack = createCircularStack(buildDualCircularCyclePool())
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })
    let discoverCalls = 0

    const result = matchingService.runCircularMatchingForPublishedOpportunities({
      ...circularMatchingDeps(stack),
      discoverPostMatch: (command) => {
        discoverCalls += 1
        if (discoverCalls === 1) {
          return {
            success: false,
            commandType: 'DiscoverPostMatch',
            aggregateId: command.aggregateId,
            errors: ['Injected discover failure'],
          }
        }
        return postMatchService.discoverPostMatch(command)
      },
    })

    assert.ok(discoverCalls >= 2)
    assert.ok(result.matchingErrors.length >= 1)
    assert.ok(result.discoveredMatchesCount >= 1)
    assert.equal(result.status, 'completed_with_errors')
  })

  it('persists only via DiscoverCircularPostMatchCommand shape', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })
    const captured: unknown[] = []

    matchingService.runCircularMatchingForPublishedOpportunities({
      ...circularMatchingDeps(stack),
      discoverPostMatch: (command) => {
        captured.push(command)
        return postMatchService.discoverPostMatch(command)
      },
    })

    assert.ok(captured.length >= 1)
    for (const command of captured) {
      assert.ok(
        isDiscoverCircularPostMatch({
          commandType: 'DiscoverPostMatch',
          clientRequestId: 'probe',
          ...(command as object),
        }),
      )
    }
  })
})

describe('circular matching run audit trail', () => {
  it('writes completed audit record on successful run', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const deps = circularMatchingDeps(stack, { actorId: 'admin-1', actorRole: 'admin' })

    const result = matchingService.runCircularMatchingForPublishedOpportunities(deps)
    const audits = getMatchingRunAudits(stack)

    assert.equal(result.status, 'completed')
    assert.equal(audits.length, 1)
    assert.equal(audits[0]?.runId, result.runId)
    assert.equal(audits[0]?.runType, 'circular')
    assert.equal(audits[0]?.actorId, 'admin-1')
    assert.equal(audits[0]?.actorRole, 'admin')
    assert.equal(audits[0]?.status, 'completed')
    assert.ok(audits[0]?.startedAt)
    assert.ok(audits[0]?.completedAt)
    assert.ok(audits[0]!.discoveredMatchesCount >= 1)
  })

  it('writes completed_with_errors when discover commands fail', () => {
    const stack = createCircularStack(buildDualCircularCyclePool())
    const postMatchService = createPostMatchCommandService({ gateway: stack.gateway })
    let discoverCalls = 0

    const result = matchingService.runCircularMatchingForPublishedOpportunities({
      ...circularMatchingDeps(stack),
      discoverPostMatch: (command) => {
        discoverCalls += 1
        if (discoverCalls === 1) {
          return {
            success: false,
            commandType: 'DiscoverPostMatch',
            aggregateId: command.aggregateId,
            errors: ['Injected discover failure'],
          }
        }
        return postMatchService.discoverPostMatch(command)
      },
    })

    const audit = getMatchingRunAudits(stack).at(-1)
    assert.equal(result.status, 'completed_with_errors')
    assert.equal(audit?.status, 'completed_with_errors')
    assert.ok(audit && audit.matchingErrorsCount >= 1)
    assert.ok(audit.matchingErrors.includes('Injected discover failure'))
  })

  it('writes failed audit record when matching throws', () => {
    const stack = createCircularStack(buildCircularCyclePool())

    const result = matchingService.runCircularMatchingForPublishedOpportunities({
      ...circularMatchingDeps(stack),
      runMatching: () => {
        throw new Error('Injected engine failure')
      },
    })

    const audit = getMatchingRunAudits(stack).at(-1)
    assert.equal(result.status, 'failed')
    assert.equal(audit?.status, 'failed')
    assert.equal(audit?.failureReason, 'Injected engine failure')
    assert.equal(result.discoveredMatchesCount, 0)
  })

  it('returns matching result when audit write fails', () => {
    const stack = createCircularStack(buildCircularCyclePool())

    const result = matchingService.runCircularMatchingForPublishedOpportunities({
      ...circularMatchingDeps(stack),
      recordMatchingRunAudit: () => {
        throw new Error('Injected audit failure')
      },
    })

    assert.ok(result.discoveredMatchesCount >= 1)
    assert.equal(result.status, 'completed')
    assert.ok(result.auditWarning)
    assert.equal(getMatchingRunAudits(stack).length, 0)
  })

  it('returns runId on every run', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const result = matchingService.runCircularMatchingForPublishedOpportunities(
      circularMatchingDeps(stack),
    )

    assert.ok(result.runId.startsWith('run-'))
    assert.equal(result.runId, getMatchingRunAudits(stack)[0]?.runId)
  })
})

describe('runCircularMatchingUiAction RBAC', () => {
  it('denies non-admin roles', () => {
    const result = runCircularMatchingUiAction({ userRole: 'professional' })
    assert.equal(result.success, false)
    if (result.success) return
    assert.equal(result.code, 'ACCESS_DENIED')
  })

  it('allows admin roles to execute', () => {
    const stack = createCircularStack(buildCircularCyclePool())
    const result = runCircularMatchingUiAction(
      { userId: 'admin-1', userRole: 'admin' },
      {
        runCircularMatching: (actor) =>
          matchingService.runCircularMatchingForPublishedOpportunities({
            ...circularMatchingDeps(stack),
            actorId: actor.userId,
            actorRole: actor.userRole,
          }),
      },
    )

    assert.equal(result.success, true)
    if (!result.success) return
    assert.ok(result.discoveredMatchesCount >= 1)
    assert.ok(result.runId.startsWith('run-'))
  })

  it('allows moderator roles to execute', () => {
    const result = runCircularMatchingUiAction(
      { userRole: 'moderator' },
      {
        runCircularMatching: () => ({
          runId: 'run-test',
          discoveredMatchesCount: 0,
          skippedDuplicatesCount: 0,
          matchingErrors: [],
          status: 'completed',
        }),
      },
    )

    assert.equal(result.success, true)
  })
})
