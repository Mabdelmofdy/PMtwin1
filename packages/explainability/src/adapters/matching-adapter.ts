import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  MATCH_ADAPTER_SCORE_WEIGHTS,
  MATCH_DIMENSION_LABELS,
  dimensionImprovementHint,
  isLowDimensionScore,
  labelFromDimensionScore,
  matchDimensionToReasonCode,
  matchHardGateCodeToReasonCode,
  matchTierToReasonCode,
  matchTopologyToReasonCode,
  type MatchDimensionKey,
} from './matching-field-map.ts'
import type {
  MatchBreakdownSnapshot,
  MatchExplainabilitySnapshot,
  MatchLabelsSnapshot,
  MatchScoreLabel,
} from './matching-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { MATCH_REASON_CODES } from '../reason-codes/match.ts'
import { ENGINE_ID } from '../types/engine.ts'
import { HEALTH } from '../types/health.ts'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { BlockingFactor } from '../types/blocking.ts'
import type {
  ExplanationReason,
  StrengthWeaknessEntry,
} from '../types/reason.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { ScoreBreakdownEntry } from '../types/score-breakdown.ts'
import type { TimelineEvent } from '../types/timeline.ts'
import {
  EXPLANATION_SEVERITY,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from '../types/severity.ts'

export const MATCHING_ADAPTER_VERSION = '1.0.0' as const

const SCORED_DIMENSIONS: readonly MatchDimensionKey[] = [
  'skillMatch',
  'exchangeCompatibility',
  'valueCompatibility',
  'budgetFit',
  'timelineFit',
  'locationFit',
  'reputation',
]

const SUPPLEMENTARY_DIMENSIONS: readonly MatchDimensionKey[] = [
  'attributeOverlap',
  'serviceOverlapPct',
]

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizeMatchScore(score: number): number {
  if (score <= 1) {
    return roundScore(score * 100)
  }
  return roundScore(score)
}

function resolveGeneratedAt(input: MatchExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function resolveHealth(
  scorePercent: number,
  recommendation?: MatchExplainabilitySnapshot['recommendation'],
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (recommendation?.tier === 'top') return HEALTH.EXCELLENT
  if (recommendation?.tier === 'good') return HEALTH.GOOD
  if (recommendation?.tier === 'possible') return HEALTH.WARNING

  if (scorePercent >= 85) return HEALTH.EXCELLENT
  if (scorePercent >= 70) return HEALTH.GOOD
  if (scorePercent >= 50) return HEALTH.WARNING
  return HEALTH.CRITICAL
}

function resolveLabel(
  dimension: MatchDimensionKey,
  score: number,
  breakdown: MatchBreakdownSnapshot,
  labels?: MatchLabelsSnapshot,
): MatchScoreLabel {
  const explicit = labels?.[dimension as keyof MatchLabelsSnapshot]
  if (explicit) return explicit

  if (
    (dimension === 'attributeOverlap' || dimension === 'serviceOverlapPct')
    && breakdown.skillMatch != null
  ) {
    const skillScore = breakdown.skillMatch
    if (Math.abs(score - skillScore) < 0.001) {
      return resolveLabel('skillMatch', skillScore, breakdown, labels)
    }
  }

  return labelFromDimensionScore(score)
}

function dimensionScore(
  breakdown: MatchBreakdownSnapshot,
  dimension: MatchDimensionKey,
): number | undefined {
  const value = breakdown[dimension as keyof MatchBreakdownSnapshot]
  if (typeof value !== 'number') return undefined
  return value
}

function activeDimensions(breakdown: MatchBreakdownSnapshot): MatchDimensionKey[] {
  const dimensions: MatchDimensionKey[] = [...SCORED_DIMENSIONS]
  for (const dimension of SUPPLEMENTARY_DIMENSIONS) {
    if (dimensionScore(breakdown, dimension) != null) {
      dimensions.push(dimension)
    }
  }
  return dimensions
}

function buildSummary(input: MatchExplainabilitySnapshot, scorePercent: number): string {
  if (input.hardGateFailure) {
    return `Match blocked — ${input.hardGateFailure.message}`
  }

  if (input.breakdown.rejected === 'skill_floor') {
    return 'Match rejected — skill overlap below minimum threshold.'
  }

  if (input.recommendation?.reason) {
    return input.recommendation.reason
  }

  const tier = input.recommendation?.tier
  if (tier === 'top') {
    return `Strong match at ${Math.round(scorePercent)}% — ready for contracting.`
  }
  if (tier === 'good') {
    return `Good match at ${Math.round(scorePercent)}% — review value terms.`
  }
  if (tier === 'possible') {
    return `Possible match at ${Math.round(scorePercent)}% — negotiation may be needed.`
  }

  return `Match score ${Math.round(scorePercent)}%.`
}

function buildReasons(
  input: MatchExplainabilitySnapshot,
  scorePercent: number,
): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = [
    {
      code: MATCH_REASON_CODES.SCORE_SUMMARY,
      message: `Match score ${Math.round(scorePercent)}%`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
      relatedEntityId: input.entityId,
    },
  ]

  if (input.topology) {
    reasons.push({
      code: matchTopologyToReasonCode(input.topology),
      message: input.topologyReason ?? `Matching topology: ${input.topology.replace('_', ' ')}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'topology',
      relatedEntityId: input.entityId,
    })
  }

  if (input.recommendation) {
    reasons.push({
      code: matchTierToReasonCode(input.recommendation.tier),
      message: input.recommendation.reason,
      severity:
        input.recommendation.tier === 'top'
          ? EXPLANATION_SEVERITY.INFO
          : input.recommendation.tier === 'good'
            ? EXPLANATION_SEVERITY.WARNING
            : EXPLANATION_SEVERITY.WARNING,
      category: 'recommendation',
      relatedEntityId: input.entityId,
    })
  }

  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension)
    if (score == null) continue

    const label = resolveLabel(dimension, score, input.breakdown, input.labels)
    if (label === 'Match') continue

    reasons.push({
      code: matchDimensionToReasonCode(dimension),
      message: `${MATCH_DIMENSION_LABELS[dimension]} is ${label.toLowerCase()} (${Math.round(score * 100)}%).`,
      severity:
        label === 'No Match'
          ? EXPLANATION_SEVERITY.CRITICAL
          : EXPLANATION_SEVERITY.WARNING,
      category: dimension,
      relatedEntityId: input.entityId,
    })
  }

  return reasons
}

function buildBlockers(input: MatchExplainabilitySnapshot): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  if (input.hardGateFailure) {
    blockers.push({
      reasonCode: matchHardGateCodeToReasonCode(input.hardGateFailure.code),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.counterpartEntityId ?? input.entityId,
      resolutionHint: input.hardGateFailure.message,
    })
  }

  if (input.breakdown.rejected === 'skill_floor') {
    blockers.push({
      reasonCode: MATCH_REASON_CODES.SKILL_LOW,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.counterpartEntityId ?? input.entityId,
      resolutionHint: 'Increase skill and service overlap above the minimum match threshold.',
    })
  }

  return blockers
}

function dimensionImpactPercent(dimension: MatchDimensionKey): number {
  return MATCH_ADAPTER_SCORE_WEIGHTS[dimension]
}

function buildStrengths(
  input: MatchExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  if (input.recommendation?.tier === 'top') {
    strengths.push({
      code: MATCH_REASON_CODES.TIER_TOP,
      label: 'Top-tier match recommendation',
      impactPercent: 100,
    })
  }

  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension)
    if (score == null) continue

    const label = resolveLabel(dimension, score, input.breakdown, input.labels)
    if (label !== 'Match') continue

    strengths.push({
      code: `MATCH_STRONG_${dimension.replace(/([A-Z])/g, '_$1').toUpperCase()}` as ReasonCode,
      label: MATCH_DIMENSION_LABELS[dimension],
      impactPercent: dimensionImpactPercent(dimension),
    })
  }

  return strengths
}

function buildWeaknesses(
  input: MatchExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension)
    if (score == null) continue

    const label = resolveLabel(dimension, score, input.breakdown, input.labels)
    if (label === 'Match') continue

    weaknesses.push({
      code: matchDimensionToReasonCode(dimension),
      label: MATCH_DIMENSION_LABELS[dimension],
      impactPercent: dimensionImpactPercent(dimension),
    })
  }

  return weaknesses
}

function recommendationPriority(
  tier: 'top' | 'good' | 'possible',
): (typeof RECOMMENDATION_PRIORITY)[keyof typeof RECOMMENDATION_PRIORITY] {
  if (tier === 'top') return RECOMMENDATION_PRIORITY.LOW
  if (tier === 'good') return RECOMMENDATION_PRIORITY.MEDIUM
  return RECOMMENDATION_PRIORITY.HIGH
}

function buildRecommendationsFromSnapshot(
  input: MatchExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  const currentScore = normalizeMatchScore(input.matchScore)
  let index = 0

  if (input.recommendation?.actionRequired) {
    recommendations.push({
      id: `matching-rec-action-${index}`,
      label: input.recommendation.reason,
      reasonCode: matchTierToReasonCode(input.recommendation.tier),
      priority: recommendationPriority(input.recommendation.tier),
      impactPercent: 100,
      estimatedScore: currentScore,
      category: 'action',
      severity:
        input.recommendation.tier === 'possible'
          ? EXPLANATION_SEVERITY.CRITICAL
          : EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  for (const dimension of activeDimensions(input.breakdown)) {
    const score = dimensionScore(input.breakdown, dimension)
    if (score == null || !isLowDimensionScore(score)) continue

    const impactPercent = dimensionImpactPercent(dimension)
    const reasonCode = matchDimensionToReasonCode(dimension)
    recommendations.push({
      id: `matching-rec-${dimension}-${index}`,
      label: dimensionImprovementHint(dimension),
      reasonCode,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent,
      estimatedScore: roundScore(Math.min(100, currentScore + impactPercent)),
      category: dimension,
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: MatchExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  return activeDimensions(input.breakdown).map((dimension) => {
    const rawScore = dimensionScore(input.breakdown, dimension) ?? 0
    const weight = MATCH_ADAPTER_SCORE_WEIGHTS[dimension]
    const label = resolveLabel(dimension, rawScore, input.breakdown, input.labels)
    const reasonCodes =
      label === 'Match'
        ? []
        : [matchDimensionToReasonCode(dimension)]

    return {
      label: MATCH_DIMENSION_LABELS[dimension],
      weight,
      score: weight > 0 ? roundScore((rawScore * weight)) : roundScore(rawScore * 100),
      maxScore: weight > 0 ? weight : 100,
      reasonCodes,
    }
  })
}

function buildTimelineFromSnapshot(
  input: MatchExplainabilitySnapshot,
): readonly TimelineEvent[] {
  const evaluatedAt = resolveGeneratedAt(input)
  const events: TimelineEvent[] = [
    {
      type: 'match-discovered',
      title: 'Match candidate discovered',
      description: input.counterpartEntityId
        ? `Counterpart ${input.counterpartEntityId} identified as a candidate.`
        : 'Match candidate identified during discovery.',
      timestamp: evaluatedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    },
    {
      type: 'match-evaluated',
      title: 'Match evaluated',
      description: buildSummary(input, normalizeMatchScore(input.matchScore)),
      timestamp: evaluatedAt,
      status:
        input.hardGateFailure || input.breakdown.rejected
          ? TIMELINE_EVENT_STATUS.BLOCKED
          : TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    },
  ]

  return events
}

export function buildMatchingExplanation(
  input: MatchExplainabilitySnapshot,
): ExplanationBundle {
  const scorePercent = normalizeMatchScore(input.matchScore)
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.MATCHING,
    entityId: input.entityId,
    score: scorePercent,
    health: resolveHealth(scorePercent, input.recommendation),
    summary: buildSummary(input, scorePercent),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input, scorePercent),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: MATCHING_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'matching-adapter',
      tags: [
        input.recommendation?.tier ?? 'unranked',
        input.topology ?? 'unknown-topology',
      ],
      extensions: {
        topology: input.topology ?? null,
        topologyReason: input.topologyReason ?? null,
        counterpartEntityId: input.counterpartEntityId ?? null,
        rejected: input.breakdown.rejected ?? null,
        hardGateFailure: input.hardGateFailure ?? null,
      },
    },
  }
}

export const matchingExplainabilityAdapter: ExplainabilityAdapter<MatchExplainabilitySnapshot> =
  {
    buildExplanation: buildMatchingExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
