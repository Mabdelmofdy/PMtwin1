import { withMatchingDefaults } from '../config/defaults.ts'
import {
  findBarterMatchesPure,
  findCircularExchangesPure,
  findConsortiumMatchesPure,
  findNeedsForOfferPure,
  findOffersForNeedPure,
} from '../models/index.ts'
import { extractAndNormalize } from '../normalize/extract.ts'
import { detectMatchingModel } from '../routing/detect-model.ts'
import { rankMatches } from '../routing/rank-matches.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchEngineInput, MatchEngineOptions, ModelRunResult } from '../types/engine.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { MatchingModelName, RankedMatch } from '../types/match-result.ts'
import type {
  ConsortiumMatchResult,
  ModelRunnerOptions,
  OneWayMatchResult,
} from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

function normalizePost(
  post: OpportunityPost,
  canonical: CanonicalData,
  config: MatchingConfig,
): OpportunityPost {
  // Always merge through extract so wizard role+skills posts also get
  // budget/timeline/categories/location from top-level fields.
  const extracted = extractAndNormalize(
    { ...post, normalized: undefined },
    canonical,
    { config },
  )
  const existing = post.normalized
  if (!existing) {
    return { ...post, normalized: extracted }
  }

  return {
    ...post,
    normalized: {
      ...extracted,
      ...existing,
      location: existing.location || extracted.location,
      locationCountry: existing.locationCountry || extracted.locationCountry,
      coverageScopes:
        (existing.coverageScopes?.length
          ? existing.coverageScopes
          : extracted.coverageScopes) ?? [],
      role: existing.role || extracted.role,
      requiredServices:
        (existing.requiredServices?.length
          ? existing.requiredServices
          : extracted.requiredServices) ?? [],
      offeredServices:
        (existing.offeredServices?.length
          ? existing.offeredServices
          : extracted.offeredServices) ?? [],
      skills:
        (existing.skills?.length ? existing.skills : extracted.skills) ?? [],
      coreSkills:
        (existing.coreSkills?.length
          ? existing.coreSkills
          : extracted.coreSkills) ?? [],
      modelType: existing.modelType ?? extracted.modelType,
      subModelType: existing.subModelType ?? extracted.subModelType,
      categories:
        (existing.categories?.length
          ? existing.categories
          : extracted.categories) ?? [],
      budget: existing.budget ?? extracted.budget,
      timeline: existing.timeline ?? extracted.timeline,
      deadline: existing.deadline ?? extracted.deadline,
      availability: existing.availability ?? extracted.availability,
      reputation: existing.reputation ?? extracted.reputation,
      intent: existing.intent ?? extracted.intent,
    },
  }
}

function splitPool(pool: readonly OpportunityPost[]): {
  readonly needs: OpportunityPost[]
  readonly offers: OpportunityPost[]
} {
  const needs: OpportunityPost[] = []
  const offers: OpportunityPost[] = []
  for (const post of pool) {
    const intent = post.intent ?? 'request'
    if (intent === 'request' || intent === 'hybrid') needs.push(post)
    if (intent === 'offer' || intent === 'hybrid') offers.push(post)
  }
  return { needs, offers }
}

function resolveModels(
  anchor: OpportunityPost,
  options?: MatchEngineOptions,
): MatchingModelName[] {
  const selected = options?.model ?? 'auto'
  if (selected !== 'auto') return [selected]
  return detectMatchingModel(anchor)
}

function toRunnerOptions(options?: MatchEngineOptions): ModelRunnerOptions {
  return {
    topN: options?.topN,
    maxCandidates: options?.maxCandidates,
    minCycleLength: options?.minCycleLength,
  }
}

function applyRanking<T extends ModelRunResult>(result: T): T {
  const ranked = rankMatches([...result.matches] as RankedMatch[], result.model)
  return { ...result, matches: ranked }
}

function applyTopN<T extends ModelRunResult>(result: T, topN?: number): T {
  if (topN == null) return result
  return { ...result, matches: result.matches.slice(0, topN) }
}

function filterConsortiumResult(
  result: ConsortiumMatchResult,
  includeIncompleteConsortium?: boolean,
): ConsortiumMatchResult {
  if (includeIncompleteConsortium !== false || result.complete) {
    return result
  }
  return { ...result, matches: [] }
}

function runOneWay(
  anchor: OpportunityPost,
  needs: readonly OpportunityPost[],
  offers: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData,
  runnerOptions: ModelRunnerOptions,
): OneWayMatchResult {
  const intent = anchor.intent ?? 'request'
  if (intent === 'offer') {
    return findNeedsForOfferPure(anchor, needs, config, canonical, runnerOptions)
  }
  return findOffersForNeedPure(anchor, offers, config, canonical, runnerOptions)
}

/**
 * Pure matching engine entry point — normalizes input, routes models, scores, ranks.
 * No I/O, persistence, or side effects.
 */
export function runMatchingForPost(input: MatchEngineInput): ModelRunResult[] {
  const config = withMatchingDefaults(input.config)
  const canonical = input.canonical ?? {}
  const options = input.options ?? {}
  const runnerOptions = toRunnerOptions(options)

  const anchor = normalizePost(input.anchorPost, canonical, config)
  const pool = input.opportunities
    .filter((post) => post.id !== anchor.id)
    .map((post) => normalizePost(post, canonical, config))

  const { needs, offers } = splitPool([anchor, ...pool])
  const models = resolveModels(anchor, options)
  const results: ModelRunResult[] = []

  for (const model of models) {
    let result: ModelRunResult | null = null
    switch (model) {
      case 'one_way':
        result = runOneWay(anchor, needs, offers, config, canonical, runnerOptions)
        break
      case 'two_way':
        result = findBarterMatchesPure(anchor, needs, offers, config, canonical, runnerOptions)
        break
      case 'consortium':
        result = filterConsortiumResult(
          findConsortiumMatchesPure(anchor, offers, config, canonical, runnerOptions),
          options.includeIncompleteConsortium,
        )
        break
      case 'circular':
        result = findCircularExchangesPure(needs, offers, config, canonical, runnerOptions)
        break
      default:
        break
    }
    if (result) {
      results.push(applyTopN(applyRanking(result), options.topN))
    }
  }

  return results
}
