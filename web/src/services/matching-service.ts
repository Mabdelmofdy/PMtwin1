import type { Application, ApplicationValue, Opportunity, PostMatch } from '@/types/domain.ts'
import type { Participant } from '@/types/participant.ts'
import type { CommandResult } from '@pm-twin/commands'
import type { MatchEngineOptions, ModelRunResult } from '@pm-twin/matching'
import { runMatchingForPost } from '@pm-twin/matching'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import { applyReadinessAdjustmentIfEnabled } from '@/domain/matching-readiness-adjustment/apply-readiness-adjustment.ts'
import { getMatchingEngineContext } from '@/infrastructure/matching/matching-engine-context.ts'
import {
  opportunityRepository,
  postMatchRepository,
  applicationRepository,
  auditRepository,
  userRepository,
  companyRepository,
} from '@/repositories/index.ts'
import {
  buildMatchingDiscoveryContext,
  resolveOpportunityOwner,
} from '@/domain/identity/matching-discovery-context.ts'
import {
  discoverInputStrongKey,
  modelRunResultToDiscoverCommands,
} from '@/services/matching/model-run-discover-adapter.ts'
import {
  opportunitiesToPosts,
  opportunityToPost,
} from '@/services/matching/opportunity-post-adapter.ts'
import {
  postMatchCommandService,
  type DiscoverOneWayPostMatchInput,
  type DiscoverPostMatchInput,
} from '@/services/post-match-command-service.ts'
import type { MatchingRunStatus } from '@/domain/matching-run-audit/types.ts'
import {
  recordMatchingRunAudit,
  resolveMatchingRunStatus,
  type RecordMatchingRunAuditInput,
} from '@/services/matching/matching-run-audit.ts'

export {
  ENABLE_PROFILE_FIT_MATCH_WEIGHTING,
  ENABLE_PROFILE_FIT_RECOMMENDATIONS,
  buildProfileFitSnapshot,
  scoreProfileOpportunityFit,
  listProfileOpportunityRecommendations,
  type ProfileOpportunityRecommendation,
} from '@/services/matching/profile-fit-service.ts'

function buildMatchingOwnershipContext(): ReturnType<typeof buildMatchingDiscoveryContext> {
  return buildMatchingDiscoveryContext(
    userRepository.getAll().map((user) => user.id),
    companyRepository.getAll().map((company) => company.id),
  )
}

function resolveAnchorOwnerPartyKey(
  opportunity: Opportunity,
  ownershipContext: ReturnType<typeof buildMatchingDiscoveryContext>,
): string | undefined {
  if (opportunity.ownerPartyId) return opportunity.ownerPartyId
  return resolveOpportunityOwner(opportunity, ownershipContext)?.ownerPartyId
}

export type DiscoverNeedOfferMatchInput = {
  readonly needOpportunityId: string
  readonly offerOpportunityId: string
  readonly matchScore: number
  readonly matchCriteria: Record<string, number>
  readonly participants: readonly Participant[]
  readonly runId?: string
  readonly aggregateId?: string
  readonly sourceProfile?: object | null
  readonly targetProfile?: object | null
  readonly sourceProfileKind?: ProfileKind
  readonly targetProfileKind?: ProfileKind
  readonly sourceOpportunity?: object | null
  readonly targetOpportunity?: object | null
  /** Test-only override for readiness score integration. */
  readonly readinessAdjustmentEnabled?: boolean
}

export type DiscoverNeedOfferMatchResult =
  | { readonly success: true; readonly postMatchId: string; readonly postMatch: PostMatch }
  | { readonly success: false; readonly errors: readonly string[] }

export type MatchingServiceDeps = {
  readonly discoverPostMatch?: (input: DiscoverOneWayPostMatchInput) => CommandResult
  readonly readPostMatch?: (id: string) => PostMatch | undefined
}

export type PublishMatchingResult = {
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrors: readonly string[]
  readonly postMatchIds: readonly string[]
}

export type PublishMatchingDeps = {
  readonly getOpportunityById?: (id: string) => Opportunity | undefined
  readonly listPublishedOpportunities?: () => readonly Opportunity[]
  readonly discoverPostMatch?: (input: DiscoverPostMatchInput) => CommandResult
  readonly findActiveDuplicateByStrongKey?: (strongKey: string) => PostMatch | undefined
  readonly runMatching?: typeof runMatchingForPost
  readonly getMatchingEngineContext?: typeof getMatchingEngineContext
  readonly engineOptions?: MatchEngineOptions
  readonly actorId?: string
  readonly actorRole?: string | null
  readonly recordMatchingRunAudit?: (input: RecordMatchingRunAuditInput) => void
}

