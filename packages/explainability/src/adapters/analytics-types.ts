export type AnalyticsReadinessSummary = {
  readonly profileTotal: number
  readonly profileReady: number
  readonly profileNeedsReview: number
  readonly profileIncomplete: number
  readonly profileAverageScore: number
  readonly opportunityTotal: number
  readonly opportunityReady: number
  readonly opportunityNeedsReview: number
  readonly opportunityIncomplete: number
  readonly opportunityDraft: number
  readonly opportunityPublishBlocked: number
  readonly opportunityAverageScore: number
}

export type AnalyticsMatchTypeBreakdown = {
  readonly total: number
  readonly accepted: number
  readonly confirmed: number
}

export type AnalyticsMatchingQualitySummary = {
  readonly averageProfileReadiness: number
  readonly averageOpportunityReadiness: number
  readonly averageMatchScore: number
  readonly totalMatches: number
  readonly acceptedMatches: number
  readonly acceptanceRate: number
  readonly negotiationsStarted: number
  readonly negotiationRate: number
  readonly dealsCreated: number
  readonly dealConversionRate: number
  readonly byMatchType: Readonly<
    Record<string, AnalyticsMatchTypeBreakdown>
  >
}

export type AnalyticsRiskBlocker = {
  readonly label: string
  readonly count: number
  readonly href?: string
}

/**
 * Intelligence/analytics snapshot — decoupled from web domain aggregates (E9).
 */
export type AnalyticsExplainabilitySnapshot = {
  readonly entityId: string
  readonly readinessAnalytics?: AnalyticsReadinessSummary
  readonly matchingQualityAnalytics?: AnalyticsMatchingQualitySummary
  readonly riskBlockers?: readonly AnalyticsRiskBlocker[]
  readonly periodLabel?: string
  readonly evaluatedAt?: string
  readonly locale?: string
}
