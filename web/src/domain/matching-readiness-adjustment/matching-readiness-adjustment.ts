import type {
  CalculateReadinessAdjustmentInput,
  ReadinessAdjustmentResult,
} from '@/domain/matching-readiness-adjustment/types.ts'

/**
 * When false, matching engine must not apply readiness adjustments to live scores.
 * Design-only in Phase 7 — keep disabled until explicit integration approval.
 */
export const ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT = false

const MIN_SCORE = 0
const MAX_SCORE = 100

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function clampScore(value: number): number {
  return roundScore(Math.min(MAX_SCORE, Math.max(MIN_SCORE, value)))
}

function averageReadiness(scores: readonly number[]): number {
  const total = scores.reduce((sum, score) => sum + score, 0)
  return roundScore(total / scores.length)
}

function resolveAdjustment(average: number): { adjustment: number; reason: string } {
  if (average >= 90) {
    return {
      adjustment: 5,
      reason: `Average readiness ${average}: +5 bonus (tier >= 90)`,
    }
  }
  if (average >= 80) {
    return {
      adjustment: 3,
      reason: `Average readiness ${average}: +3 bonus (tier >= 80)`,
    }
  }
  if (average >= 70) {
    return {
      adjustment: 0,
      reason: `Average readiness ${average}: no adjustment (tier >= 70)`,
    }
  }
  if (average >= 60) {
    return {
      adjustment: -5,
      reason: `Average readiness ${average}: -5 penalty (tier < 70)`,
    }
  }
  return {
    adjustment: -10,
    reason: `Average readiness ${average}: -10 penalty (tier < 60)`,
  }
}

export function calculateReadinessAdjustment(
  input: CalculateReadinessAdjustmentInput,
): ReadinessAdjustmentResult {
  const sourceProfileScore = input.sourceProfileReadiness
  const targetProfileScore = input.targetProfileReadiness
  const sourceOpportunityScore = input.sourceOpportunityReadiness
  const targetOpportunityScore = input.targetOpportunityReadiness

  const factors = {
    sourceProfileScore,
    targetProfileScore,
    sourceOpportunityScore,
    targetOpportunityScore,
    averageReadiness: averageReadiness([
      sourceProfileScore,
      targetProfileScore,
      sourceOpportunityScore,
      targetOpportunityScore,
    ]),
  }

  const { adjustment, reason } = resolveAdjustment(factors.averageReadiness)
  const baseScore = roundScore(input.baseScore)

  return {
    baseScore,
    adjustedScore: clampScore(baseScore + adjustment),
    adjustment,
    reason,
    factors,
  }
}