export type CircularMatchingResult = {
  readonly runId: string
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrors: readonly string[]
  readonly status: MatchingRunStatus
  readonly auditWarning?: string
}

export type CircularMatchingDeps = {
  readonly actorId?: string
  readonly actorRole?: string | null
  readonly listPublishedOpportunities?: () => readonly Opportunity[]
  readonly discoverPostMatch?: (input: DiscoverPostMatchInput) => CommandResult
  readonly findActiveDuplicateByStrongKey?: (strongKey: string) => PostMatch | undefined
  readonly runMatching?: typeof runMatchingForPost
  readonly getMatchingEngineContext?: typeof getMatchingEngineContext
  readonly engineOptions?: MatchEngineOptions
  readonly recordMatchingRunAudit?: (input: RecordMatchingRunAuditInput) => void
}

function createPostMatchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pm-${crypto.randomUUID()}`
  }
  return `pm-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function resolveDiscoverMatchScore(
  input: Pick<
    DiscoverNeedOfferMatchInput,
    | 'matchScore'
    | 'sourceProfile'
    | 'targetProfile'
    | 'sourceProfileKind'
    | 'targetProfileKind'
    | 'sourceOpportunity'
    | 'targetOpportunity'
    | 'readinessAdjustmentEnabled'
  >,
): number {
  return applyReadinessAdjustmentIfEnabled({
    baseScore: input.matchScore,
    sourceProfile: input.sourceProfile,
    targetProfile: input.targetProfile,
    sourceProfileKind: input.sourceProfileKind,
    targetProfileKind: input.targetProfileKind,
    sourceOpportunity: input.sourceOpportunity,
    targetOpportunity: input.targetOpportunity,
    featureEnabled: input.readinessAdjustmentEnabled,
  }).score
}

function discoverNeedOfferMatch(
  input: DiscoverNeedOfferMatchInput,
  deps?: MatchingServiceDeps,
): DiscoverNeedOfferMatchResult {
  const aggregateId = input.aggregateId ?? createPostMatchId()
  const discover =
    deps?.discoverPostMatch ??
    postMatchCommandService.discoverPostMatch.bind(postMatchCommandService)
  const readPostMatch = deps?.readPostMatch ?? ((id) => postMatchRepository.getById(id))

  const discoverInput: DiscoverOneWayPostMatchInput = {
    aggregateId,
    matchType: 'one_way',
    needOpportunityId: input.needOpportunityId,
    offerOpportunityId: input.offerOpportunityId,
    matchScore: resolveDiscoverMatchScore(input),
    matchCriteria: input.matchCriteria,
    participants: input.participants,
    runId: input.runId,
  }
  const result: CommandResult = discover(discoverInput)

  if (!result.success) {
    return { success: false, errors: result.errors ?? ['DiscoverPostMatch failed'] }
  }

  const postMatch = readPostMatch(aggregateId)
  if (!postMatch) {
    return {
      success: false,
      errors: [`PostMatch "${aggregateId}" not found after discover`],
    }
  }

  return { success: true, postMatchId: aggregateId, postMatch }
}

function createPublishRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `run-${crypto.randomUUID()}`
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isDuplicateDiscoverError(errors: readonly string[] | undefined): boolean {
  return (errors ?? []).some((error) => error.includes('Active PostMatch already exists'))
}

function writeCircularMatchingRunAudit(
  deps: CircularMatchingDeps | undefined,
  input: Omit<RecordMatchingRunAuditInput, 'runType'>,
): string | undefined {
  try {
    const record =
      deps?.recordMatchingRunAudit
      ?? ((auditInput) => {
        recordMatchingRunAudit(auditRepository, auditInput)
      })
    record({ ...input, runType: 'circular' })
    return undefined
  } catch {
    return 'Matching results were saved, but the audit record could not be written.'
  }
}

