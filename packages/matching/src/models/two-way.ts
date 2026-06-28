import { barterValueEquivalence } from '../value/value-compatibility.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
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

      const scoreAtoB = scorePair(needB, offerA, resolvedConfig, normNeedB, normOfferA).score
      const scoreBtoA = scorePair(needA, offerB, resolvedConfig, normNeedA, normOfferB).score
      if (scoreAtoB < threshold || scoreBtoA < threshold) continue

      const pairScore = (scoreAtoB + scoreBtoA) / 2
      const equivalence = barterValueEquivalence(
        barterSidePost(needA, offerA),
        barterSidePost(needB, offerB),
      )
      matches.push({
        matchScore: pairScore,
        breakdown: { scoreAtoB, scoreBtoA },
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
