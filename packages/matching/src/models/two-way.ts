import { barterValueEquivalence } from '../value/value-compatibility.ts'
import { scorePair } from '../scoring/post-to-post-scoring.ts'
import { passesPair } from '../constraints/hard-constraints.ts'
import {
  diagnoseGateAndScore,
  summarizeDiagnostics,
  type MatchingCandidateDiagnostic,
} from '../diagnostics/matching-diagnostics.ts'
import type { CanonicalData } from '../types/canonical.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { ScoreBreakdown } from '../types/match-result.ts'
import type { ModelRunnerOptions, ScoredMatch, TwoWayMatchResult } from '../types/model-results.ts'
import type { OpportunityPost } from '../types/opportunity.ts'
import {
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
  const preferA = (a.locationFit ?? 0) >= (b.locationFit ?? 0)
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
    locationTier: preferA ? a.locationTier : b.locationTier,
    locationDetail: preferA ? a.locationDetail : b.locationDetail,
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
  const sourceId = String(anchorPost.id ?? '')
  const creatorIdA = anchorPost.creatorId
  if (!creatorIdA) {
    return {
      model: 'two_way',
      matches: [],
      diagnostic: summarizeDiagnostics(sourceId, []),
    }
  }

  const needA = needPosts.find((post) => post.creatorId === creatorIdA)
  const offerA = offerPosts.find((post) => post.creatorId === creatorIdA)
  if (!needA || !offerA) {
    return {
      model: 'two_way',
      matches: [],
      diagnostic: summarizeDiagnostics(sourceId, []),
    }
  }

  const normNeedA = resolveNormalized(needA, canonical, resolvedConfig)
  const normOfferA = resolveNormalized(offerA, canonical, resolvedConfig)
  const otherNeeds = needPosts.filter((post) => post.creatorId !== creatorIdA)
  const otherOffers = offerPosts.filter((post) => post.creatorId !== creatorIdA)

  const matches: ScoredMatch[] = []
  const diagnostics: MatchingCandidateDiagnostic[] = []

  for (const needB of otherNeeds) {
    const offersByCreator = otherOffers.filter((offer) => offer.creatorId === needB.creatorId)
    for (const offerB of offersByCreator) {
      const candidateId = String(offerB.id ?? needB.id ?? '')
      const normNeedB = resolveNormalized(needB, canonical, resolvedConfig)
      const normOfferB = resolveNormalized(offerB, canonical, resolvedConfig)

      const gateAtoB = passesPair(needB, offerA, resolvedConfig, {
        needNorm: normNeedB,
        offerNorm: normOfferA,
      })
      if (!gateAtoB.ok) {
        diagnostics.push(
          diagnoseGateAndScore({
            candidateOpportunityId: candidateId,
            gate: gateAtoB,
            threshold,
          }),
        )
        continue
      }

      const gateBtoA = passesPair(needA, offerB, resolvedConfig, {
        needNorm: normNeedA,
        offerNorm: normOfferB,
      })
      if (!gateBtoA.ok) {
        diagnostics.push(
          diagnoseGateAndScore({
            candidateOpportunityId: candidateId,
            gate: gateBtoA,
            threshold,
          }),
        )
        continue
      }

      const scoredAtoB = scorePair(needB, offerA, resolvedConfig, normNeedB, normOfferA)
      const scoredBtoA = scorePair(needA, offerB, resolvedConfig, normNeedA, normOfferB)

      if (scoredAtoB.score < threshold || scoredBtoA.score < threshold) {
        const weak = scoredAtoB.score <= scoredBtoA.score ? scoredAtoB : scoredBtoA
        diagnostics.push(
          diagnoseGateAndScore({
            candidateOpportunityId: candidateId,
            gate: { ok: true },
            scored: weak,
            threshold,
          }),
        )
        continue
      }

      const pairScore = (scoredAtoB.score + scoredBtoA.score) / 2
      const averaged = averageScoreBreakdown(scoredAtoB.breakdown, scoredBtoA.breakdown)
      const equivalence = barterValueEquivalence(
        barterSidePost(needA, offerA),
        barterSidePost(needB, offerB),
      )
      matches.push({
        matchScore: pairScore,
        breakdown: {
          ...averaged,
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
      diagnostics.push(
        diagnoseGateAndScore({
          candidateOpportunityId: candidateId,
          gate: { ok: true },
          scored: {
            score: pairScore,
            breakdown: averaged,
            labels: scoredAtoB.labels,
          },
          threshold,
        }),
      )
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore)
  return {
    model: 'two_way',
    matches,
    diagnostic: summarizeDiagnostics(sourceId, diagnostics),
  }
}
