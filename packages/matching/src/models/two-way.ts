import { barterValueEquivalence } from '../value/value-compatibility.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { ScoreBreakdown } from '../types/match-result.ts'
import type { ModelRunnerOptions, ScoredMatch, TwoWayMatchResult } from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import {
  passHardGate,
  resolveNormalized,
  resolveThreshold,
  withRunnerConfig,
} from './shared.ts'
import { barterSidePost, valueEquivalenceText } from './value-estimate.ts'

export { barterSidePost } from './value-estimate.ts'

function averageFactor(a: number, b: number): number {
  return Math.round(((a + b) / 2) * 1000) / 1000
}

/** Average directional factor scores for two-way display / persistence. */
export function averageScoreBreakdown(
  a: ScoreBreakdown,
  b: ScoreBreakdown,
): ScoreBreakdown {
  return {
    skillMatch: averageFactor(a.skillMatch, b.skillMatch),
    attributeOverlap: averageFactor(a.attributeOverlap, b.attributeOverlap),
    serviceOverlapPct: averageFactor(a.serviceOverlapPct, b.serviceOverlapPct),
    exchangeCompatibility: averageFactor(
      a.exchangeCompatibility,
      b.exchangeCompatibility,
    ),
    valueCompatibility: averageFactor(a.valueCompatibility, b.valueCompatibility),
    budgetFit: averageFactor(a.budgetFit, b.budgetFit),
    timelineFit: averageFactor(a.timelineFit, b.timelineFit),
    locationFit: averageFactor(a.locationFit, b.locationFit),
    reputation: averageFactor(a.reputation, b.reputation),
  }
}

export function findBarterMatchesPure(
  anchorPost: OpportunityPost,
  needPosts: readonly OpportunityPost[],
  offerPosts: readonly OpportunityPost[],
  config: MatchingConfig,
  canonical: CanonicalData = {},
  _options: ModelRunnerOptions = {},
): TwoWayMatchResult {
  const resolvedConfig = withRunnerConfig(config)
  const threshold = resolveThreshold(resolvedConfig)
  const creatorIdA = anchorPost.creatorId
  if (!creatorIdA) return { model: 'two_way', matches: [] }

  const needA = needPosts.find((post) => post.creatorId === creatorIdA)
  const offerA = offerPosts.find((post) => post.creatorId === creatorIdA)
  if (!needA || !offerA) return { model: 'two_way', matches: [] }

  const normNeedA = resolveNormalized(needA, canonical, resolvedConfig)
  const normOfferA = resolveNormalized(offerA, canonical, resolvedConfig)
  const otherNeeds = needPosts.filter((post) => post.creatorId !== creatorIdA)
  const otherOffers = offerPosts.filter((post) => post.creatorId !== creatorIdA)

  const matches: ScoredMatch[] = []
  for (const needB of otherNeeds) {
    const offersByCreator = otherOffers.filter((offer) => offer.creatorId === needB.creatorId)
    for (const offerB of offersByCreator) {
      const normNeedB = resolveNormalized(needB, canonical, resolvedConfig)
      const normOfferB = resolveNormalized(offerB, canonical, resolvedConfig)
      if (!passHardGate(needB, offerA, normNeedB, normOfferA, resolvedConfig)) continue
      if (!passHardGate(needA, offerB, normNeedA, normOfferB, resolvedConfig)) continue

      const scoredAtoB = scorePair(needB, offerA, resolvedConfig, normNeedB, normOfferA)
      const scoredBtoA = scorePair(needA, offerB, resolvedConfig, normNeedA, normOfferB)
      if (scoredAtoB.score < threshold || scoredBtoA.score < threshold) continue

      const pairScore = (scoredAtoB.score + scoredBtoA.score) / 2
      const equivalence = barterValueEquivalence(
        barterSidePost(needA, offerA),
        barterSidePost(needB, offerB),
      )
      matches.push({
        matchScore: pairScore,
        breakdown: {
          ...averageScoreBreakdown(scoredAtoB.breakdown, scoredBtoA.breakdown),
          scoreAtoB: scoredAtoB.score,
          scoreBtoA: scoredBtoA.score,
        },
        valueEquivalence: valueEquivalenceText(offerA, needB) ?? valueEquivalenceText(offerB, needA),
        valueAnalysis: { equivalence },
        suggestedPartners: [
          { opportunityId: needB.id, creatorId: needB.creatorId },
          { opportunityId: offerB.id, creatorId: offerB.creatorId },
        ],
        needOpportunityId: needB.id,
        offerOpportunityId: offerB.id,
      })
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore)
  return { model: 'two_way', matches }
}
