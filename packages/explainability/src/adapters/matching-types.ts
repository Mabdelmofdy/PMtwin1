export type MatchTopology = 'one_way' | 'two_way' | 'consortium' | 'circular'

export type MatchScoreLabel = 'Match' | 'Partial' | 'No Match'

export type MatchRecommendationTier = 'top' | 'good' | 'possible'

export type MatchBreakdownSnapshot = {
  readonly skillMatch: number
  readonly exchangeCompatibility: number
  readonly valueCompatibility: number
  readonly budgetFit: number
  readonly timelineFit: number
  readonly locationFit: number
  readonly reputation: number
  readonly serviceOverlapPct?: number
  readonly attributeOverlap?: number
  readonly rejected?: string
}

export type MatchLabelsSnapshot = {
  readonly skillMatch?: MatchScoreLabel
  readonly attributeOverlap?: MatchScoreLabel
  readonly exchangeCompatibility?: MatchScoreLabel
  readonly valueCompatibility?: MatchScoreLabel
  readonly budgetFit?: MatchScoreLabel
  readonly timelineFit?: MatchScoreLabel
  readonly locationFit?: MatchScoreLabel
  readonly reputation?: MatchScoreLabel
}

export type MatchRecommendationSnapshot = {
  readonly tier: MatchRecommendationTier
  readonly reason: string
  readonly actionRequired?: boolean
}

export type MatchHardGateFailure = {
  readonly code: string
  readonly message: string
}

/**
 * Minimal snapshot of matching evaluation — decoupled from `@pm-twin/matching` types.
 * Web callers map ranked match results into this shape (E7).
 */
export type MatchExplainabilitySnapshot = {
  readonly entityId: string
  /** 0–1 or 0–100 — normalized to 0–100 in the adapter. */
  readonly matchScore: number
  readonly topology?: MatchTopology
  readonly topologyReason?: string
  readonly breakdown: MatchBreakdownSnapshot
  readonly labels?: MatchLabelsSnapshot
  readonly recommendation?: MatchRecommendationSnapshot
  readonly hardGateFailure?: MatchHardGateFailure
  readonly counterpartEntityId?: string
  readonly evaluatedAt?: string
  readonly locale?: string
}
