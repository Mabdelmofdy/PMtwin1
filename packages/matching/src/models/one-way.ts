import { getCandidates, getCandidatesForOffer } from '../candidates/candidate-generator.ts'
import { oneWayValueFit } from '../value/value-compatibility.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { OneWayMatchResult, ModelRunnerOptions, ScoredMatch } from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import {
  passHardGate,
  resolveMaxCandidates,
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'

function scoreOneWayMatch(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
  config: MatchingConfig,
  canonical: CanonicalData,
  threshold: number,
): ScoredMatch | null {
  const needNorm = resolveNormalized(needPost, canonical, config)
  const offerNorm = resolveNormalized(offerPost, canonical, config)
  if (!passHardGate(needPost, offerPost, needNorm, offerNorm, config)) return null

  const scored = scorePair(needPost, offerPost, config, needNorm, offerNorm)
  if (scored.score < threshold) return null

  const valueAnalysis: Readonly<Record<string, unknown>> = { ...oneWayValueFit(needPost, offerPost) }
  return {
    matchScore: scored.score,
    breakdown: scored.breakdown,
    labels: scored.labels,
    valueAnalysis,
    suggestedPartners: [{
      opportunityId: offerPost.id,
      creatorId: offerPost.creatorId,
    }],
    needOpportunityId: needPost.id,
    offerOpportunityId: offerPost.id,
  }
}

export function findOffersForNeedPure(
  needPost: OpportunityPost,
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): OneWayMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  if ((needPost.intent ?? 'request') !== 'request') {
    return { model: 'one_way', matches: [] }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const needNorm = resolveNormalized(needPost, canonical, resolvedConfig)
  const candidates = getCandidates(needPost, offerPosts, resolvedConfig, {
    maxCandidates: resolveMaxCandidates(resolvedConfig, options.maxCandidates),
    needNormalized: needNorm,
  })

  const matches = candidates
    .map((offer) => scoreOneWayMatch(needPost, offer, resolvedConfig, canonical, threshold))
    .filter((match): match is ScoredMatch => match != null)
    .sort((a, b) => b.matchScore - a.matchScore)

  const topN = options.topN ?? 20
  return { model: 'one_way', matches: matches.slice(0, topN) }
}

export function findNeedsForOfferPure(
  offerPost: OpportunityPost,
  needPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): OneWayMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  if ((offerPost.intent ?? '') !== 'offer' || offerPost.status !== 'published') {
    return { model: 'one_way', direction: 'offer_to_needs', matches: [] }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const offerNorm = resolveNormalized(offerPost, canonical, resolvedConfig)
  const candidates = getCandidatesForOffer(offerPost, needPosts, resolvedConfig, {
    maxCandidates: resolveMaxCandidates(resolvedConfig, options.maxCandidates),
    offerNormalized: offerNorm,
  })

  const matches: ScoredMatch[] = []
  for (const need of candidates) {
    const needNorm = resolveNormalized(need, canonical, resolvedConfig)
    if (!passHardGate(need, offerPost, needNorm, offerNorm, resolvedConfig)) continue
    const scored = scorePair(need, offerPost, resolvedConfig, needNorm, offerNorm)
    if (scored.score < threshold) continue
    matches.push({
      matchScore: scored.score,
      breakdown: scored.breakdown,
      labels: scored.labels,
      suggestedPartners: [{
        opportunityId: need.id,
        creatorId: need.creatorId,
      }],
      needOpportunityId: need.id,
      offerOpportunityId: offerPost.id,
    })
  }
  matches.sort((a, b) => b.matchScore - a.matchScore)

  const topN = options.topN ?? 20
  return {
    model: 'one_way',
    direction: 'offer_to_needs',
    matches: matches.slice(0, topN),
  }
}
