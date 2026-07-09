import type { AnalyticsExplainabilitySnapshot } from '@pm-twin/explainability'
import type { ReadinessAnalyticsResult } from '@/domain/readiness-analytics/types.ts'
import type { MatchingQualityResult } from '@/domain/matching-quality/types.ts'

export type AnalyticsRiskBlockerInput = {
  readonly label: string
  readonly count: number
  readonly href?: string
}

export type AnalyticsSnapshotInput = {
  readonly entityId: string
  readonly readinessAnalytics?: ReadinessAnalyticsResult
  readonly matchingQualityAnalytics?: MatchingQualityResult
  readonly riskBlockers?: readonly AnalyticsRiskBlockerInput[]
  readonly periodLabel?: string
}

export type AnalyticsSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

function mapReadinessSummary(
  readiness: ReadinessAnalyticsResult,
): AnalyticsExplainabilitySnapshot['readinessAnalytics'] {
  return {
    profileTotal: readiness.profiles.total,
    profileReady: readiness.profiles.ready,
    profileNeedsReview: readiness.profiles.needsReview,
    profileIncomplete: readiness.profiles.incomplete,
    profileAverageScore: readiness.profiles.averageScore,
    opportunityTotal: readiness.opportunities.total,
    opportunityReady: readiness.opportunities.ready,
    opportunityNeedsReview: readiness.opportunities.needsReview,
    opportunityIncomplete: readiness.opportunities.incomplete,
    opportunityDraft: readiness.opportunities.draft,
    opportunityPublishBlocked: readiness.opportunities.publishBlocked,
    opportunityAverageScore: readiness.opportunities.averageScore,
  }
}

function mapMatchingSummary(
  matching: MatchingQualityResult,
): AnalyticsExplainabilitySnapshot['matchingQualityAnalytics'] {
  return {
    averageProfileReadiness: matching.averageProfileReadiness,
    averageOpportunityReadiness: matching.averageOpportunityReadiness,
    averageMatchScore: matching.averageMatchScore,
    totalMatches: matching.totalMatches,
    acceptedMatches: matching.acceptedMatches,
    acceptanceRate: matching.acceptanceRate,
    negotiationsStarted: matching.negotiationsStarted,
    negotiationRate: matching.negotiationRate,
    dealsCreated: matching.dealsCreated,
    dealConversionRate: matching.dealConversionRate,
    byMatchType: matching.byMatchType,
  }
}

export function buildAnalyticsExplainabilitySnapshot(
  input: AnalyticsSnapshotInput,
  options?: AnalyticsSnapshotOptions,
): AnalyticsExplainabilitySnapshot {
  return {
    entityId: input.entityId,
    readinessAnalytics: input.readinessAnalytics
      ? mapReadinessSummary(input.readinessAnalytics)
      : undefined,
    matchingQualityAnalytics: input.matchingQualityAnalytics
      ? mapMatchingSummary(input.matchingQualityAnalytics)
      : undefined,
    riskBlockers: input.riskBlockers,
    periodLabel: input.periodLabel,
    evaluatedAt: options?.evaluatedAt ?? new Date().toISOString(),
    locale: options?.locale ?? 'en',
  }
}
