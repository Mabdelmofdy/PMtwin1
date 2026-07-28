import {
  averageScoreBreakdown,
  extractAndNormalize,
  scorePair,
  type OpportunityPost,
} from '@pm-twin/matching'
import type { Opportunity, PostMatch } from '@/types/domain.ts'
import { opportunityToPost } from '@/services/matching/opportunity-post-adapter.ts'
import { getMatchingEngineContext } from '@/infrastructure/matching/matching-engine-context.ts'

function hasFactorScores(breakdown: Readonly<Record<string, number>>): boolean {
  return (
    typeof breakdown.skillMatch === 'number' ||
    typeof breakdown.timelineFit === 'number' ||
    typeof breakdown.locationFit === 'number'
  )
}

/**
 * Recompute averaged skill/timeline/location factors for two-way matches
 * that were persisted before factor breakdown was stored.
 */
export function enrichTwoWayMatchScoreBreakdown(
  match: PostMatch,
  getOpportunity: (opportunityId: string) => Opportunity | undefined,
): Record<string, number> | null {
  if (match.matchType !== 'two_way') return null

  const existing = {
    ...(match.matchCriteria ?? {}),
    ...(match.payload?.breakdown ?? {}),
  }
  if (hasFactorScores(existing)) return null

  const sideA = match.payload?.sideA
  const sideB = match.payload?.sideB
  if (!sideA?.needId || !sideA.offerId || !sideB?.needId || !sideB.offerId) {
    return null
  }

  const needA = getOpportunity(sideA.needId)
  const offerA = getOpportunity(sideA.offerId)
  const needB = getOpportunity(sideB.needId)
  const offerB = getOpportunity(sideB.offerId)
  if (!needA || !offerA || !needB || !offerB) return null

  const { config, canonical } = getMatchingEngineContext()
  const toNorm = (post: OpportunityPost) =>
    post.normalized ?? extractAndNormalize(post, canonical, { config })

  const needAPost = opportunityToPost(needA)
  const offerAPost = opportunityToPost(offerA)
  const needBPost = opportunityToPost(needB)
  const offerBPost = opportunityToPost(offerB)

  const scoredAtoB = scorePair(
    needBPost,
    offerAPost,
    config,
    toNorm(needBPost),
    toNorm(offerAPost),
  )
  const scoredBtoA = scorePair(
    needAPost,
    offerBPost,
    config,
    toNorm(needAPost),
    toNorm(offerBPost),
  )

  const {
    rejected: _rejected,
    locationTier: _locationTier,
    locationDetail: _locationDetail,
    ...averaged
  } = averageScoreBreakdown(scoredAtoB.breakdown, scoredBtoA.breakdown)

  // Persist numeric factors only — locationTier/locationDetail are string metadata.
  return {
    ...averaged,
    scoreAtoB: scoredAtoB.score,
    scoreBtoA: scoredBtoA.score,
  }
}