function finalizeCircularMatchingResult(
  deps: CircularMatchingDeps | undefined,
  startedAt: string,
  runId: string,
  discoveredMatchesCount: number,
  skippedDuplicatesCount: number,
  matchingErrors: readonly string[],
  status: MatchingRunStatus,
  failureReason?: string,
): CircularMatchingResult {
  const auditWarning = writeCircularMatchingRunAudit(deps, {
    runId,
    actorId: deps?.actorId,
    actorRole: deps?.actorRole,
    startedAt,
    completedAt: new Date().toISOString(),
    discoveredMatchesCount,
    skippedDuplicatesCount,
    matchingErrors,
    status,
    failureReason,
  })

  return {
    runId,
    discoveredMatchesCount,
    skippedDuplicatesCount,
    matchingErrors,
    status,
    auditWarning,
  }
}

function runPublishMatchingForOpportunity(
  opportunityId: string,
  deps?: PublishMatchingDeps,
): PublishMatchingResult {
  const empty: PublishMatchingResult = {
    discoveredMatchesCount: 0,
    skippedDuplicatesCount: 0,
    matchingErrors: [],
    postMatchIds: [],
  }
  const startedAt = new Date().toISOString()

  const getOpportunityById =
    deps?.getOpportunityById ?? ((id) => opportunityRepository.getById(id))
  const listPublishedOpportunities =
    deps?.listPublishedOpportunities
    ?? (() => opportunityRepository.getAll().filter((opp) => opp.status === 'published'))
  const discoverPostMatch =
    deps?.discoverPostMatch
    ?? postMatchCommandService.discoverPostMatch.bind(postMatchCommandService)
  const findActiveDuplicateByStrongKey =
    deps?.findActiveDuplicateByStrongKey
    ?? ((strongKey) => postMatchRepository.findActiveDuplicateByStrongKey(strongKey))
  const runMatching = deps?.runMatching ?? runMatchingForPost
  const resolveEngineContext = deps?.getMatchingEngineContext ?? getMatchingEngineContext

  const anchorOpportunity = getOpportunityById(opportunityId)
  if (!anchorOpportunity || anchorOpportunity.status !== 'published') {
    return empty
  }

  const publishedPool = listPublishedOpportunities()
  const opportunityById = new Map(publishedPool.map((opp) => [opp.id, opp]))
  const posts = opportunitiesToPosts(publishedPool)
  const postById = new Map(
    posts.filter((post) => post.id).map((post) => [post.id as string, post]),
  )
  const { canonical, config } = resolveEngineContext()
  const runId = createPublishRunId()
  const seenStrongKeys = new Set<string>()

  const engineResults = runMatching({
    anchorPost: opportunityToPost(anchorOpportunity),
    opportunities: posts,
    canonical,
    config,
    options: deps?.engineOptions ?? { model: 'auto' },
  })

  const matchingErrors: string[] = []
  const postMatchIds: string[] = []
  let discoveredMatchesCount = 0
  let skippedDuplicatesCount = 0

  const ownershipContext = buildMatchingOwnershipContext()
  const discoverContext = {
    anchorOpportunity,
    opportunityById,
    postById,
    ownershipContext,
    runId,
    createAggregateId: createPostMatchId,
  }

  for (const result of engineResults as ModelRunResult[]) {
    const commands = modelRunResultToDiscoverCommands(result, discoverContext, posts)
    for (const command of commands) {
      const strongKey = discoverInputStrongKey(command)
      if (strongKey) {
        if (seenStrongKeys.has(strongKey) || findActiveDuplicateByStrongKey(strongKey)) {
          skippedDuplicatesCount += 1
          continue
        }
        seenStrongKeys.add(strongKey)
      }

      const commandResult = discoverPostMatch(command)
      if (!commandResult.success) {
        if (isDuplicateDiscoverError(commandResult.errors)) {
          skippedDuplicatesCount += 1
          if (strongKey) seenStrongKeys.add(strongKey)
          continue
        }
        matchingErrors.push(
          ...(commandResult.errors ?? [`DiscoverPostMatch failed for ${command.aggregateId}`]),
        )
        continue
      }

      discoveredMatchesCount += 1
      postMatchIds.push(command.aggregateId)
    }
  }

  try {
    const record =
      deps?.recordMatchingRunAudit
      ?? ((auditInput: RecordMatchingRunAuditInput) => {
        recordMatchingRunAudit(auditRepository, auditInput)
      })
    record({
      runId,
      runType: 'publish',
      actorId: deps?.actorId,
      actorRole: deps?.actorRole,
      startedAt,
      completedAt: new Date().toISOString(),
      discoveredMatchesCount,
      skippedDuplicatesCount,
      matchingErrors,
      status: resolveMatchingRunStatus(matchingErrors),
    })
  } catch {
    // best-effort: publish matching must not fail when audit write fails
  }

  return {
    discoveredMatchesCount,
    skippedDuplicatesCount,
    matchingErrors,
    postMatchIds,
  }
}

