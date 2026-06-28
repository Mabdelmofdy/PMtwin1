import { resolveWeights } from '../config/defaults.ts'
import {
  exchangeCompatibility,
  valueCompatibility as valueCompatibilityScore,
} from '../value/value-compatibility.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { ScoreFactorResult, ScorePairResult } from '../types/match-result.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'
import { labelFromScore } from './label-from-score.ts'

export { labelFromScore } from './label-from-score.ts'

export function attributeOverlap(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
): ScoreFactorResult {
  const needServices = needNorm.requiredServices ?? needNorm.skills ?? []
  const offerServices = offerNorm.offeredServices ?? offerNorm.skills ?? []

  if (!needServices.length) return { score: 1, label: 'Match', matched: 0, total: 0 }

  const needSet = new Set(needServices.map((service) => String(service).toLowerCase()))
  const offerSet = new Set(offerServices.map((service) => String(service).toLowerCase()))

  let matched = 0
  needSet.forEach((service) => {
    if (offerSet.has(service)) matched++
  })

  const score = matched / needSet.size
  return { score, label: labelFromScore(score), matched, total: needSet.size }
}

export function exchangeCompatibilityFactor(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
): ScoreFactorResult {
  const score = exchangeCompatibility(needPost, offerPost)
  return { score, label: labelFromScore(score) }
}

export function valueCompatibilityFactor(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
): ScoreFactorResult {
  const score = valueCompatibilityScore(needPost, offerPost)
  return { score, label: labelFromScore(score) }
}

export function budgetFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult {
  const needB = needNorm.budget ?? {}
  const offerB = offerNorm.budget ?? {}
  const needMin = needB.min != null ? needB.min : 0
  const needMax = needB.max != null ? needB.max : Number.POSITIVE_INFINITY
  const offerMin = offerB.min != null ? offerB.min : 0
  const offerMax = offerB.max != null ? offerB.max : Number.POSITIVE_INFINITY
  if (
    needMax === Number.POSITIVE_INFINITY
    && needMin === 0
    && offerMin === 0
    && offerMax === Number.POSITIVE_INFINITY
  ) {
    return { score: 1, label: 'Match' }
  }
  const overlapMin = Math.max(needMin, offerMin)
  const overlapMax = Math.min(needMax, offerMax)
  if (overlapMin > overlapMax) return { score: 0, label: 'No Match' }
  const needSpan = needMax - needMin
  const overlapSpan = overlapMax - overlapMin
  const score = needSpan > 0 ? overlapSpan / needSpan : 1
  return { score, label: labelFromScore(score) }
}

export function timelineFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult {
  const needEnd = needNorm.deadline ?? needNorm.timeline?.end
  const needStart = needNorm.timeline?.start
  const offerStart = offerNorm.availability?.start ?? offerNorm.timeline?.start
  const offerEnd = offerNorm.availability?.end ?? offerNorm.timeline?.end
  const toDate = (value: string | undefined): number | null => (value ? new Date(value).getTime() : null)
  const nEnd = toDate(needEnd)
  const nStart = toDate(needStart)
  const oStart = toDate(offerStart)
  const oEnd = toDate(offerEnd)
  if (nEnd == null && nStart == null && oStart == null && oEnd == null) {
    return { score: 1, label: 'Match' }
  }
  if (nEnd != null && oStart != null && oStart > nEnd) return { score: 0, label: 'No Match' }
  if (oEnd != null && nStart != null && nStart > oEnd) return { score: 0, label: 'No Match' }
  if (nStart != null && nEnd != null && oStart != null && oEnd != null) {
    const overlap = Math.max(0, Math.min(nEnd, oEnd) - Math.max(nStart, oStart))
    const needLen = nEnd - nStart
    const score = needLen > 0 ? overlap / needLen : 0.5
    return { score, label: labelFromScore(score) }
  }
  return { score: 0.5, label: 'Partial' }
}

