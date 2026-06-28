import { getCandidates } from '../candidates/candidate-generator.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type {
  ConsortiumMatchResult,
  ConsortiumRoleResult,
  ModelRunnerOptions,
  ScoredMatch,
  SuggestedPartner,
} from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import { findOffersForNeedPure } from './one-way.ts'
import {
  buildSyntheticNeedForRole,
  parseRoleDefinitions,
  passHardGate,
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'

export function findConsortiumMatchesPure(
  leadNeed: OpportunityPost,
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  options: ModelRunnerOptions = {},
): ConsortiumMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const roleDefs = parseRoleDefinitions(leadNeed.attributes)
  const roles = roleDefs.map((roleDef) => roleDef.role)

  if (roles.length === 0) {
    const oneWay = findOffersForNeedPure(leadNeed, offerPosts, resolvedConfig, canonical, {
      topN: options.topN ?? 10,
      maxCandidates: options.maxCandidates,
    })
    return {
      model: 'consortium',
      roles: ['General'],
      roleResults: [],
      complete: oneWay.matches.length > 0,
      matches: oneWay.matches.map((match) => ({ ...match, role: 'General' })),
    }
  }

  const threshold = resolveThreshold(resolvedConfig)
  const leadNorm = resolveNormalized(leadNeed, canonical, resolvedConfig)
  const usedCreatorIds = new Set(leadNeed.creatorId ? [leadNeed.creatorId] : [])
  const suggestedPartners: SuggestedPartner[] = []
  const roleResults: ConsortiumRoleResult[] = []

  for (const roleDef of roleDefs) {
    const role = roleDef.role
    const syntheticNeed = buildSyntheticNeedForRole(leadNeed, leadNorm, roleDef)
    const candidates = getCandidates(syntheticNeed, offerPosts, resolvedConfig, {
      needNormalized: syntheticNeed.normalized,
      maxCandidates: options.maxCandidates ?? 50,
    })

    let best: OpportunityPost | null = null
    let bestScore = threshold
    for (const offer of candidates) {
      if (offer.creatorId && usedCreatorIds.has(offer.creatorId)) continue
      const offerNorm = resolveNormalized(offer, canonical, resolvedConfig)
      if (!passHardGate(syntheticNeed, offer, syntheticNeed.normalized ?? {}, offerNorm, resolvedConfig)) {
        continue
      }
      const { score } = scorePair(
        syntheticNeed,
        offer,
        resolvedConfig,
        syntheticNeed.normalized,
        offerNorm,
      )
      if (score > bestScore) {
        bestScore = score
        best = offer
      }
    }

    if (best) {
      if (best.creatorId) usedCreatorIds.add(best.creatorId)
      roleResults.push({
        role,
        opportunityId: best.id,
        creatorId: best.creatorId,
        matchScore: bestScore,
      })
      suggestedPartners.push({
        opportunityId: best.id,
        creatorId: best.creatorId,
        role,
      })
    }
  }

  const aggregateScore = roleResults.length > 0
    ? roleResults.reduce((sum, result) => sum + result.matchScore, 0) / roleResults.length
    : 0
  const complete = roleResults.length === roles.length

  const breakdown = roleResults.reduce<Record<string, number>>((accumulator, result) => {
    accumulator[result.role] = result.matchScore
    return accumulator
  }, {})

  return {
    model: 'consortium',
    roles,
    roleResults,
    complete,
    matches: complete || roleResults.length > 0
      ? [{
        matchScore: aggregateScore,
        breakdown,
        suggestedPartners,
      }]
      : [],
  }
}