export type BatchPublishMatchingResult = {
  readonly runId: string
  readonly discoveredMatchesCount: number
  readonly skippedDuplicatesCount: number
  readonly matchingErrors: readonly string[]
  readonly postMatchIds: readonly string[]
  readonly opportunitiesProcessed: number
  readonly status: MatchingRunStatus
  readonly auditWarning?: string
}

/**
 * Admin / ops: re-run publish (auto / one_way) matching for every published
 * opportunity. Use this for Need↔Offer pairs — circular matching alone will
 * not discover them (circular requires cycles of length ≥ 3).
 */
function runPublishMatchingForPublishedOpportunities(
  deps?: PublishMatchingDeps & {
    readonly listPublishedOpportunities?: () => readonly Opportunity[]
  },
): BatchPublishMatchingResult {
  const startedAt = new Date().toISOString()
  const runId = createPublishRunId()
  const listPublishedOpportunities =
    deps?.listPublishedOpportunities
    ?? (() => opportunityRepository.getAll().filter((opp) => opp.status === 'published'))

  const published = listPublishedOpportunities()
  const seenPostMatchIds = new Set<string>()
  const matchingErrors: string[] = []
  let discoveredMatchesCount = 0
  let skippedDuplicatesCount = 0

  for (const opportunity of published) {
    const result = runPublishMatchingForOpportunity(opportunity.id, {
      ...deps,
      // Suppress per-opportunity audit; we write one batch audit below.
      recordMatchingRunAudit: () => undefined,
      listPublishedOpportunities: () => published,
    })
    discoveredMatchesCount += result.discoveredMatchesCount
    skippedDuplicatesCount += result.skippedDuplicatesCount
    matchingErrors.push(...result.matchingErrors)
    for (const id of result.postMatchIds) {
      if (!seenPostMatchIds.has(id)) seenPostMatchIds.add(id)
    }
  }

  const status = resolveMatchingRunStatus(matchingErrors)
  let auditWarning: string | undefined
  try {
    const record =
      deps?.recordMatchingRunAudit
      ?? ((auditInput: RecordMatchingRunAuditInput) => {
        recordMatchingRunAudit(auditRepository, auditInput)
      })
    record({
      runId,
      runType: 'publish',
      actorId: deps?.actorId,
      actorRole: deps?.actorRole,
      startedAt,
      completedAt: new Date().toISOString(),
      discoveredMatchesCount,
      skippedDuplicatesCount,
      matchingErrors,
      status,
    })
  } catch {
    auditWarning =
      'Matching results were saved, but the audit record could not be written.'
  }

  return {
    runId,
    discoveredMatchesCount,
    skippedDuplicatesCount,
    matchingErrors,
    postMatchIds: [...seenPostMatchIds],
    opportunitiesProcessed: published.length,
    status,
    auditWarning,
  }
}

