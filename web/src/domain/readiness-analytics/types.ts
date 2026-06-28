import type { ProfileKind } from '@/domain/profile-readiness/types.ts'

export type ReadinessAnalyticsProfileInput = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
}

export type ReadinessAnalyticsProfileSummary = {
  readonly total: number
  readonly ready: number
  readonly needsReview: number
  readonly incomplete: number
  readonly averageScore: number
}

export type ReadinessAnalyticsOpportunitySummary = {
  readonly total: number
  readonly ready: number
  readonly needsReview: number
  readonly incomplete: number
  readonly draft: number
  readonly publishBlocked: number
  readonly averageScore: number
}

export type ReadinessAnalyticsResult = {
  readonly profiles: ReadinessAnalyticsProfileSummary
  readonly opportunities: ReadinessAnalyticsOpportunitySummary
}

export type ResolveProfileForOpportunity = (
  opportunity: object,
) => {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
} | null

export type BuildReadinessAnalyticsInput = {
  readonly profiles: readonly ReadinessAnalyticsProfileInput[]
  readonly opportunities: readonly object[]
  readonly resolveProfileForOpportunity: ResolveProfileForOpportunity
}
