import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import type { AnalyticsExplainabilitySnapshot } from './analytics-types.ts'
import { ANALYTICS_REASON_CODES } from '../reason-codes/analytics.ts'
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
} from '../types/severity.ts'

export const ANALYTICS_ADAPTER_VERSION = '1.0.0' as const

export const ANALYTICS_ADAPTER_SCORE_WEIGHTS = {
  readinessCoverage: 30,
  matchingQuality: 30,
  funnelConversion: 25,
  dataConfidence: 15,
} as const

const INTELLIGENCE_ROUTES = {
  portfolio: '/intelligence/portfolio',
  funnel: '/intelligence/funnel',
  risk: '/intelligence/risk',
  execution: '/intelligence/execution',
} as const

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveGeneratedAt(input: AnalyticsExplainabilitySnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function hasInsufficientData(input: AnalyticsExplainabilitySnapshot): boolean {
  const readiness = input.readinessAnalytics
  const matching = input.matchingQualityAnalytics
  const profileTotal = readiness?.profileTotal ?? 0
  const opportunityTotal = readiness?.opportunityTotal ?? 0
  const matchTotal = matching?.totalMatches ?? 0
  return profileTotal + opportunityTotal + matchTotal < 3
}

function readinessCoverageScore(
  input: AnalyticsExplainabilitySnapshot,
): number {
  const readiness = input.readinessAnalytics
  if (!readiness) return 0

  const profileDenom = Math.max(1, readiness.profileTotal)
  const oppDenom = Math.max(1, readiness.opportunityTotal)
  const profileReadyRate = (readiness.profileReady / profileDenom) * 100
  const oppReadyRate = (readiness.opportunityReady / oppDenom) * 100
  return roundScore((profileReadyRate + oppReadyRate) / 2)
}

function matchingQualityScore(
  input: AnalyticsExplainabilitySnapshot,
): number {
  const matching = input.matchingQualityAnalytics
  if (!matching) return 0
  return roundScore(
    (matching.averageMatchScore +
      matching.acceptanceRate +
      matching.negotiationRate +
      matching.dealConversionRate) /
      4,
  )
}

function funnelConversionScore(
  input: AnalyticsExplainabilitySnapshot,
): number {
  const matching = input.matchingQualityAnalytics
  if (!matching || matching.totalMatches === 0) return 0
  return roundScore(
    matching.acceptanceRate * 0.4 +
      matching.negotiationRate * 0.35 +
      matching.dealConversionRate * 0.25,
  )
}

function dataConfidenceScore(input: AnalyticsExplainabilitySnapshot): number {
  return hasInsufficientData(input) ? 25 : 90
}

function computeAnalyticsScore(input: AnalyticsExplainabilitySnapshot): number {
  const readiness = readinessCoverageScore(input)
  const matching = matchingQualityScore(input)
  const funnel = funnelConversionScore(input)
  const confidence = dataConfidenceScore(input)

  const weighted =
    (readiness * ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage +
      matching * ANALYTICS_ADAPTER_SCORE_WEIGHTS.matchingQuality +
      funnel * ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion +
      confidence * ANALYTICS_ADAPTER_SCORE_WEIGHTS.dataConfidence) /
    100

  return roundScore(weighted)
}

function resolveHealth(score: number): (typeof HEALTH)[keyof typeof HEALTH] {
  if (score >= 85) return HEALTH.EXCELLENT
  if (score >= 70) return HEALTH.GOOD
  if (score >= 50) return HEALTH.WARNING
  return HEALTH.CRITICAL
}

function hasNegativeTrend(input: AnalyticsExplainabilitySnapshot): boolean {
  const matching = input.matchingQualityAnalytics
  if (!matching) return false
  return (
    matching.acceptanceRate < 35 ||
    matching.negotiationRate < 25 ||
    matching.dealConversionRate < 15
  )
}

function buildReasons(
  input: AnalyticsExplainabilitySnapshot,
): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = []

  if (hasInsufficientData(input)) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      message: 'Insufficient portfolio data to produce high-confidence analytics.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'data',
    })
  }

  if (hasNegativeTrend(input)) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      message: 'Funnel conversion rates are below healthy marketplace benchmarks.',
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'funnel',
    })
  }

  const readiness = input.readinessAnalytics
  if (readiness && readiness.opportunityPublishBlocked > 0) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
      message: `${readiness.opportunityPublishBlocked} opportunities are publish-blocked.`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'readiness',
    })
  }

  if (input.periodLabel) {
    reasons.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      message: `Analytics period: ${input.periodLabel}`,
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'period',
    })
  }

  return reasons
}

function buildBlockers(
  input: AnalyticsExplainabilitySnapshot,
): readonly BlockingFactor[] {
  const blockers: BlockingFactor[] = []

  for (const risk of input.riskBlockers ?? []) {
    if (risk.count <= 0) continue
    blockers.push({
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      severity: EXPLANATION_SEVERITY.WARNING,
      blockingEntity: input.entityId,
      resolutionHint: risk.href
        ? `Review details at ${risk.href}`
        : 'Investigate blocked workload in intelligence views.',
    })
  }

  return blockers
}