function runCircularMatchingForPublishedOpportunities(
  deps?: CircularMatchingDeps,
): CircularMatchingResult {
  const startedAt = new Date().toISOString()
  const runId = createPublishRunId()

  try {
    const listPublishedOpportunities =
      deps?.listPublishedOpportunities
      ?? (() => opportunityRepository.getAll().filter((opp) => opp.status === 'published'))
    const discoverPostMatch =
      deps?.discoverPostMatch
      ?? postMatchCommandService.discoverPostMatch.bind(postMatchCommandService)
    const findActiveDuplicateByStrongKey =
      deps?.findActiveDuplicateByStrongKey
      ?? ((strongKey) => postMatchRepository.findActiveDuplicateByStrongKey(strongKey))
    const runMatching = deps?.runMatching ?? runMatchingForPost
    const resolveEngineContext = deps?.getMatchingEngineContext ?? getMatchingEngineContext

    const publishedPool = listPublishedOpportunities()
    if (publishedPool.length === 0) {
      return finalizeCircularMatchingResult(
        deps,
        startedAt,
        runId,
        0,
        0,
        [],
        'completed',
      )
    }

    const opportunityById = new Map(publishedPool.map((opp) => [opp.id, opp]))
    const posts = opportunitiesToPosts(publishedPool)
    const postById = new Map(
      posts.filter((post) => post.id).map((post) => [post.id as string, post]),
    )
    const { canonical, config } = resolveEngineContext()
    const seenStrongKeys = new Set<string>()
    const matchingErrors: string[] = []
    let discoveredMatchesCount = 0
    let skippedDuplicatesCount = 0

    const ownershipContext = buildMatchingOwnershipContext()
    const anchorsByOwnerParty = new Map<string, Opportunity>()
    for (const opportunity of publishedPool) {
      const ownerPartyKey = resolveAnchorOwnerPartyKey(opportunity, ownershipContext)
      if (ownerPartyKey && !anchorsByOwnerParty.has(ownerPartyKey)) {
        anchorsByOwnerParty.set(ownerPartyKey, opportunity)
      }
    }

    for (const anchorOpportunity of anchorsByOwnerParty.values()) {
      const engineResults = runMatching({
        anchorPost: opportunityToPost(anchorOpportunity),
        opportunities: posts,
        canonical,
        config,
        options: deps?.engineOptions ?? { model: 'circular', minCycleLength: 3 },
      })

      const discoverContext = {
        anchorOpportunity,
        opportunityById,
        postById,
        ownershipContext,
        runId,
        createAggregateId: createPostMatchId,
      }

      for (const result of engineResults as ModelRunResult[]) {
        if (result.model !== 'circular') continue

        const commands = modelRunResultToDiscoverCommands(result, discoverContext, posts)
        for (const command of commands) {
          if (command.matchType !== 'circular') continue

          const strongKey = discoverInputStrongKey(command)
          if (strongKey) {
            if (seenStrongKeys.has(strongKey) || findActiveDuplicateByStrongKey(strongKey)) {
              skippedDuplicatesCount += 1
              continue
            }
            seenStrongKeys.add(strongKey)
          }

          const commandResult = discoverPostMatch(command)
          if (!commandResult.success) {
            if (isDuplicateDiscoverError(commandResult.errors)) {
              skippedDuplicatesCount += 1
              if (strongKey) seenStrongKeys.add(strongKey)
              continue
            }
            matchingErrors.push(
              ...(commandResult.errors ?? [`DiscoverPostMatch failed for ${command.aggregateId}`]),
            )
            continue
          }

          discoveredMatchesCount += 1
        }
      }
    }

    return finalizeCircularMatchingResult(
      deps,
      startedAt,
      runId,
      discoveredMatchesCount,
      skippedDuplicatesCount,
      matchingErrors,
      resolveMatchingRunStatus(matchingErrors),
    )
  } catch (error) {
    const failureReason =
      error instanceof Error ? error.message : 'Circular matching run failed'
    return finalizeCircularMatchingResult(
      deps,
      startedAt,
      runId,
      0,
      0,
      [failureReason],
      'failed',
      failureReason,
    )
  }
}

/**
 * Creator-anchored circular pass for a single freshly published opportunity.
 * Mirrors the POC behavior of persisting cycles that include the publishing
 * creator. Best-effort: intended to be called after publish matching.
 */
