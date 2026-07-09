import type {
  DashboardExplainabilitySnapshot,
  Recommendation,
} from '@pm-twin/explainability'
import type { ReadinessAnalyticsResult } from '@/domain/readiness-analytics/types.ts'
import type { MatchingQualityResult } from '@/domain/matching-quality/types.ts'

export type DashboardSnapshotInput = {
  readonly entityId: string
  readonly profileScore?: number
  readonly vettingScore?: number
  readonly opportunityCount?: number
  readonly matchCount?: number
  readonly negotiationCount?: number
  readonly dealCount?: number
  readonly contractCount?: number
  readonly aggregatedRecommendations?: readonly Recommendation[]
  readonly heroMetric?: DashboardExplainabilitySnapshot['heroMetric']
  readonly readinessAnalytics?: ReadinessAnalyticsResult
  readonly matchingQualityAnalytics?: MatchingQualityResult
}

export type DashboardSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
}

export function buildDashboardExplainabilitySnapshot(
  input: DashboardSnapshotInput,
  options?: DashboardSnapshotOptions,
): DashboardExplainabilitySnapshot {
  return {
    entityId: input.entityId,
    profileScore: input.profileScore,
    vettingScore: input.vettingScore,
    opportunityCount: input.opportunityCount,
    matchCount: input.matchCount,
    negotiationCount: input.negotiationCount,
    dealCount: input.dealCount,
    contractCount: input.contractCount,
    aggregatedRecommendations: input.aggregatedRecommendations,
    heroMetric: input.heroMetric,
    evaluatedAt: options?.evaluatedAt ?? new Date().toISOString(),
    locale: options?.locale ?? 'en',
  }
}
