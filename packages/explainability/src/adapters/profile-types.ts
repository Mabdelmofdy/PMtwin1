export type ProfileReadinessStatus =
  | 'incomplete'
  | 'needs_review'
  | 'ready_for_matching'

export type ProfileKind = 'individual' | 'company'

/**
 * Minimal snapshot of profile readiness evaluation — decoupled from web domain types.
 * Web callers map `evaluateProfileReadiness()` output + rule totals into this shape.
 */
export type ProfileReadinessSnapshot = {
  readonly entityId: string
  readonly profileKind: ProfileKind
  readonly score: number
  readonly status: ProfileReadinessStatus
  readonly missingRequired: readonly string[]
  readonly missingRecommended: readonly string[]
  readonly recommendations: readonly string[]
  readonly requiredTotal: number
  readonly recommendedTotal: number
  readonly completionLocked?: boolean
  readonly createdAt?: string
  readonly evaluatedAt?: string
  readonly locale?: string
}