function runCircularMatchingForOpportunity(
  opportunityId: string,
  deps?: PublishMatchingDeps,
): PublishMatchingResult {
  const empty: PublishMatchingResult = {
    discoveredMatchesCount: 0,
    skippedDuplicatesCount: 0,
    matchingErrors: [],
    postMatchIds: [],
  }

  const getOpportunityById =
    deps?.getOpportunityById ?? ((id) => opportunityRepository.getById(id))
  const listPublishedOpportunities =
    deps?.listPublishedOpportunities
    ?? (() => opportunityRepository.getAll().filter((opp) => opp.status === 'published'))
  const discoverPostMatch =
    deps?.discoverPostMatch
    ?? postMatchCommandService.discoverPostMatch.bind(postMatchCommandService)
  const findActiveDuplicateByStrongKey =
    deps?.findActiveDuplicateByStrongKey
    ?? ((strongKey) => postMatchRepository.findActiveDuplicateByStrongKey(strongKey))
  const runMatching = deps?.runMatching ?? runMatchingForPost
  const resolveEngineContext = deps?.getMatchingEngineContext ?? getMatchingEngineContext

  const anchorOpportunity = getOpportunityById(opportunityId)
  if (!anchorOpportunity || anchorOpportunity.status !== 'published') {
    return empty
  }

  const publishedPool = listPublishedOpportunities()
  const opportunityById = new Map(publishedPool.map((opp) => [opp.id, opp]))
  const posts = opportunitiesToPosts(publishedPool)
  const postById = new Map(
    posts.filter((post) => post.id).map((post) => [post.id as string, post]),
  )
  const { canonical, config } = resolveEngineContext()
  const runId = createPublishRunId()
  const seenStrongKeys = new Set<string>()
  const matchingErrors: string[] = []
  const postMatchIds: string[] = []
  let discoveredMatchesCount = 0
  let skippedDuplicatesCount = 0

  const engineResults = runMatching({
    anchorPost: opportunityToPost(anchorOpportunity),
    opportunities: posts,
    canonical,
    config,
    options: deps?.engineOptions ?? { model: 'circular', minCycleLength: 3 },
  })

  const ownershipContext = buildMatchingOwnershipContext()
  const discoverContext = {
    anchorOpportunity,
    opportunityById,
    postById,
    ownershipContext,
    runId,
    createAggregateId: createPostMatchId,
  }

  for (const result of engineResults as ModelRunResult[]) {
    if (result.model !== 'circular') continue

    const commands = modelRunResultToDiscoverCommands(result, discoverContext, posts)
    for (const command of commands) {
      if (command.matchType !== 'circular') continue

      const strongKey = discoverInputStrongKey(command)
      if (strongKey) {
        if (seenStrongKeys.has(strongKey) || findActiveDuplicateByStrongKey(strongKey)) {
          skippedDuplicatesCount += 1
          continue
        }
        seenStrongKeys.add(strongKey)
      }

      const commandResult = discoverPostMatch(command)
      if (!commandResult.success) {
        if (isDuplicateDiscoverError(commandResult.errors)) {
          skippedDuplicatesCount += 1
          if (strongKey) seenStrongKeys.add(strongKey)
          continue
        }
        matchingErrors.push(
          ...(commandResult.errors ?? [`DiscoverPostMatch failed for ${command.aggregateId}`]),
        )
        continue
      }

      discoveredMatchesCount += 1
      postMatchIds.push(command.aggregateId)
    }
  }

  return {
    discoveredMatchesCount,
    skippedDuplicatesCount,
    matchingErrors,
    postMatchIds,
  }
}

function normalizeApplicationValue(rawValue?: ApplicationValue | null) {
  const av = rawValue || {}
  const requestedValue =
    av.requestedValue ?? av.requested_value ?? av.amount ?? null
  const currency = av.currency || 'SAR'
  const valueScore = av.value_score ?? null
  return {
    requestedValue,
    currency,
    valueScore: valueScore != null ? Number(valueScore) : null,
    valueScorePct:
      valueScore != null ? Math.round(Number(valueScore) * 100) : null,
  }
}

function formatApplicationValueAmount(
  rawValue?: ApplicationValue | null,
): string | null {
  const n = normalizeApplicationValue(rawValue)
  if (n.requestedValue != null && String(n.requestedValue).trim() !== '') {
    const display =
      typeof n.requestedValue === 'number'
        ? n.requestedValue.toLocaleString()
        : String(n.requestedValue)
    return `${display} ${n.currency}`
  }
  return null
}

function sortApplicationsByValueScore(
  applications: Application[],
): Application[] {
  const score = (a: Application) => {
    const v = normalizeApplicationValue(a.application_value).valueScore
    return v != null ? v : -1
  }
  return [...applications].sort((a, b) => score(b) - score(a))
}

export const matchingService = {
  normalizeApplicationValue,
  formatApplicationValueAmount,
  sortApplicationsByValueScore,
  discoverNeedOfferMatch,
  resolveDiscoverMatchScore,
  runPublishMatchingForOpportunity,
  runPublishMatchingForPublishedOpportunities,
  runCircularMatchingForOpportunity,
  runCircularMatchingForPublishedOpportunities,

  getHighMatches(threshold = 0.9): PostMatch[] {
    return postMatchRepository
      .getAll()
      .filter((m) => m.matchScore >= threshold)
  },

  getMatchesForUser(userId: string): PostMatch[] {
    return postMatchRepository.getByUser(userId)
  },

  getMatchBreakdown(
    matchId: string,
  ): Record<string, number> | undefined {
    const match = postMatchRepository.getById(matchId)
    return match?.payload?.breakdown
  },

  getFilteredApplications(opportunityId: string): Application[] {
    return applicationRepository.getByOpportunity(opportunityId)
  },
}
