import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type { ProfileKind, ProfileReadinessProfile } from '@/domain/profile-readiness/types.ts'
import {
  calculateReadinessAdjustment,
  ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT,
} from '@/domain/matching-readiness-adjustment/matching-readiness-adjustment.ts'
import type {
  ApplyReadinessAdjustmentInput,
  ApplyReadinessAdjustmentResult,
} from '@/domain/matching-readiness-adjustment/types.ts'

/**
 * PostMatch `matchScore` is stored on a 0–1 fractional scale in the web app.
 * Readiness adjustments operate on a 0–100 scale, then convert back to 0–1 when needed.
 */
export function isFractionalMatchScore(score: number): boolean {
  return score > 0 && score <= 1
}

export function normalizeMatchScoreToPercent(score: number): number {
  return isFractionalMatchScore(score) ? score * 100 : score
}

export function denormalizeMatchScoreFromPercent(
  score: number,
  storedAsFraction: boolean,
): number {
  const rounded = Math.round(score * 100) / 100
  return storedAsFraction ? rounded / 100 : rounded
}

function resolveProfileKind(
  profile: object | null | undefined,
  explicit?: ProfileKind,
): ProfileKind {
  if (explicit) return explicit
  return (profile as { type?: string } | undefined)?.type === 'company'
    ? 'company'
    : 'individual'
}

function hasCompleteReadinessContext(input: ApplyReadinessAdjustmentInput): boolean {
  return (
    input.sourceProfile != null &&
    input.targetProfile != null &&
    input.sourceOpportunity != null &&
    input.targetOpportunity != null
  )
}

export function applyReadinessAdjustmentIfEnabled(
  input: ApplyReadinessAdjustmentInput,
): ApplyReadinessAdjustmentResult {
  const enabled = input.featureEnabled ?? ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT
  const storedAsFraction = isFractionalMatchScore(input.baseScore)

  if (!enabled || !hasCompleteReadinessContext(input)) {
    return {
      score: input.baseScore,
      applied: false,
    }
  }

  const sourceProfileKind = resolveProfileKind(
    input.sourceProfile,
    input.sourceProfileKind,
  )
  const targetProfileKind = resolveProfileKind(
    input.targetProfile,
    input.targetProfileKind,
  )

  const sourceProfileReadiness = evaluateProfileReadiness({
    profileKind: sourceProfileKind,
    profile: input.sourceProfile as ProfileReadinessProfile,
  }).score
  const targetProfileReadiness = evaluateProfileReadiness({
    profileKind: targetProfileKind,
    profile: input.targetProfile as ProfileReadinessProfile,
  }).score
  const sourceOpportunityReadiness = evaluateOpportunityReadiness(
    input.sourceOpportunity as OpportunityReadinessOpportunity,
  ).score
  const targetOpportunityReadiness = evaluateOpportunityReadiness(
    input.targetOpportunity as OpportunityReadinessOpportunity,
  ).score

  const adjustmentResult = calculateReadinessAdjustment({
    baseScore: normalizeMatchScoreToPercent(input.baseScore),
    sourceProfileReadiness,
    targetProfileReadiness,
    sourceOpportunityReadiness,
    targetOpportunityReadiness,
  })

  return {
    score: denormalizeMatchScoreFromPercent(
      adjustmentResult.adjustedScore,
      storedAsFraction,
    ),
    applied: true,
    adjustment: adjustmentResult.adjustment,
    reason: adjustmentResult.reason,
  }
}