function buildStrengths(
  input: AnalyticsExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []
  const matching = input.matchingQualityAnalytics

  if (matching && matching.acceptanceRate >= 60) {
    strengths.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      label: 'Healthy match acceptance rate',
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion,
    })
  }

  const readiness = input.readinessAnalytics
  if (readiness && readiness.profileReady >= readiness.profileTotal * 0.7) {
    strengths.push({
      code: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      label: 'Strong profile readiness coverage',
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: AnalyticsExplainabilitySnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []
  const matching = input.matchingQualityAnalytics

  if (hasNegativeTrend(input)) {
    weaknesses.push({
      code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      label: 'Funnel conversion below target',
      impactPercent: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion,
    })
  }

  if (matching) {
    for (const [matchType, entry] of Object.entries(matching.byMatchType)) {
      if (entry.total >= 3 && entry.accepted === 0) {
        weaknesses.push({
          code: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
          label: `No accepted matches for ${matchType.replace('_', ' ')} topology`,
          impactPercent: 8,
        })
      }
    }
  }

  for (const risk of input.riskBlockers ?? []) {
    if (risk.count > 0) {
      weaknesses.push({
        code: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
        label: risk.label,
        impactPercent: 10,
      })
    }
  }

  return weaknesses
}

function buildRecommendationsFromSnapshot(
  input: AnalyticsExplainabilitySnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  let index = 0
  const score = computeAnalyticsScore(input)

  if (hasInsufficientData(input)) {
    recommendations.push({
      id: `analytics-rec-data-${index}`,
      label: 'Add more profiles and opportunities to improve analytics confidence',
      reasonCode: ANALYTICS_REASON_CODES.DATA_INSUFFICIENT,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 15,
      estimatedScore: roundScore(Math.min(100, score + 10)),
      href: INTELLIGENCE_ROUTES.portfolio,
      category: 'data',
      severity: EXPLANATION_SEVERITY.INFO,
    })
    index += 1
  }

  const readiness = input.readinessAnalytics
  if (readiness && readiness.opportunityPublishBlocked > 0) {
    recommendations.push({
      id: `analytics-rec-readiness-${index}`,
      label: 'Resolve publish-blocked opportunities',
      reasonCode: ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 18,
      estimatedScore: roundScore(Math.min(100, score + 12)),
      href: INTELLIGENCE_ROUTES.portfolio,
      category: 'readiness',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if (hasNegativeTrend(input)) {
    recommendations.push({
      id: `analytics-rec-funnel-${index}`,
      label: 'Drill into funnel conversion blockers',
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      priority: RECOMMENDATION_PRIORITY.HIGH,
      impactPercent: 20,
      estimatedScore: roundScore(Math.min(100, score + 15)),
      href: INTELLIGENCE_ROUTES.funnel,
      category: 'funnel',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
    index += 1
  }

  if ((input.riskBlockers?.length ?? 0) > 0) {
    recommendations.push({
      id: `analytics-rec-risk-${index}`,
      label: 'Review risk and blocker workload',
      reasonCode: ANALYTICS_REASON_CODES.TREND_NEGATIVE,
      priority: RECOMMENDATION_PRIORITY.MEDIUM,
      impactPercent: 12,
      estimatedScore: roundScore(Math.min(100, score + 8)),
      href: INTELLIGENCE_ROUTES.risk,
      category: 'risk',
      severity: EXPLANATION_SEVERITY.WARNING,
    })
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: AnalyticsExplainabilitySnapshot,
): readonly ScoreBreakdownEntry[] {
  return [
    {
      label: 'Readiness coverage',
      score: readinessCoverageScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.readinessCoverage,
      maxScore: 100,
      reasonCodes: hasInsufficientData(input)
        ? [ANALYTICS_REASON_CODES.DATA_INSUFFICIENT]
        : [],
    },
    {
      label: 'Matching quality',
      score: matchingQualityScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.matchingQuality,
      maxScore: 100,
      reasonCodes: [],
    },
    {
      label: 'Funnel conversion',
      score: funnelConversionScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.funnelConversion,
      maxScore: 100,
      reasonCodes: hasNegativeTrend(input)
        ? [ANALYTICS_REASON_CODES.TREND_NEGATIVE]
        : [],
    },
    {
      label: 'Data confidence',
      score: dataConfidenceScore(input),
      weight: ANALYTICS_ADAPTER_SCORE_WEIGHTS.dataConfidence,
      maxScore: 100,
      reasonCodes: hasInsufficientData(input)
        ? [ANALYTICS_REASON_CODES.FORECAST_LOW_CONFIDENCE]
        : [],
    },
  ]
}

function buildTimelineFromSnapshot(
  _input: AnalyticsExplainabilitySnapshot,
): readonly TimelineEvent[] {
  return []
}

function buildSummary(input: AnalyticsExplainabilitySnapshot, score: number): string {
  const period = input.periodLabel ? ` for ${input.periodLabel}` : ''
  if (hasInsufficientData(input)) {
    return `Analytics confidence ${Math.round(score)}%${period} — more portfolio data is needed.`
  }
  if (hasNegativeTrend(input)) {
    return `Analytics health ${Math.round(score)}%${period} — funnel conversion needs attention.`
  }
  return `Analytics health ${Math.round(score)}%${period} across readiness and matching quality.`
}

export function buildAnalyticsExplanation(
  input: AnalyticsExplainabilitySnapshot,
): ExplanationBundle {
  const score = computeAnalyticsScore(input)
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.ANALYTICS,
    entityId: input.entityId,
    score,
    health: resolveHealth(score),
    summary: buildSummary(input, score),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: ANALYTICS_ADAPTER_VERSION,
      locale: input.locale ?? 'en',
      source: 'analytics-adapter',
      tags: ['intelligence'],
      extensions: {
        readinessAnalytics: input.readinessAnalytics,
        matchingQualityAnalytics: input.matchingQualityAnalytics,
        riskBlockers: input.riskBlockers,
        periodLabel: input.periodLabel,
      },
    },
  }
}

export const analyticsExplainabilityAdapter: ExplainabilityAdapter<AnalyticsExplainabilitySnapshot> =
  {
    buildExplanation: buildAnalyticsExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
