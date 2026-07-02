import type { ProfileKind } from '@/domain/profile-readiness/types.ts'

export type MatchingQualityProfileInput = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
}

export type MatchTypeKey = 'one_way' | 'two_way' | 'consortium' | 'circular'

export type MatchTypeBreakdownEntry = {
  readonly total: number
  readonly accepted: number
  readonly confirmed: number
}

export type MatchingQualityResult = {
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
  /** Additive per-topology breakdown; top-level metrics remain type-agnostic. */
  readonly byMatchType: Readonly<Record<MatchTypeKey, MatchTypeBreakdownEntry>>
}

export type BuildMatchingQualityAnalyticsInput = {
  readonly profiles: readonly MatchingQualityProfileInput[]
  readonly opportunities: readonly object[]
  readonly matches: readonly object[]
  readonly negotiations: readonly object[]
  readonly deals: readonly object[]
}
