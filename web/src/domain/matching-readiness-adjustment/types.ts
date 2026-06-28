import type { ProfileKind } from '@/domain/profile-readiness/types.ts'

export type ReadinessAdjustmentFactors = {
  readonly sourceProfileScore: number
  readonly targetProfileScore: number
  readonly sourceOpportunityScore: number
  readonly targetOpportunityScore: number
  readonly averageReadiness: number
}

export type ReadinessAdjustmentResult = {
  readonly baseScore: number
  readonly adjustedScore: number
  readonly adjustment: number
  readonly reason: string
  readonly factors: ReadinessAdjustmentFactors
}

export type CalculateReadinessAdjustmentInput = {
  readonly baseScore: number
  readonly sourceProfileReadiness: number
  readonly targetProfileReadiness: number
  readonly sourceOpportunityReadiness: number
  readonly targetOpportunityReadiness: number
}

export type ApplyReadinessAdjustmentInput = {
  readonly baseScore: number
  readonly sourceProfile?: object | null
  readonly targetProfile?: object | null
  readonly sourceProfileKind?: ProfileKind
  readonly targetProfileKind?: ProfileKind
  readonly sourceOpportunity?: object | null
  readonly targetOpportunity?: object | null
  /** Test-only override; defaults to ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT. */
  readonly featureEnabled?: boolean
}

export type ApplyReadinessAdjustmentResult = {
  readonly score: number
  readonly applied: boolean
  readonly adjustment?: number
  readonly reason?: string
}
