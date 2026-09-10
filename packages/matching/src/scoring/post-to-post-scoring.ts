import { resolveWeights } from '../config/defaults.ts'
import {
  exchangeCompatibility,
  valueCompatibility as valueCompatibilityScore,
} from '../value/value-compatibility.ts'
import type { MatchingConfig } from '../types/matching-config.ts'
import type { ScoreFactorResult, ScorePairResult } from '../types/match-result.ts'
import type { NormalizedPost, OpportunityPost } from '../types/opportunity.ts'
import { sectorCategoryTokens } from '../candidates/candidate-generator.ts'
import {
  evaluateLocationCoverage,
  resolveCoverage,
} from '../normalize/location-coverage.ts'
import { labelFromScore } from './label-from-score.ts'

export { labelFromScore } from './label-from-score.ts'

export function attributeOverlap(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
): ScoreFactorResult {
  const needServices =
    (needNorm.requiredServices?.length ? needNorm.requiredServices : undefined)
    ?? (needNorm.skills?.length ? needNorm.skills : undefined)
    ?? []
  const offerServices =
    (offerNorm.offeredServices?.length ? offerNorm.offeredServices : undefined)
    ?? (offerNorm.skills?.length ? offerNorm.skills : undefined)
    ?? (offerNorm.requiredServices?.length ? offerNorm.requiredServices : undefined)
    ?? []

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

/** UTC midnight instants from ISO date-only strings; never local timezone. */
const MS_PER_UTC_DAY = 86_400_000

function parseUtcTimelineInstant(value: string | undefined): number | null {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

/** Inclusive calendar-day count for date-only UTC instants. */
function inclusiveUtcDayCount(startMs: number, endMs: number): number {
  if (endMs < startMs) return 0
  return Math.round((endMs - startMs) / MS_PER_UTC_DAY) + 1
}

/**
 * Timeline Fit = overlapping inclusive days / Need inclusive days.
 * Need is the reference window (existing denominator). Missing or incomplete
 * dates score 0 — they are not an overlap percentage.
 */
export function timelineFit(needNorm: NormalizedPost, offerNorm: NormalizedPost): ScoreFactorResult {
  const needEnd = needNorm.deadline ?? needNorm.timeline?.end
  const needStart = needNorm.timeline?.start
  const offerStart = offerNorm.availability?.start ?? offerNorm.timeline?.start
  const offerEnd = offerNorm.availability?.end ?? offerNorm.timeline?.end
  const nEnd = parseUtcTimelineInstant(needEnd)
  const nStart = parseUtcTimelineInstant(needStart)
  const oStart = parseUtcTimelineInstant(offerStart)
  const oEnd = parseUtcTimelineInstant(offerEnd)

  if (nStart == null || nEnd == null || oStart == null || oEnd == null) {
    return { score: 0, label: 'No Match' }
  }
  if (oStart > nEnd || nStart > oEnd) {
    return { score: 0, label: 'No Match' }
  }

  const needDays = inclusiveUtcDayCount(nStart, nEnd)
  if (needDays <= 0) {
    return { score: 0, label: 'No Match' }
  }

  const overlapDays = inclusiveUtcDayCount(
    Math.max(nStart, oStart),
    Math.min(nEnd, oEnd),
  )
  const score = Math.max(0, Math.min(1, overlapDays / needDays))
  return { score, label: labelFromScore(score) }
}

export function locationFit(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
  needAttributes?: Readonly<Record<string, unknown>>,
  offerAttributes?: Readonly<Record<string, unknown>>,
): ScoreFactorResult {
  const needCoverage = resolveCoverage(
    needNorm.location,
    needNorm.coverageScopes,
    needAttributes,
  )
  const offerCoverage = resolveCoverage(
    offerNorm.location,
    offerNorm.coverageScopes,
    offerAttributes,
  )
  const result = evaluateLocationCoverage(needCoverage, offerCoverage)
  return {
    score: result.score,
    label: labelFromScore(result.score),
    tier: result.tier,
    detail: result.label,
  }
}

export function reputationScore(offerNorm: NormalizedPost): ScoreFactorResult {
  const raw = offerNorm.reputation != null ? Number(offerNorm.reputation) : 0.5
  const score = Number.isNaN(raw) ? 0.5 : Math.max(0, Math.min(1, raw))
  return { score, label: labelFromScore(score) }
}

/**
 * Soft sector-category fit. Empty/missing categories score 1 (no penalty).
 * Mismatch scores 0 but never rejects a candidate.
 */
export function categoryFit(
  needNorm: NormalizedPost,
  offerNorm: NormalizedPost,
): ScoreFactorResult {
  const needCat = sectorCategoryTokens(needNorm)
  const offerCat = sectorCategoryTokens(offerNorm)
  if (needCat.length === 0 || offerCat.length === 0) {
    return { score: 1, label: 'Match', matched: 0, total: 0 }
  }
  const offerSet = new Set(offerCat)
  let matched = 0
  for (const category of needCat) {
    if (offerSet.has(category)) matched++
  }
  const score = matched / needCat.length
  return { score, label: labelFromScore(score), matched, total: needCat.length }
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
  const location = locationFit(nNorm, oNorm, needPost.attributes, offerPost.attributes)
  const reputation = reputationScore(oNorm)
  const category = categoryFit(nNorm, oNorm)
  const needSectorCount = sectorCategoryTokens(nNorm).length
  const offerSectorCount = sectorCategoryTokens(oNorm).length
  const categoryBonus =
    needSectorCount > 0 && offerSectorCount > 0
      ? category.score * (weights.CATEGORY_FIT ?? 0.05)
      : 0

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
        categoryFit: category.score,
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
        categoryFit: category.label,
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
    categoryFit: category.score,
    locationTier: location.tier,
    locationDetail: location.detail,
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
    categoryFit: category.label,
  }

  const score =
    (skill.score * (weights.SKILL_MATCH ?? weights.ATTRIBUTE_OVERLAP ?? 0.25)) +
    (exchange.score * (weights.EXCHANGE_COMPATIBILITY ?? 0.20)) +
    (value.score * (weights.VALUE_COMPATIBILITY ?? 0.20)) +
    (budget.score * (weights.BUDGET_FIT ?? 0.10)) +
    (timeline.score * (weights.TIMELINE ?? 0.10)) +
    (location.score * (weights.LOCATION ?? 0.10)) +
    (reputation.score * (weights.REPUTATION ?? 0.05)) +
    categoryBonus

  const rounded = Math.min(1, Math.round(score * 1000) / 1000)
  return { score: rounded, breakdown, labels }
}