export function locationFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult {
  const needLoc = (needNorm.location ?? '').toLowerCase()
  const offerLoc = (offerNorm.location ?? '').toLowerCase()
  if (needLoc === 'remote' || offerLoc === 'remote') return { score: 1, label: 'Match' }
  if (needLoc === offerLoc) return { score: 1, label: 'Match' }
  if (needLoc === 'ksa' && offerLoc) return { score: 0.5, label: 'Partial' }
  if (offerLoc === 'ksa' && needLoc) return { score: 0.5, label: 'Partial' }
  return { score: 0, label: 'No Match' }
}

export function reputationScore(offerNorm: NormalizedPost): ScoreFactorResult {
  const raw = offerNorm.reputation != null ? Number(offerNorm.reputation) : 0.5
  const score = Number.isNaN(raw) ? 0.5 : Math.max(0, Math.min(1, raw))
  return { score, label: labelFromScore(score) }
}

export function scorePair(
  needPost: OpportunityPost,
  offerPost: OpportunityPost,
  config: MatchingConfig,
  normalizedNeed?: NormalizedPost,
  normalizedOffer?: NormalizedPost,
): ScorePairResult {
  const nNorm = normalizedNeed ?? needPost.normalized ?? {}
  const oNorm = normalizedOffer ?? offerPost.normalized ?? {}
  const weights = resolveWeights(config)

  const skill = attributeOverlap(nNorm, oNorm)
  const exchange = exchangeCompatibilityFactor(needPost, offerPost)
  const value = valueCompatibilityFactor(needPost, offerPost)
  const budget = budgetFit(nNorm, oNorm)
  const timeline = timelineFit(nNorm, oNorm)
  const location = locationFit(nNorm, oNorm)
  const reputation = reputationScore(oNorm)

  const minSkillForScore = config.MIN_SKILL_SCORE_FOR_MATCH ?? 0.50
  if ((nNorm.requiredServices?.length ?? 0) > 0 && skill.score < minSkillForScore) {
    return {
      score: 0,
      breakdown: {
        skillMatch: skill.score,
        attributeOverlap: skill.score,
        serviceOverlapPct: skill.score,
        exchangeCompatibility: exchange.score,
        valueCompatibility: value.score,
        budgetFit: budget.score,
        timelineFit: timeline.score,
        locationFit: location.score,
        reputation: reputation.score,
        rejected: 'skill_floor',
      },
      labels: {
        skillMatch: skill.label,
        attributeOverlap: skill.label,
        exchangeCompatibility: exchange.label,
        valueCompatibility: value.label,
        budgetFit: budget.label,
        timelineFit: timeline.label,
        locationFit: location.label,
        reputation: reputation.label,
      },
    }
  }

  const breakdown = {
    skillMatch: skill.score,
    attributeOverlap: skill.score,
    serviceOverlapPct: skill.score,
    exchangeCompatibility: exchange.score,
    valueCompatibility: value.score,
    budgetFit: budget.score,
    timelineFit: timeline.score,
    locationFit: location.score,
    reputation: reputation.score,
  }

  const labels = {
    skillMatch: skill.label,
    attributeOverlap: skill.label,
    exchangeCompatibility: exchange.label,
    valueCompatibility: value.label,
    budgetFit: budget.label,
    timelineFit: timeline.label,
    locationFit: location.label,
    reputation: reputation.label,
  }

  const score =
    (skill.score * (weights.SKILL_MATCH ?? weights.ATTRIBUTE_OVERLAP ?? 0.25)) +
    (exchange.score * (weights.EXCHANGE_COMPATIBILITY ?? 0.20)) +
    (value.score * (weights.VALUE_COMPATIBILITY ?? 0.20)) +
    (budget.score * (weights.BUDGET_FIT ?? 0.10)) +
    (timeline.score * (weights.TIMELINE ?? 0.10)) +
    (location.score * (weights.LOCATION ?? 0.10)) +
    (reputation.score * (weights.REPUTATION ?? 0.05))

  const rounded = Math.min(1, Math.round(score * 1000) / 1000)
  return { score: rounded, breakdown, labels }
}
