import type { Recommendation } from '../types/recommendation.ts'

export type DashboardHeroMetric = {
  readonly label: string
  readonly value: string | number
}

/**
 * Workspace-level dashboard snapshot — decoupled from web analytics aggregates.
 * Web callers map profile/vetting counts and cross-engine recommendations here (E9).
 */
export type DashboardExplainabilitySnapshot = {
  readonly entityId: string
  readonly profileScore?: number
  readonly vettingScore?: number
  readonly opportunityCount?: number
  readonly matchCount?: number
  readonly negotiationCount?: number
  readonly dealCount?: number
  readonly contractCount?: number
  readonly aggregatedRecommendations?: readonly Recommendation[]
  readonly heroMetric?: DashboardHeroMetric
  readonly evaluatedAt?: string
  readonly locale?: string
}
